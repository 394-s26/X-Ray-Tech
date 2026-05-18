import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction, serverTimestamp, arrayUnion, updateDoc } from 'firebase/firestore';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import { auth, db } from './firebase';
import { markNotificationPermissionPromptAfterLogin } from './notifications';
import { deleteCurrentDeviceFcmToken } from './fcmTokenService';

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<void> => {
  await signInWithPopup(auth, googleProvider);
  markNotificationPermissionPromptAfterLogin();
};

export const signInWithEmail = async (email: string, password: string): Promise<void> => {
  await signInWithEmailAndPassword(auth, email, password);
  markNotificationPermissionPromptAfterLogin();
};

export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const snap = await getDoc(doc(db, 'usernames', username));
  return !snap.exists();
};

export const registerWithEmail = async (
  email: string,
  password: string,
  username: string,
): Promise<User> => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  await runTransaction(db, async txn => {
    const ref = doc(db, 'usernames', username);
    const snap = await txn.get(ref);
    if (snap.exists()) throw new Error('Username taken');
    txn.set(ref, { uid: user.uid });
    txn.set(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      username,
      accountCreatedDate: serverTimestamp(),
      setupCompleted: false,
    });
  });
  return user;
};

export const signOut = async (): Promise<void> => {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      await deleteCurrentDeviceFcmToken(uid);
    } catch {
      /* best-effort */
    }
  }
  await firebaseSignOut(auth);
};

export const fetchAppUser = async (uid: string): Promise<AppUser | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as AppUser) : null;
};

export const createStubAppUser = async (firebaseUser: User): Promise<AppUser> => {
  const base = (firebaseUser.displayName ?? firebaseUser.email ?? firebaseUser.uid)
    .split('@')[0]
    .replace(/\s+/g, '')
    .toLowerCase()
    .slice(0, 20) || firebaseUser.uid.slice(0, 12);

  // Find a username that isn't already taken, appending a random numeric suffix if needed.
  let username = base;
  while (!(await checkUsernameAvailable(username))) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    username = `${base.slice(0, 16)}${rand}`;
  }

  await runTransaction(db, async txn => {
    const usernameRef = doc(db, 'usernames', username);
    const snap = await txn.get(usernameRef);
    if (snap.exists()) throw new Error('Username taken');
    txn.set(usernameRef, { uid: firebaseUser.uid });
    txn.set(doc(db, 'users', firebaseUser.uid), {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      username,
      accountCreatedDate: serverTimestamp(),
      setupCompleted: false,
      photoURL: firebaseUser.photoURL ?? null,
    });
  });

  // Return a local stub so the caller can immediately render setup.
  // accountCreatedDate is null until Firestore resolves the server timestamp.
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    username,
    accountCreatedDate: null,
    setupCompleted: false,
  };
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<AppUser>
): Promise<void> => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

export const subscribeToAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

export async function createTeam(team: Team): Promise<void> {
  await setDoc(doc(db, 'teams', team.id), team);
}

export async function getTeamByCode(teamCode: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, 'teams', teamCode.toUpperCase()));
  return snap.exists() ? (snap.data() as Team) : null;
}

export async function addMemberToTeam(teamCode: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'teams', teamCode.toUpperCase()), { members: arrayUnion(uid) });
}

export async function fetchUsersByUids(uids: string[]): Promise<AppUser[]> {
  const results = await Promise.all(uids.map(uid => fetchAppUser(uid)));
  return results.filter((u): u is AppUser => u !== null);
}

export async function updateTeamCode(
  oldCode: string,
  newCode: string,
  leadUid: string,
): Promise<Team> {
  return runTransaction(db, async tx => {
    const oldRef = doc(db, 'teams', oldCode);
    const snap = await tx.get(oldRef);
    if (!snap.exists()) throw new Error('Team not found');
    const currentTeam = snap.data() as Team;
    tx.set(doc(db, 'teams', newCode), { ...currentTeam, id: newCode });
    tx.delete(oldRef);
    tx.update(doc(db, 'users', leadUid), { teamCode: newCode });
    for (const uid of currentTeam.members) {
      tx.update(doc(db, 'users', uid), { teamCode: newCode });
    }
    return { ...currentTeam, id: newCode };
  });
}

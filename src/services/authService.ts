import {
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import { auth, db } from './firebase';

const microsoftProvider = new OAuthProvider('microsoft.com');

export const signInWithMicrosoft = async (): Promise<void> => {
  await signInWithPopup(auth, microsoftProvider);
};

export const signInWithEmail = async (email: string, password: string): Promise<void> => {
  await signInWithEmailAndPassword(auth, email, password);
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

  // Find a username that isn't already taken, appending a numeric suffix if needed.
  let username = base;
  let suffix = 1;
  while (!(await checkUsernameAvailable(username))) {
    username = `${base.slice(0, 18)}${suffix++}`;
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

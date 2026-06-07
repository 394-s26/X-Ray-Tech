import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset,
  applyActionCode,
  deleteUser as firebaseDeleteUser,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import {
  collection, doc, getDoc, getDocs, query, setDoc, runTransaction, serverTimestamp,
  arrayUnion, arrayRemove, updateDoc, deleteDoc, where, writeBatch,
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import { auth, db, storage } from './firebase';
import { markNotificationPermissionPromptAfterLogin } from './notifications';
import { deleteCurrentDeviceFcmToken } from './fcmTokenService';
import type { Certification } from '../types/certification';

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

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const confirmPasswordResetWithCode = async (oobCode: string, newPassword: string): Promise<void> => {
  await confirmPasswordReset(auth, oobCode, newPassword);
};

export const applyAuthActionCode = async (oobCode: string): Promise<void> => {
  await applyActionCode(auth, oobCode);
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

export async function removeTeamMember(teamCode: string, memberUid: string): Promise<void> {
  await Promise.all([
    updateDoc(doc(db, 'teams', teamCode.toUpperCase()), { members: arrayRemove(memberUid) }),
    updateDoc(doc(db, 'users', memberUid), { teamCode: null, role: null }),
  ]);
}

export async function fetchUsersByUids(uids: string[]): Promise<AppUser[]> {
  const results = await Promise.all(uids.map(uid => fetchAppUser(uid)));
  return results.filter((u): u is AppUser => u !== null);
}

export async function fetchCertificatesForOwner(uid: string): Promise<Certification[]> {
  const q = query(collection(db, 'certificates'), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Certification);
}

export async function changeUsername(uid: string, oldUsername: string, newUsername: string): Promise<void> {
  await runTransaction(db, async tx => {
    const newRef = doc(db, 'usernames', newUsername);
    const snap = await tx.get(newRef);
    if (snap.exists()) throw new Error('Username taken');
    tx.delete(doc(db, 'usernames', oldUsername));
    tx.set(newRef, { uid });
    tx.update(doc(db, 'users', uid), { username: newUsername });
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.email) throw new Error('Not authenticated');
  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
}

export async function deleteAccount(appUser: AppUser): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  // Re-authenticate up front so a cancel/failure aborts before anything is deleted.
  // Google users have no password, so re-auth via popup; password users rely on a
  // recent login (the final firebaseDeleteUser surfaces requires-recent-login if stale).
  const isGoogle = currentUser.providerData.some(p => p.providerId === 'google.com');
  if (isGoogle) {
    await reauthenticateWithPopup(currentUser, googleProvider);
  }

  const certsCol = collection(db, 'certificates');
  const [ownerSnap, uidSnap] = await Promise.all([
    getDocs(query(certsCol, where('ownerId', '==', appUser.uid))),
    getDocs(query(certsCol, where('uid', '==', appUser.uid))),
  ]);
  const certDocs = [...ownerSnap.docs, ...uidSnap.docs];
  await Promise.all(
    certDocs.map(async d => {
      const data = d.data();
      const path: string | undefined = data.photoStoragePath ?? data.storagePath;
      if (path) {
        try { await deleteObject(storageRef(storage, path)); } catch { /* already gone */ }
      }
      await deleteDoc(d.ref);
    })
  );

  // Scantrons (uid-keyed).
  const scantronSnap = await getDocs(
    query(collection(db, 'scantrons'), where('uid', '==', appUser.uid)),
  );
  if (!scantronSnap.empty) {
    const batch = writeBatch(db);
    scantronSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  // FCM push-notification tokens across all of this user's devices.
  const fcmSnap = await getDocs(
    query(collection(db, 'fcmTokens'), where('uid', '==', appUser.uid)),
  );
  if (!fcmSnap.empty) {
    const batch = writeBatch(db);
    fcmSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  const cycleSnap = await getDocs(collection(db, 'users', appUser.uid, 'cycleCredits'));
  if (!cycleSnap.empty) {
    const batch = writeBatch(db);
    cycleSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  if (appUser.teamCode) {
    if (appUser.role === 'manager') {
      const teamSnap = await getDoc(doc(db, 'teams', appUser.teamCode));
      if (teamSnap.exists()) {
        const team = teamSnap.data() as Team;
        const memberBatch = writeBatch(db);
        team.members.forEach(uid => {
          if (uid !== appUser.uid) {
            memberBatch.update(doc(db, 'users', uid), { teamCode: null, role: null });
          }
        });
        await memberBatch.commit();
        await deleteDoc(doc(db, 'teams', appUser.teamCode));
      }
    } else {
      await updateDoc(doc(db, 'teams', appUser.teamCode), {
        members: arrayRemove(appUser.uid),
      });
    }
  }

  await deleteDoc(doc(db, 'usernames', appUser.username));
  await deleteDoc(doc(db, 'users', appUser.uid));
  await firebaseDeleteUser(currentUser);
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

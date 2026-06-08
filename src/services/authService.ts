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

export async function deleteAccount(appUser: AppUser, password?: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  // Firebase requires a recent login to delete the account, so re-authenticate
  // up front. Google accounts have no password and re-auth via popup; password
  // accounts re-auth with the password collected by the dialog.
  const providers = currentUser.providerData.map(p => p.providerId);
  if (providers.includes('google.com')) {
    await reauthenticateWithPopup(currentUser, googleProvider);
  } else if (providers.includes('password') && password && currentUser.email) {
    const credential = EmailAuthProvider.credential(currentUser.email, password);
    await reauthenticateWithCredential(currentUser, credential);
  }

  // Best-effort cleanup: one denied/failed step must not block deleting the
  // account itself. Each failure is logged with its step name (so the offending
  // rule can be tightened) and skipped; re-running deleteAccount is idempotent.
  const cleanup = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
    } catch (err) {
      console.warn(`[deleteAccount] step "${label}" failed (continuing):`, err);
    }
  };

  await cleanup('certificates', async () => {
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
  });

  await cleanup('scantrons', async () => {
    const snap = await getDocs(query(collection(db, 'scantrons'), where('uid', '==', appUser.uid)));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  });

  await cleanup('fcmTokens', async () => {
    const snap = await getDocs(query(collection(db, 'fcmTokens'), where('uid', '==', appUser.uid)));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  });

  await cleanup('cycleCredits', async () => {
    const snap = await getDocs(collection(db, 'users', appUser.uid, 'cycleCredits'));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  });

  await cleanup('team', async () => {
    if (!appUser.teamCode) return;
    const teamRef = doc(db, 'teams', appUser.teamCode);
    if (appUser.role === 'manager') {
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) return;
      const team = teamSnap.data() as Team;
      const memberBatch = writeBatch(db);
      team.members.forEach(uid => {
        if (uid !== appUser.uid) {
          memberBatch.update(doc(db, 'users', uid), { teamCode: null, role: null });
        }
      });
      await memberBatch.commit();
      await deleteDoc(teamRef);
    } else {
      await updateDoc(teamRef, { members: arrayRemove(appUser.uid) });
    }
  });

  await cleanup('username', async () => {
    if (appUser.username) {
      await deleteDoc(doc(db, 'usernames', appUser.username));
    }
  });

  // Critical: the profile doc and the Auth account must be removed. These are
  // always permitted for the owner, so let any failure surface to the caller.
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

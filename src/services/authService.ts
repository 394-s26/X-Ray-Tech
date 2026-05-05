import {
  OAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';

const microsoftProvider = new OAuthProvider('microsoft.com');

export const signInWithMicrosoft = async (): Promise<void> => {
  await signInWithPopup(auth, microsoftProvider);
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const subscribeToAuthState = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

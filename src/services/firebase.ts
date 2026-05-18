import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { readFirebaseClientConfig } from '../config/firebaseClientConfig';

export const app = initializeApp(readFirebaseClientConfig());

export const db = initializeFirestore(app, {});
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

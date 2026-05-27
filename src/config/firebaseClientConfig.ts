import type { FirebaseOptions } from 'firebase/app';

const requiredFirebaseEnv = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

export function readFirebaseClientConfig(): FirebaseOptions {
  const missing = Object.entries(requiredFirebaseEnv)
    .filter(([, value]) => !value || value === 'mock')
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase environment variables: ${missing.join(', ')}. ` +
        'Add them to .env (see .env.example).',
    );
  }

  return {
    apiKey: requiredFirebaseEnv.VITE_FIREBASE_API_KEY as string,
    authDomain: requiredFirebaseEnv.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: requiredFirebaseEnv.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: requiredFirebaseEnv.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: requiredFirebaseEnv.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: requiredFirebaseEnv.VITE_FIREBASE_APP_ID as string,
  };
}

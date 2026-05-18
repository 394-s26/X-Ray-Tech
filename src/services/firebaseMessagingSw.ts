import type { FirebaseOptions } from 'firebase/app';
import { readFirebaseClientConfig } from '../config/firebaseClientConfig';

const SW_SCRIPT_PATH = '/firebase-messaging-sw.js';
const CONFIG_QUERY_KEY = 'firebaseConfig';

export function encodeFirebaseConfigForServiceWorker(config: FirebaseOptions): string {
  return btoa(encodeURIComponent(JSON.stringify(config)));
}

export function buildMessagingServiceWorkerUrl(config?: FirebaseOptions): string {
  const encoded = encodeURIComponent(
    encodeFirebaseConfigForServiceWorker(config ?? readFirebaseClientConfig()),
  );
  return `${SW_SCRIPT_PATH}?${CONFIG_QUERY_KEY}=${encoded}`;
}

let registrationPromise: Promise<ServiceWorkerRegistration> | null = null;
let lastRegisteredUrl: string | null = null;

/** Drop stale workers registered without config (common during dev). */
async function unregisterBrokenMessagingWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map((reg) => {
      const scriptUrl = reg.active?.scriptURL ?? reg.installing?.scriptURL ?? reg.waiting?.scriptURL ?? '';
      if (scriptUrl.includes(SW_SCRIPT_PATH) && !scriptUrl.includes(CONFIG_QUERY_KEY + '=')) {
        return reg.unregister();
      }
    }),
  );
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }

  const swUrl = buildMessagingServiceWorkerUrl();

  if (registrationPromise && lastRegisteredUrl === swUrl) {
    return registrationPromise;
  }

  await unregisterBrokenMessagingWorkers();

  lastRegisteredUrl = swUrl;
  registrationPromise = navigator.serviceWorker
    .register(swUrl, { scope: '/' })
    .then(async (registration) => {
      await navigator.serviceWorker.ready;
      return registration;
    })
    .catch((err) => {
      registrationPromise = null;
      lastRegisteredUrl = null;
      console.error('[FCM] Service worker registration failed:', err);
      throw err;
    });

  return registrationPromise;
}

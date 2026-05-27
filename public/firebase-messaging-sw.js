/**
 * FCM background handler. Config comes from ?firebaseConfig= (set when the app registers this SW).
 * Send data-only FCM messages if you need onBackgroundMessage to always run; notification-only
 * payloads may be shown by the browser without calling this handler.
 */
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.1/firebase-messaging-compat.js');

function swLog(level, message, detail) {
  const prefix = '[FCM SW]';
  if (detail !== undefined) {
    console[level](prefix, message, detail);
  } else {
    console[level](prefix, message);
  }
}

self.addEventListener('error', (event) => {
  swLog('error', 'Unhandled error', event.error ?? event.message);
});

self.addEventListener('unhandledrejection', (event) => {
  swLog('error', 'Unhandled promise rejection', event.reason);
});

function parseFirebaseConfigFromUrl() {
  const base64Config = new URL(self.location.href).searchParams.get('firebaseConfig');
  if (!base64Config) {
    throw new Error(
      'Missing firebaseConfig query param. The app must register this worker via registerMessagingServiceWorker().',
    );
  }
  try {
    return JSON.parse(decodeURIComponent(atob(base64Config)));
  } catch (err) {
    throw new Error('Invalid firebaseConfig in service worker URL: ' + (err?.message ?? err));
  }
}

function notificationFromPayload(payload) {
  const notification = payload?.notification ?? {};
  const data = payload?.data ?? {};
  return {
    title: notification.title || data.title || 'X-Ray Tech',
    options: {
      body: notification.body || data.body || '',
      icon: notification.icon || data.icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: data.tag || data.id || 'fcm-default',
      data: { ...data, fcmPayload: payload },
    },
  };
}

let messaging = null;

try {
  const firebaseConfig = parseFirebaseConfigFromUrl();
  firebase.initializeApp(firebaseConfig);
  messaging = firebase.messaging();
  swLog('log', 'Firebase Messaging initialized');
} catch (err) {
  swLog('error', 'Failed to initialize Firebase in service worker', err);
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    swLog('log', 'onBackgroundMessage', payload);

    const { title, options } = notificationFromPayload(payload);

    return self.registration
      .showNotification(title, options)
      .catch((err) => {
        swLog('error', 'showNotification failed', err);
        throw err;
      });
  });
}

/** Only if Firebase failed to init — avoids duplicate notifications when onBackgroundMessage is active. */
if (!messaging) {
  self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload;
    try {
      payload = event.data.json();
    } catch {
      swLog('warn', 'push event had non-JSON data');
      return;
    }

    if (!payload?.notification && !payload?.data) return;

    swLog('log', 'push fallback (messaging not initialized)', payload);

    const { title, options } = notificationFromPayload(payload);

    event.waitUntil(
      self.registration.showNotification(title, options).catch((err) => {
        swLog('error', 'push → showNotification failed', err);
      }),
    );
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});

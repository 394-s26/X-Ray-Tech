importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const swScriptUrl = new URL(self.location);
const base64Config = swScriptUrl.searchParams.get('firebaseConfig');

if (base64Config) {
  try {
    // Decode both the base64 AND the URI components cleanly
    const decoded = decodeURIComponent(atob(base64Config));
    const firebaseConfig = JSON.parse(decoded);
    
    // Using compatibility syntax since we imported the compat scripts
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('Background payload:', payload);
      const title = payload.notification?.title || 'New Message';
      const options = {
        body: payload.notification?.body || 'You have an update.',
      };
      self.registration.showNotification(title, options);
    });

  } catch (error) {
    console.error('Failed to parse Firebase configuration in SW:', error);
  }
}
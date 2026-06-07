import { onSchedule } from 'firebase-functions/v2/scheduler';
import { sendTwoMonthExpiryReminders } from '../fcm/sendTwoMonthExpiryReminders.js';

/**
 * Daily 09:00 UTC — notify owners when a certificate expires in ~2 months (60 days).
 * Gmail credentials are read from functions/.env (GMAIL_EMAIL / GMAIL_APP_PASSWORD).
 */
export const certificateTwoMonthExpiryReminders = onSchedule(
  {
    schedule: '00 9 * * *',
    timeZone: 'CST',
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async () => {
    await sendTwoMonthExpiryReminders();
  },
);

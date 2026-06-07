import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { sendCertificateExpiryEmail } from '../email/sendCertificateExpiryEmail.js';
import { msUntilExpirationDate, requireExpirationDate } from './formatCertificateExpiryNotice.js';
import { sendCertificateExpiryNotification } from './sendCertificateExpiryNotification.js';
import { toCertificateForFcm } from './toCertificateForFcm.js';

/** ~2 months; used to pick certificates expiring on this calendar day. */
export const TWO_MONTH_REMINDER_DAYS = 60;

const CERTIFICATES_COLLECTION = 'certificates';

export interface TwoMonthReminderRunResult {
  targetExpirationDate: string;
  matched: number;
  sent: number;
  skippedAlreadySent: number;
  skippedNoOwner: number;
  skippedNoTokens: number;
  failed: number;
  // Email (sent alongside the desktop/FCM notification).
  emailSent: number;
  emailSkippedAlreadySent: number;
  emailSkippedNoAddress: number;
  emailFailed: number;
}

/** YYYY-MM-DD for the calendar day `daysFromNow` days after today (UTC). */
export function expirationDateDaysFromNow(daysFromNow: number, now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

/**
 * Finds certificates whose expirationDate is exactly `TWO_MONTH_REMINDER_DAYS` from today,
 * sends FCM via sendCertificateExpiryNotification, and marks each doc so we do not resend.
 */
export async function sendTwoMonthExpiryReminders(): Promise<TwoMonthReminderRunResult> {
  const db = getFirestore();
  const targetExpirationDate = expirationDateDaysFromNow(TWO_MONTH_REMINDER_DAYS);

  const snap = await db
    .collection(CERTIFICATES_COLLECTION)
    .where('expirationDate', '==', targetExpirationDate)
    .get();

  const result: TwoMonthReminderRunResult = {
    targetExpirationDate,
    matched: snap.size,
    sent: 0,
    skippedAlreadySent: 0,
    skippedNoOwner: 0,
    skippedNoTokens: 0,
    failed: 0,
    emailSent: 0,
    emailSkippedAlreadySent: 0,
    emailSkippedNoAddress: 0,
    emailFailed: 0,
  };

  logger.info('Two-month expiry reminder run started', {
    targetExpirationDate,
    matched: snap.size,
    hint:
      'Only certificates with expirationDate exactly equal to targetExpirationDate are included (UTC today + 60 days).',
  });

  if (snap.empty) {
    logger.warn('No certificates matched the 2-month target expiration date', {
      targetExpirationDate,
      todayUtc: expirationDateDaysFromNow(0),
    });
  }

  for (const doc of snap.docs) {
    const data = doc.data();

    const certificate = toCertificateForFcm(doc.id, data);
    if (!certificate) {
      result.skippedNoOwner += 1;
      continue;
    }

    const msUntilExpiry = msUntilExpirationDate(requireExpirationDate(certificate));

    // ── Desktop / FCM notification ─────────────────────────────────────────
    if (data.twoMonthExpiryNotificationSent === true) {
      result.skippedAlreadySent += 1;
    } else {
      try {
        const sendResult = await sendCertificateExpiryNotification({
          certificate,
          msUntilExpiry,
        });

        if (sendResult.tokensAttempted === 0) {
          result.skippedNoTokens += 1;
          logger.warn('No FCM tokens for owner — user must allow notifications while logged in', {
            certificateId: doc.id,
            ownerId: certificate.uid,
            fcmQuery: `fcmTokens where uid == ${certificate.uid}`,
          });
        } else if (sendResult.successCount > 0) {
          await doc.ref.update({
            twoMonthExpiryNotificationSent: true,
            twoMonthExpiryNotificationSentAt: FieldValue.serverTimestamp(),
          });
          result.sent += 1;
        } else {
          result.failed += 1;
        }
      } catch (err) {
        result.failed += 1;
        logger.error('Failed to send two-month expiry notification', {
          certificateId: doc.id,
          err: String(err),
        });
      }
    }

    // ── Email notification (same copy, sent in the same run) ───────────────
    if (data.twoMonthExpiryEmailSent === true) {
      result.emailSkippedAlreadySent += 1;
    } else {
      try {
        const emailResult = await sendCertificateExpiryEmail({ certificate, msUntilExpiry });
        if (emailResult.skippedNoEmail) {
          result.emailSkippedNoAddress += 1;
        } else if (emailResult.sent) {
          result.emailSent += 1;
        }
      } catch (err) {
        result.emailFailed += 1;
        logger.error('Failed to send two-month expiry email', {
          certificateId: doc.id,
          err: String(err),
        });
      }
    }
  }

  logger.info('Two-month expiry reminder run finished', result);
  return result;
}

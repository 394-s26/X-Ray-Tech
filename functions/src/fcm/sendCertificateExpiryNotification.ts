import { getFirestore, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getMessaging, type MulticastMessage } from 'firebase-admin/messaging';
import { logger } from 'firebase-functions';
import type { Certificate } from '../types/certificate.js';
import {
  buildCertificateExpiryNotice,
  requireExpirationDate,
} from './formatCertificateExpiryNotice.js';

const FCM_TOKENS_COLLECTION = 'fcmTokens';

export interface SendCertificateExpiryNotificationInput {
  /** Upload/OCR certificate record (`src/types/upload.ts`). */
  certificate: Certificate;
  /** Milliseconds from now until `certificate.expirationDate`. */
  msUntilExpiry: number;
}

export interface SendCertificateExpiryNotificationResult {
  uid: string;
  tokensAttempted: number;
  successCount: number;
  failureCount: number;
  /** FCM tokens that should be removed from Firestore (invalid/unregistered). */
  invalidTokens: string[];
}

async function loadFcmTokensForUser(
  uid: string,
): Promise<{ tokens: string[]; docs: QueryDocumentSnapshot[] }> {
  const snap = await getFirestore()
    .collection(FCM_TOKENS_COLLECTION)
    .where('uid', '==', uid)
    .get();

  const tokens = new Set<string>();
  for (const doc of snap.docs) {
    const token = doc.data().token;
    if (typeof token === 'string' && token.length > 0) {
      tokens.add(token);
    }
  }
  return { tokens: [...tokens], docs: snap.docs };
}

async function deleteInvalidFcmTokenDocs(
  docs: QueryDocumentSnapshot[],
  invalidTokens: string[],
): Promise<void> {
  if (invalidTokens.length === 0) return;

  const invalid = new Set(invalidTokens);
  const db = getFirestore();
  const batch = db.batch();
  let pending = 0;

  for (const doc of docs) {
    const token = doc.data().token;
    if (typeof token === 'string' && invalid.has(token)) {
      batch.delete(doc.ref);
      pending += 1;
    }
  }

  if (pending > 0) {
    await batch.commit();
    logger.info('Removed invalid FCM token docs', { removed: pending });
  }
}

/**
 * Sends an FCM push to every registered device for the certificate owner.
 *
 * Intended to be called from a scheduled or triggered Cloud Function later, e.g.:
 *
 * ```ts
 * import { msUntilExpirationDate } from './fcm/formatCertificateExpiryNotice.js';
 * import { sendCertificateExpiryNotification } from './fcm/sendCertificateExpiryNotification.js';
 *
 * const expirationDate = cert.expirationDate!;
 * const ms = msUntilExpirationDate(expirationDate);
 * await sendCertificateExpiryNotification({ certificate: cert, msUntilExpiry: ms });
 * ```
 */
export async function sendCertificateExpiryNotification(
  input: SendCertificateExpiryNotificationInput,
): Promise<SendCertificateExpiryNotificationResult> {
  const { certificate, msUntilExpiry } = input;
  const uid = certificate.uid;

  if (!uid) {
    throw new Error('certificate.uid is required to send FCM notifications.');
  }

  requireExpirationDate(certificate);

  const { tokens, docs: tokenDocs } = await loadFcmTokensForUser(uid);

  if (tokens.length === 0) {
    logger.info('No FCM tokens for user; skipping expiry notification', {
      uid,
      certificateId: certificate.id,
      registeredDevices: tokenDocs.length,
    });
    return {
      uid,
      tokensAttempted: 0,
      successCount: 0,
      failureCount: 0,
      invalidTokens: [],
    };
  }

  const { data } = buildCertificateExpiryNotice(certificate, msUntilExpiry);

  // Data-only: a top-level `notification` field makes the browser auto-show a push while
  // firebase-messaging-sw.js also calls showNotification → duplicate toasts.
  const message: MulticastMessage = {
    tokens,
    data,
    webpush: {
      fcmOptions: { link: '/' },
    },
  };

  const response = await getMessaging().sendEachForMulticast(message);

  const invalidTokens: string[] = [];
  response.responses.forEach((res, index) => {
    if (res.success) return;
    const token = tokens[index];
    const code = res.error?.code;
    logger.warn('FCM send failed for token', {
      uid,
      certificateId: certificate.id,
      code,
      message: res.error?.message,
    });
    if (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    ) {
      invalidTokens.push(token);
    }
  });

  await deleteInvalidFcmTokenDocs(tokenDocs, invalidTokens);

  const result: SendCertificateExpiryNotificationResult = {
    uid,
    tokensAttempted: tokens.length,
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  };

  logger.info('Certificate expiry FCM batch finished', {
    certificateId: certificate.id,
    registeredDevices: tokenDocs.length,
    ...result,
  });

  return result;
}

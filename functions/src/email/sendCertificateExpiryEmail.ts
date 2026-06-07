import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import nodemailer from 'nodemailer';
import type { Certificate } from '../types/certificate.js';
import {
  buildCertificateExpiryNotice,
  formatExpirationDateLabel,
  requireExpirationDate,
} from '../fcm/formatCertificateExpiryNotice.js';

/**
 * Gmail App Password credentials, read from environment variables.
 * Defined in `functions/.env` (deployed) — NOT committed to git:
 *   GMAIL_EMAIL=your-sender@gmail.com
 *   GMAIL_APP_PASSWORD=your16charapppassword
 *
 * GMAIL_APP_PASSWORD must be a Google "App Password" (16 chars), NOT the
 * account's normal login password.
 */
function gmailCredentials(): { email: string; appPassword: string } {
  const email = process.env.GMAIL_EMAIL;
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!email || !appPassword) {
    throw new Error(
      'Missing GMAIL_EMAIL / GMAIL_APP_PASSWORD. Set them in functions/.env before deploying.',
    );
  }
  return { email, appPassword };
}

const CERTIFICATES_COLLECTION = 'certificates';
const USERS_COLLECTION = 'users';

export interface SendCertificateExpiryEmailInput {
  certificate: Certificate;
  /** Milliseconds from now until `certificate.expirationDate`. */
  msUntilExpiry: number;
}

export interface SendCertificateExpiryEmailResult {
  uid: string;
  recipient: string | null;
  sent: boolean;
  /** No email address resolved for the owner — nothing was attempted. */
  skippedNoEmail: boolean;
}

/**
 * Resolve the certificate owner's email. Prefers the Firestore `users/{uid}`
 * doc (populated at signup), then falls back to Firebase Auth (source of truth).
 */
async function resolveRecipientEmail(uid: string): Promise<string | null> {
  try {
    const userSnap = await getFirestore().collection(USERS_COLLECTION).doc(uid).get();
    const fromDoc = userSnap.get('email');
    if (typeof fromDoc === 'string' && fromDoc.includes('@')) {
      return fromDoc;
    }
  } catch (err) {
    logger.warn('Failed to read users doc for email; falling back to Auth', {
      uid,
      err: String(err),
    });
  }

  try {
    const userRecord = await getAuth().getUser(uid);
    if (userRecord.email && userRecord.email.includes('@')) {
      return userRecord.email;
    }
  } catch (err) {
    logger.warn('Failed to read Auth record for email', { uid, err: String(err) });
  }

  return null;
}

/** Inline HTML body mirroring the desktop-notification copy (no template file). */
function buildEmailHtml(args: {
  title: string;
  body: string;
  certificate: Certificate;
}): string {
  const { title, body, certificate } = args;
  const expirationLabel = formatExpirationDateLabel(requireExpirationDate(certificate));
  const provider = certificate.providerName?.trim();

  return `
  <div style="margin:0;padding:24px;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="height:6px;background:#dc2626;"></div>
      <div style="padding:28px 28px 24px;">
        <h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:#111827;">${title}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#374151;">${body}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Certificate</td>
            <td style="padding:6px 0;text-align:right;font-weight:600;">${certificate.displayFileName}</td>
          </tr>
          ${
            provider
              ? `<tr><td style="padding:6px 0;color:#6b7280;">Provider</td><td style="padding:6px 0;text-align:right;font-weight:600;">${provider}</td></tr>`
              : ''
          }
          <tr>
            <td style="padding:6px 0;color:#6b7280;">Expires</td>
            <td style="padding:6px 0;text-align:right;font-weight:600;">${expirationLabel}</td>
          </tr>
        </table>
      </div>
      <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          You're receiving this because you have a certificate nearing expiration in X-Ray Tech.
        </p>
      </div>
    </div>
  </div>`;
}

/**
 * Sends the certificate-expiry email to the owner using Gmail + Nodemailer.
 *
 * Behavior (write-then-rollback):
 *   1. Optimistically writes the `twoMonthExpiryEmailSent` flag on the cert doc
 *      (this is the "record" for this codebase — see flag_on_cert decision).
 *   2. Attempts `transporter.sendMail`.
 *   3. If sending throws, rolls the flag back (deletes the fields) and rethrows,
 *      so a failed email never leaves the cert marked as notified.
 *
 * Shared by the scheduled reminder job and the callable HTTPS function.
 */
export async function sendCertificateExpiryEmail(
  input: SendCertificateExpiryEmailInput,
): Promise<SendCertificateExpiryEmailResult> {
  const { certificate, msUntilExpiry } = input;
  const uid = certificate.uid;

  if (!uid) {
    throw new Error('certificate.uid is required to send the expiry email.');
  }
  requireExpirationDate(certificate);

  const recipient = await resolveRecipientEmail(uid);
  if (!recipient) {
    logger.warn('No email address for certificate owner; skipping expiry email', {
      uid,
      certificateId: certificate.id,
    });
    return { uid, recipient: null, sent: false, skippedNoEmail: true };
  }

  // Same copy as the desktop/FCM notification.
  const { title, body } = buildCertificateExpiryNotice(certificate, msUntilExpiry);
  const html = buildEmailHtml({ title, body, certificate });

  const { email: gmailEmail, appPassword } = gmailCredentials();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailEmail,
      pass: appPassword,
    },
  });

  const certRef = getFirestore().collection(CERTIFICATES_COLLECTION).doc(certificate.id);

  // 1. Write the "record" (flag) before sending.
  await certRef.update({
    twoMonthExpiryEmailSent: true,
    twoMonthExpiryEmailSentAt: FieldValue.serverTimestamp(),
  });

  try {
    // 2. Send the email.
    await transporter.sendMail({
      from: `"X-Ray Tech" <${gmailEmail}>`,
      to: recipient,
      subject: title,
      text: `${title}\n\n${body}`,
      html,
    });
  } catch (err) {
    // 3. Roll back the flag so the cert is not left marked as emailed.
    await certRef
      .update({
        twoMonthExpiryEmailSent: FieldValue.delete(),
        twoMonthExpiryEmailSentAt: FieldValue.delete(),
      })
      .catch((rollbackErr) => {
        logger.error('Failed to roll back expiry-email flag after send failure', {
          certificateId: certificate.id,
          rollbackErr: String(rollbackErr),
        });
      });

    logger.error('Failed to send certificate expiry email; rolled back flag', {
      certificateId: certificate.id,
      uid,
      err: String(err),
    });
    throw err;
  }

  logger.info('Certificate expiry email sent', {
    certificateId: certificate.id,
    uid,
    recipient,
  });

  return { uid, recipient, sent: true, skippedNoEmail: false };
}

import type { Certificate } from '../types/certificate.js';

/** Human-readable duration until expiration (for notification body). */
export function formatTimeUntilExpiry(msUntilExpiry: number): string {
  if (msUntilExpiry <= 0) {
    return 'today';
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor(msUntilExpiry / dayMs);

  if (days >= 60) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  if (days >= 14) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  if (days > 1) {
    return `${days} days`;
  }
  if (days === 1) {
    return '1 day';
  }

  const hours = Math.floor(msUntilExpiry / (60 * 60 * 1000));
  if (hours >= 1) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  return 'soon';
}

export function formatExpirationDateLabel(expirationDate: string): string {
  const parsed = new Date(`${expirationDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return expirationDate;
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function certificateDisplayName(certificate: Certificate): string {
  const name = certificate.examName?.trim() || certificate.displayFileName?.trim();
  return name || 'Certificate';
}

export function requireExpirationDate(certificate: Certificate): string {
  if (!certificate.expirationDate) {
    throw new Error(`Certificate ${certificate.id} has no expirationDate.`);
  }
  return certificate.expirationDate;
}

export interface CertificateExpiryNoticeContent {
  title: string;
  body: string;
  data: Record<string, string>;
}

/**
 * Notification copy + FCM data payload for a certificate nearing expiration.
 */
export function buildCertificateExpiryNotice(
  certificate: Certificate,
  msUntilExpiry: number,
): CertificateExpiryNoticeContent {
  const expirationDate = requireExpirationDate(certificate);
  const timeLabel = formatTimeUntilExpiry(msUntilExpiry);
  const dateLabel = formatExpirationDateLabel(expirationDate);
  const name = certificateDisplayName(certificate);
  const provider = certificate.providerName?.trim() ?? '';

  const title =
    msUntilExpiry <= 0
      ? `${name} has expired`
      : `${name} expires in ${timeLabel}`;

  const body =
    msUntilExpiry <= 0
      ? `Expired on ${dateLabel}${provider ? ` · ${provider}` : ''}.`
      : `Expires on ${dateLabel}${provider ? ` · ${provider}` : ''}.`;

  return {
    title,
    body,
    data: {
      type: 'certificate_expiry',
      title,
      body,
      tag: `certificate_expiry_${certificate.id}`,
      icon: '/favicon.svg',
      certificateId: certificate.id,
      uid: certificate.uid,
      displayFileName: certificate.displayFileName,
      examName: certificate.examName ?? '',
      expirationDate,
      msUntilExpiry: String(msUntilExpiry),
      providerName: provider,
    },
  };
}

/** Milliseconds from `now` until `expirationDate` (YYYY-MM-DD). */
export function msUntilExpirationDate(
  expirationDate: string,
  nowMs: number = Date.now(),
): number {
  const expiryMs = new Date(`${expirationDate}T00:00:00`).getTime();
  if (Number.isNaN(expiryMs)) {
    throw new Error(`Invalid expirationDate: ${expirationDate}`);
  }
  return expiryMs - nowMs;
}

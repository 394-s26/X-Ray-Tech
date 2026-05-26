import { setGlobalOptions } from "firebase-functions";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { sendTwoMonthExpiryReminders } from "./fcm/sendTwoMonthExpiryReminders.js";
import { certificateTwoMonthExpiryReminders } from "./scheduled/certificateTwoMonthExpiry.js";

initializeApp();

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

export { certificateTwoMonthExpiryReminders };

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];

const startsWith = (bytes: Buffer, magic: number[]): boolean => {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  return true;
};

const detectType = (bytes: Buffer): "image/png" | "image/jpeg" | "application/pdf" | null => {
  if (startsWith(bytes, PNG_MAGIC)) return "image/png";
  if (startsWith(bytes, JPEG_MAGIC)) return "image/jpeg";
  if (startsWith(bytes, PDF_MAGIC)) return "application/pdf";
  return null;
};

const MAX_PDF_PAGES = 3;
const MAX_BYTES = 10 * 1024 * 1024;
const PDF_PAGE_PROBE_BYTES = 256 * 1024;

const countPdfPages = (buf: Buffer): number => {
  // Cheap heuristic: count "/Type /Page" occurrences (excluding /Pages).
  const text = buf.toString("latin1");
  const pageMatches = text.match(/\/Type\s*\/Page(?!s)/g);
  return pageMatches ? pageMatches.length : 0;
};

interface ValidationOutcome {
  ok: boolean;
  error?: string;
}

const validateBlob = async (
  bucketName: string,
  filePath: string,
  declaredContentType: string | undefined,
  size: number,
): Promise<ValidationOutcome> => {
  if (size > MAX_BYTES) {
    return { ok: false, error: `File exceeds ${MAX_BYTES} bytes (got ${size}).` };
  }

  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"] as const;
  if (!declaredContentType || !allowedTypes.includes(declaredContentType as typeof allowedTypes[number])) {
    return { ok: false, error: `Disallowed contentType "${declaredContentType ?? ""}".` };
  }

  const bucket = getStorage().bucket(bucketName);
  const file = bucket.file(filePath);

  // Read the first 64 bytes to verify magic bytes.
  const [header] = await file.download({ start: 0, end: 63 });
  const sniffed = detectType(header);
  if (!sniffed || sniffed !== declaredContentType) {
    return {
      ok: false,
      error: `Magic bytes (${sniffed ?? "unknown"}) do not match declared type (${declaredContentType}).`,
    };
  }

  if (sniffed === "application/pdf") {
    const probeEnd = Math.min(size - 1, PDF_PAGE_PROBE_BYTES - 1);
    const [probe] = await file.download({ start: 0, end: probeEnd });
    const pages = countPdfPages(probe);
    if (pages > MAX_PDF_PAGES) {
      return { ok: false, error: `PDF has ${pages} pages (max ${MAX_PDF_PAGES}).` };
    }
  }

  return { ok: true };
};

/** Manual trigger for testing the 2-month expiry job (admin only). */
export const runCertificateTwoMonthExpiryReminders = onCall(
  { cors: true, invoker: "public" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    return sendTwoMonthExpiryReminders();
  },
);

export const validateUploadedCertificate = onObjectFinalized(
  { timeoutSeconds: 30, memory: "256MiB" },
  async (event) => {
    const filePath = event.data.name;
    const bucket = event.data.bucket;
    if (!filePath?.startsWith("certificates/")) return;

    const parts = filePath.split("/");
    if (parts.length !== 3) {
      logger.warn("Unexpected certificate path", { filePath });
      return;
    }
    const [, , fileName] = parts;
    const certId = fileName.replace(/\.(jpg|jpeg|png|pdf)$/i, "");

    const declared = event.data.contentType;
    const size = Number(event.data.size ?? 0);

    const result = await validateBlob(bucket, filePath, declared, size);

    const certDocRef = getFirestore().collection("certificates").doc(certId);

    if (result.ok) {
      await certDocRef.update({ validated: "ok" }).catch((err) => {
        logger.error("Failed to mark certificate validated", { certId, err: String(err) });
      });
      return;
    }

    logger.warn("Rejecting uploaded certificate", { filePath, error: result.error });
    await Promise.allSettled([
      certDocRef.update({ validated: "failed", validationError: result.error ?? "unknown" }),
      getStorage().bucket(bucket).file(filePath).delete({ ignoreNotFound: true }),
    ]);
  },
);

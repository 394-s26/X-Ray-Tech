import {
  ALLOWED_CONTENT_TYPES,
  FILE_SIZE_LIMITS,
  MagicByteMismatchError,
  TooLargeError,
  UnsupportedTypeError,
  type CertificateContentType,
} from '../types/upload';

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];

const startsWith = (bytes: Uint8Array, magic: number[]): boolean => {
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic[i]) return false;
  }
  return true;
};

const detectMagicType = (bytes: Uint8Array): CertificateContentType | null => {
  if (startsWith(bytes, PNG_MAGIC)) return 'image/png';
  if (startsWith(bytes, JPEG_MAGIC)) return 'image/jpeg';
  if (startsWith(bytes, PDF_MAGIC)) return 'application/pdf';
  return null;
};

const readHeader = async (file: File, byteCount = 16): Promise<Uint8Array> => {
  const slice = file.slice(0, byteCount);
  const buf = await slice.arrayBuffer();
  return new Uint8Array(buf);
};

export const validateUploadFile = async (file: File): Promise<CertificateContentType> => {
  if (!ALLOWED_CONTENT_TYPES.includes(file.type as CertificateContentType)) {
    throw new UnsupportedTypeError(file.type || 'unknown');
  }
  const declared = file.type as CertificateContentType;
  const isPdf = declared === 'application/pdf';
  const max = isPdf ? FILE_SIZE_LIMITS.pdf : FILE_SIZE_LIMITS.image;
  if (file.size > max) {
    throw new TooLargeError(file.size, max);
  }

  const header = await readHeader(file);
  const sniffed = detectMagicType(header);
  if (sniffed !== declared) {
    throw new MagicByteMismatchError();
  }

  return declared;
};

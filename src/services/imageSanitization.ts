const MAX_LONG_EDGE = 2000;
const JPEG_QUALITY = 0.85;

interface SanitizedImage {
  blob: Blob;
  ext: 'jpg';
  contentType: 'image/jpeg';
  width: number;
  height: number;
}

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image.'));
    };
    img.src = url;
  });
};

export const sanitizeImageForUpload = async (file: File): Promise<SanitizedImage> => {
  const img = await loadImage(file);
  const long = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = long > MAX_LONG_EDGE ? MAX_LONG_EDGE / long : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Failed to encode image.'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });

  return { blob, ext: 'jpg', contentType: 'image/jpeg', width, height };
};

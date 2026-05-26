import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = workerUrl;

export class PdfTooLongError extends Error {
  numPages: number;
  maxPages: number;
  constructor(numPages: number, maxPages: number) {
    super(`PDF has ${numPages} pages — maximum allowed is ${maxPages}.`);
    this.name = 'PdfTooLongError';
    this.numPages = numPages;
    this.maxPages = maxPages;
  }
}

export const renderPdfToCanvases = async (
  file: File,
  maxPages = 3,
  scale = 2.0,
): Promise<HTMLCanvasElement[]> => {
  const buf = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buf) }).promise;

  if (pdf.numPages > maxPages) {
    await pdf.destroy();
    throw new PdfTooLongError(pdf.numPages, maxPages);
  }

  const canvases: HTMLCanvasElement[] = [];
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2D context');
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      canvases.push(canvas);
    }
  } finally {
    await pdf.destroy();
  }
  return canvases;
};

/**
 * Render only the first page of a PDF (loaded by URL) to a canvas, sized for a
 * thumbnail. Used by archive cards and other lightweight previews.
 */
export const renderPdfThumbnailFromUrl = async (
  url: string,
  scale = 1.0,
  signal?: AbortSignal,
): Promise<HTMLCanvasElement> => {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Failed to fetch PDF (${res.status})`);
  const buf = await res.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buf) }).promise;
  try {
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    return canvas;
  } finally {
    await pdf.destroy();
  }
};

export const loadImageFileToCanvas = async (file: File): Promise<HTMLCanvasElement> => {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Failed to load image'));
      el.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    ctx.drawImage(img, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
};

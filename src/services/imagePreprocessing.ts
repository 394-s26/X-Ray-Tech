import type { PreprocessingOptions } from '../types/ocr';

const cloneCanvas = (src: HTMLCanvasElement): HTMLCanvasElement => {
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  ctx.drawImage(src, 0, 0);
  return out;
};

const getCtx = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Failed to get 2D context');
  return ctx;
};

const toGrayscale = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = getCtx(canvas);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
};

const stretchContrast = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = getCtx(canvas);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;

  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;
  if (range <= 1) return canvas;

  const scale = 255 / range;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.max(0, Math.min(255, Math.round((data[i] - min) * scale)));
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
};

const computeOtsuThreshold = (data: Uint8ClampedArray): number => {
  const hist = new Array<number>(256).fill(0);
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    hist[data[i]]++;
    total++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }
  return threshold;
};

const otsuThreshold = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = getCtx(canvas);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const t = computeOtsuThreshold(data);
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] >= t ? 255 : 0;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
};

const rotateCanvas = (src: HTMLCanvasElement, radians: number): HTMLCanvasElement => {
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const newW = Math.ceil(src.width * cos + src.height * sin);
  const newH = Math.ceil(src.width * sin + src.height * cos);

  const out = document.createElement('canvas');
  out.width = newW;
  out.height = newH;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, newW, newH);
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(radians);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
};

const computeRowVariance = (canvas: HTMLCanvasElement): number => {
  const ctx = getCtx(canvas);
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height);
  const data = img.data;
  const rowSums = new Array<number>(height).fill(0);
  for (let y = 0; y < height; y++) {
    let s = 0;
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x++) {
      const v = data[rowStart + x * 4];
      s += v < 128 ? 1 : 0;
    }
    rowSums[y] = s;
  }
  let mean = 0;
  for (let y = 0; y < height; y++) mean += rowSums[y];
  mean /= height;
  let variance = 0;
  for (let y = 0; y < height; y++) {
    const d = rowSums[y] - mean;
    variance += d * d;
  }
  return variance / height;
};

const buildScoringCanvas = (src: HTMLCanvasElement, maxDim = 600): HTMLCanvasElement => {
  const scale = Math.min(1, maxDim / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale));
  const h = Math.max(1, Math.round(src.height * scale));
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  ctx.drawImage(src, 0, 0, w, h);
  toGrayscale(out);
  otsuThreshold(out);
  return out;
};

const findSkewAngle = (canvas: HTMLCanvasElement): number => {
  const scoring = buildScoringCanvas(canvas);
  let bestAngle = 0;
  let bestScore = computeRowVariance(scoring);

  for (let deg = -15; deg <= 15; deg += 0.5) {
    if (deg === 0) continue;
    const rad = (deg * Math.PI) / 180;
    const rotated = rotateCanvas(scoring, rad);
    const score = computeRowVariance(rotated);
    if (score > bestScore) {
      bestScore = score;
      bestAngle = deg;
    }
  }
  return bestAngle;
};

const deskew = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const angleDeg = findSkewAngle(canvas);
  if (Math.abs(angleDeg) < 0.25) return canvas;
  const rad = (-angleDeg * Math.PI) / 180;
  return rotateCanvas(canvas, rad);
};

const upscale2x = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const out = document.createElement('canvas');
  out.width = canvas.width * 2;
  out.height = canvas.height * 2;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
};

export const preprocess = (
  src: HTMLCanvasElement,
  options: PreprocessingOptions,
): HTMLCanvasElement => {
  let working = cloneCanvas(src);

  if (options.upscale2x) {
    working = upscale2x(working);
  }
  if (options.grayscale || options.stretchContrast || options.otsuThreshold) {
    toGrayscale(working);
  }
  if (options.stretchContrast) {
    stretchContrast(working);
  }
  if (options.otsuThreshold) {
    otsuThreshold(working);
  }
  if (options.deskew) {
    working = deskew(working);
  }

  return working;
};

export const __test__ = {
  toGrayscale,
  stretchContrast,
  otsuThreshold,
  computeOtsuThreshold,
  rotateCanvas,
  findSkewAngle,
};

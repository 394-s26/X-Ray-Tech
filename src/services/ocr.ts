import { createWorker, type Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

const getWorker = async (onProgress?: (progress: number) => void): Promise<Worker> => {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      logger: m => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress(m.progress);
        }
      },
    });
  }
  return workerPromise;
};

export interface RunOCRResult {
  text: string;
  confidence: number;
}

export const runOCR = async (
  canvas: HTMLCanvasElement,
  onProgress?: (progress: number) => void,
): Promise<RunOCRResult> => {
  try {
    const worker = await getWorker(onProgress);
    const { data } = await worker.recognize(canvas);
    return { text: data.text, confidence: data.confidence };
  } catch (err) {
    workerPromise = null;
    throw err;
  }
};

export const terminateOCRWorker = async (): Promise<void> => {
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch {
    // ignore termination errors
  } finally {
    workerPromise = null;
  }
};

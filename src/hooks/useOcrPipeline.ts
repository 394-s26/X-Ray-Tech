import { useState } from 'react';
import { preprocess } from '../services/imagePreprocessing';
import { runOCR } from '../services/ocr';
import { loadImageFileToCanvas, renderPdfToCanvases, PdfTooLongError } from '../services/pdfRender';
import { defaultPreprocessingOptions, type PreprocessingOptions } from '../types/ocr';

export type PipelineStatus = 'idle' | 'loading' | 'recognizing' | 'done' | 'error';

const MAX_PDF_PAGES = 3;

export interface OcrResult {
  text: string;
  confidence: number;
  pageCount: number;
}

interface UseOcrPipelineResult {
  status: PipelineStatus;
  progress: number;
  error: string | null;
  processFile: (file: File, options?: PreprocessingOptions) => Promise<OcrResult>;
  reset: () => void;
}

export const useOcrPipeline = (): UseOcrPipelineResult => {
  const [status, setStatus] = useState<PipelineStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
  };

  const processFile = async (
    file: File,
    options: PreprocessingOptions = defaultPreprocessingOptions,
  ): Promise<OcrResult> => {
    setStatus('loading');
    setError(null);
    setProgress(0);

    try {
      let canvases: HTMLCanvasElement[];
      if (file.type === 'application/pdf') {
        canvases = await renderPdfToCanvases(file, MAX_PDF_PAGES);
      } else if (file.type.startsWith('image/')) {
        canvases = [await loadImageFileToCanvas(file)];
      } else {
        throw new Error('Unsupported file type.');
      }

      setStatus('recognizing');

      const pageTexts: string[] = [];
      let confidenceSum = 0;
      for (let i = 0; i < canvases.length; i++) {
        const processed = preprocess(canvases[i], options);
        const { text, confidence } = await runOCR(processed, p => {
          setProgress((i + p) / canvases.length);
        });
        pageTexts.push(text);
        confidenceSum += confidence;
      }

      setStatus('done');
      setProgress(1);

      const text =
        pageTexts.length === 1
          ? pageTexts[0].trim()
          : pageTexts.map((t, i) => `--- Page ${i + 1} ---\n${t.trim()}`).join('\n\n');
      const confidence = confidenceSum / Math.max(1, pageTexts.length);
      return { text, confidence, pageCount: canvases.length };
    } catch (err) {
      let msg = 'Failed to process file.';
      if (err instanceof PdfTooLongError) {
        msg = `PDF has ${err.numPages} pages — maximum is ${err.maxPages}.`;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setError(msg);
      setStatus('error');
      throw err;
    }
  };

  return { status, progress, error, processFile, reset };
};

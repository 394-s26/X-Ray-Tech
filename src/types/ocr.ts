export interface PreprocessingOptions {
  grayscale: boolean;
  stretchContrast: boolean;
  otsuThreshold: boolean;
  deskew: boolean;
  upscale2x: boolean;
}

export const defaultPreprocessingOptions: PreprocessingOptions = {
  grayscale: true,
  stretchContrast: true,
  otsuThreshold: true,
  deskew: false,
  upscale2x: false,
};

export interface OCRPageResult {
  pageIndex: number;
  text: string;
  confidence: number;
  processedCanvas: HTMLCanvasElement;
  originalCanvas: HTMLCanvasElement;
}

export type OCRRunStatus = 'idle' | 'rendering' | 'preprocessing' | 'recognizing' | 'done' | 'error';

export interface OCRRunState {
  status: OCRRunStatus;
  progress: number;
  message: string;
  results: OCRPageResult[];
  error: string | null;
}

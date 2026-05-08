import { useEffect, useMemo, useRef, useState } from 'react';
import { FileDropzone } from '../components/FileDropzone';
import { preprocess } from '../services/imagePreprocessing';
import { runOCR, terminateOCRWorker } from '../services/ocr';
import { loadImageFileToCanvas, renderPdfToCanvases, PdfTooLongError } from '../services/pdfRender';
import {
  defaultPreprocessingOptions,
  type OCRRunState,
  type PreprocessingOptions,
} from '../types/ocr';
import '../styles/pages/OCRTest.css';

const MAX_PDF_PAGES = 3;

const initialRunState: OCRRunState = {
  status: 'idle',
  progress: 0,
  message: '',
  results: [],
  error: null,
};

interface CanvasPreviewProps {
  source: HTMLCanvasElement | null;
  label: string;
}

const CanvasPreview = ({ source, label }: CanvasPreviewProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    host.replaceChildren();
    if (source) {
      source.classList.add('ocr-page__canvas');
      host.appendChild(source);
    }
  }, [source]);

  return (
    <div className="card card--md">
      <p className="card-header">{label}</p>
      <div ref={ref} className="ocr-page__canvas-wrap" />
    </div>
  );
};

const OCRTest = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originals, setOriginals] = useState<HTMLCanvasElement[]>([]);
  const [options, setOptions] = useState<PreprocessingOptions>(defaultPreprocessingOptions);
  const [run, setRun] = useState<OCRRunState>(initialRunState);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  useEffect(() => {
    return () => {
      void terminateOCRWorker();
    };
  }, []);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;

    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setIsLoadingFile(true);
      try {
        let canvases: HTMLCanvasElement[];
        if (file.type === 'application/pdf') {
          canvases = await renderPdfToCanvases(file, MAX_PDF_PAGES);
        } else if (file.type.startsWith('image/')) {
          canvases = [await loadImageFileToCanvas(file)];
        } else {
          throw new Error('Unsupported file type.');
        }
        if (cancelled) return;
        setOriginals(canvases);
        setLoadError(null);
      } catch (err) {
        if (cancelled) return;
        let msg = 'Failed to load file.';
        if (err instanceof PdfTooLongError) {
          msg = `PDF has ${err.numPages} pages — only PDFs up to ${err.maxPages} pages are supported.`;
        } else if (err instanceof Error) {
          msg = err.message;
        }
        setOriginals([]);
        setLoadError(msg);
      } finally {
        if (!cancelled) setIsLoadingFile(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [file]);

  const processed = useMemo(() => {
    if (originals.length === 0) return [] as HTMLCanvasElement[];
    return originals.map(c => preprocess(c, options));
  }, [originals, options]);

  const handleFileChange = (next: File | null) => {
    setFile(next);
    setRun(initialRunState);
    if (!next) {
      setOriginals([]);
      setLoadError(null);
    }
  };

  const handleOptionToggle = (key: keyof PreprocessingOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    setRun(initialRunState);
  };

  const handleReset = () => {
    setFile(null);
    setOriginals([]);
    setLoadError(null);
    setOptions(defaultPreprocessingOptions);
    setRun(initialRunState);
  };

  const handleRunOCR = async () => {
    if (processed.length === 0) return;
    setRun({ status: 'recognizing', progress: 0, message: 'Recognizing…', results: [], error: null });
    try {
      const results = [];
      for (let i = 0; i < processed.length; i++) {
        const pageIdx = i;
        const { text, confidence } = await runOCR(processed[i], p => {
          setRun(prev => ({
            ...prev,
            progress: (pageIdx + p) / processed.length,
            message: `Recognizing page ${pageIdx + 1} of ${processed.length}…`,
          }));
        });
        results.push({
          pageIndex: pageIdx,
          text,
          confidence,
          processedCanvas: processed[pageIdx],
          originalCanvas: originals[pageIdx],
        });
      }
      setRun({ status: 'done', progress: 1, message: 'Done.', results, error: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OCR failed.';
      setRun(prev => ({ ...prev, status: 'error', error: msg, message: '' }));
    }
  };

  const isBusy = isLoadingFile || run.status === 'recognizing';
  const canRun = processed.length > 0 && !isBusy;

  const concatenatedText = useMemo(() => {
    if (run.results.length === 0) return '';
    if (run.results.length === 1) return run.results[0].text.trim();
    return run.results
      .map(r => `--- Page ${r.pageIndex + 1} ---\n${r.text.trim()}`)
      .join('\n\n');
  }, [run.results]);

  return (
    <div className="ocr-page">
      <header className="ocr-page__header">
        <h1 className="ocr-page__title">OCR Test</h1>
        <p className="ocr-page__subtitle">
          Upload a certificate image or PDF (up to {MAX_PDF_PAGES} pages). Files stay in your browser
          — nothing is uploaded to Firebase. Toggle preprocessing steps to see how they affect OCR
          quality.
        </p>
      </header>

      <div className="ocr-page__top-grid">
        <FileDropzone file={file} onFileChange={handleFileChange} disabled={isBusy} />

        <div className="card card--md">
          <p className="card-header">Preprocessing</p>
          <div className="ocr-page__option-row">
            <label className="form-check-row">
              <input
                className="form-checkbox"
                type="checkbox"
                checked={options.grayscale}
                onChange={() => handleOptionToggle('grayscale')}
                disabled={isBusy}
              />
              Grayscale
            </label>
            <label className="form-check-row">
              <input
                className="form-checkbox"
                type="checkbox"
                checked={options.stretchContrast}
                onChange={() => handleOptionToggle('stretchContrast')}
                disabled={isBusy}
              />
              Contrast stretch (auto-levels)
            </label>
            <label className="form-check-row">
              <input
                className="form-checkbox"
                type="checkbox"
                checked={options.otsuThreshold}
                onChange={() => handleOptionToggle('otsuThreshold')}
                disabled={isBusy}
              />
              Otsu threshold (binarize)
            </label>
            <label className="form-check-row">
              <input
                className="form-checkbox"
                type="checkbox"
                checked={options.deskew}
                onChange={() => handleOptionToggle('deskew')}
                disabled={isBusy}
              />
              Deskew (slow)
            </label>
            <label className="form-check-row">
              <input
                className="form-checkbox"
                type="checkbox"
                checked={options.upscale2x}
                onChange={() => handleOptionToggle('upscale2x')}
                disabled={isBusy}
              />
              Upscale 2× (low-res images)
            </label>
          </div>

          <div className="ocr-page__actions">
            <button
              type="button"
              className="global-btn default-btn flex-1"
              onClick={handleRunOCR}
              disabled={!canRun}
            >
              {run.status === 'recognizing' ? 'Running…' : 'Run OCR'}
            </button>
            <button
              type="button"
              className="global-btn cancel-btn flex-1"
              onClick={handleReset}
              disabled={isBusy || (!file && run.status === 'idle')}
            >
              Reset
            </button>
          </div>

          {run.status === 'recognizing' && (
            <>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
                {run.message} {Math.round(run.progress * 100)}%
              </p>
              <div className="ocr-page__progress-track">
                <div
                  className="ocr-page__progress-fill"
                  style={{ width: `${Math.round(run.progress * 100)}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {loadError && (
        <div className="card card--md card--red mb-6">
          <p className="card-header">Couldn't load file</p>
          <p className="text-sm">{loadError}</p>
        </div>
      )}

      {run.error && (
        <div className="card card--md card--red mb-6">
          <p className="card-header">OCR error</p>
          <p className="text-sm">{run.error}</p>
        </div>
      )}

      {originals.length > 0 &&
        originals.map((orig, i) => (
          <div key={i} className="ocr-page__previews">
            <CanvasPreview
              source={orig}
              label={originals.length > 1 ? `Original — page ${i + 1}` : 'Original'}
            />
            <CanvasPreview
              source={processed[i] ?? null}
              label={originals.length > 1 ? `Processed — page ${i + 1}` : 'Processed'}
            />
          </div>
        ))}

      {run.results.length > 0 && (
        <div className="card card--md">
          <p className="card-header">
            Extracted text
            {run.results.length === 1 &&
              ` · confidence ${run.results[0].confidence.toFixed(0)}%`}
          </p>
          <textarea
            className="form-textarea ocr-page__text-output"
            readOnly
            value={concatenatedText}
          />
        </div>
      )}
    </div>
  );
};

export default OCRTest;

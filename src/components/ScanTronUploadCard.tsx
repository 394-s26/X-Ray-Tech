import { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { ClipboardIcon } from '../services/svgIcons';
import { useOcrPipeline } from '../hooks/useOcrPipeline';
import { validateUploadFile } from '../services/fileValidation';
import { saveScantron } from '../services/scantronService';
import { parseScantronText } from '../services/certificateParser';
import {
  STORAGE_LIMITS,
  StorageLimitError,
  type Scantron,
} from '../types/upload';
import '../styles/components/UploadCard.css';

interface ScanTronUploadCardProps {
  uid: string;
  scantronsStored: number;
  onSaved: (scantron: Scantron) => void;
  disabled?: boolean;
  onSavedConsumed: () => void;
}

interface ScanForm {
  examName: string;
  examDate: string;
  ocrText: string;
  ocrConfidence: number;
}

const EMPTY_FORM: ScanForm = {
  examName: '',
  examDate: '',
  ocrText: '',
  ocrConfidence: 0,
};

export const ScanTronUploadCard = ({
  uid,
  scantronsStored,
  onSaved,
  disabled,
  onSavedConsumed,
}: ScanTronUploadCardProps) => {
  const pipeline = useOcrPipeline();
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [form, setForm] = useState<ScanForm>(EMPTY_FORM);
  const [showRawText, setShowRawText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const storageRemaining = STORAGE_LIMITS.scantron - scantronsStored;
  const storageExhausted = storageRemaining <= 0;
  const isProcessing = pipeline.status === 'loading' || pipeline.status === 'recognizing';
  const isBusy = !!disabled || isSaving || isProcessing;
  const formReady = pipeline.status === 'done' && pickedFile !== null;

  const updateField = <K extends keyof ScanForm>(key: K, value: ScanForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetAll = () => {
    pipeline.reset();
    setPickedFile(null);
    setForm(EMPTY_FORM);
    setShowRawText(false);
    setPickError(null);
    setSaveError(null);
  };

  const handleFileChange = async (file: File | null) => {
    setPickError(null);
    setSaveError(null);

    if (!file) {
      resetAll();
      return;
    }

    try {
      await validateUploadFile(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'File validation failed.';
      setPickError(msg);
      pipeline.reset();
      setPickedFile(null);
      setForm(EMPTY_FORM);
      return;
    }

    setPickedFile(file);
    setForm(EMPTY_FORM);

    try {
      const { text, confidence } = await pipeline.processFile(file);
      const parsed = parseScantronText(text);
      setForm({
        examName: parsed.examName ?? '',
        examDate: parsed.examDate ?? '',
        ocrText: text,
        ocrConfidence: confidence,
      });
    } catch {
      // pipeline.error is already set
    }
  };

  const handleSave = async () => {
    if (!form.examName.trim() && !form.examDate.trim()) {
      setSaveError('Add at least the exam name or test date before saving.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await saveScantron({
        uid,
        ocrText: form.ocrText.trim(),
        ocrConfidence: form.ocrConfidence,
        examName: form.examName.trim() || null,
        examDate: form.examDate.trim() || null,
      });
      onSavedConsumed();
      onSaved(saved);
      resetAll();
    } catch (err) {
      let msg = 'Failed to save scan-tron.';
      if (err instanceof StorageLimitError) msg = err.message;
      else if (err instanceof Error) msg = err.message;
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card card--md upload-card">
      <header className="upload-card__header">
        <span className="upload-card__icon">
          <ClipboardIcon size={22} />
        </span>
        <div>
          <h2 className="upload-card__title">Scan-tron test</h2>
          <p className="upload-card__subtitle">
            Text only — the file itself is never uploaded.
          </p>
        </div>
        <span className="upload-card__quota">
          {scantronsStored}/{STORAGE_LIMITS.scantron} stored
        </span>
      </header>

      <FileDropzone
        file={pickedFile}
        onFileChange={handleFileChange}
        disabled={isBusy || storageExhausted}
        helperText={
          storageExhausted
            ? `You've reached the ${STORAGE_LIMITS.scantron}-scan-tron limit — delete an older one to upload more`
            : 'JPEG or PNG up to 5 MB · PDF up to 10 MB · 1–3 pages'
        }
      />

      {pickError && (
        <div className="upload-card__error">
          <p className="text-sm">{pickError}</p>
        </div>
      )}

      {pipeline.error && (
        <div className="upload-card__error">
          <p className="text-sm">{pipeline.error}</p>
        </div>
      )}

      {pickedFile && isProcessing && (
        <div className="upload-card__progress">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {pipeline.status === 'loading' ? 'Reading file…' : 'Extracting text…'}{' '}
            {Math.round(pipeline.progress * 100)}%
          </p>
          <div className="upload-card__progress-track">
            <div
              className="upload-card__progress-fill"
              style={{ width: `${Math.round(pipeline.progress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {formReady && (
        <>
          <div className="upload-card__metadata">
            <div className="form-field">
              <label className="form-label" htmlFor="scan-exam">Exam name</label>
              <input
                id="scan-exam"
                className="form-input"
                type="text"
                value={form.examName}
                onChange={e => updateField('examName', e.target.value.slice(0, 120))}
                placeholder="e.g. ARRT — MRI Safety"
                disabled={isBusy}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="scan-date">Test date</label>
              <input
                id="scan-date"
                className="form-input"
                type="date"
                value={form.examDate}
                onChange={e => updateField('examDate', e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className="form-field upload-card__metadata-hint">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                When the matching certificate arrives, you'll be offered to clean up this
                scan-tron record.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="upload-card__advanced-toggle"
            onClick={() => setShowRawText(s => !s)}
          >
            {showRawText ? '▾' : '▸'} Show extracted text
            {form.ocrConfidence > 0 && ` · ${form.ocrConfidence.toFixed(0)}% confidence`}
          </button>
          {showRawText && (
            <textarea
              className="form-textarea upload-card__text"
              rows={5}
              value={form.ocrText}
              onChange={e => updateField('ocrText', e.target.value)}
              disabled={isBusy}
            />
          )}

          {saveError && (
            <div className="upload-card__error">
              <p className="text-sm">{saveError}</p>
            </div>
          )}

          <div className="upload-card__actions">
            <button
              type="button"
              className="global-btn default-btn flex-1"
              onClick={handleSave}
              disabled={isBusy}
            >
              {isSaving ? 'Saving…' : 'Save scan-tron text'}
            </button>
            <button
              type="button"
              className="global-btn cancel-btn flex-1"
              onClick={resetAll}
              disabled={isBusy}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

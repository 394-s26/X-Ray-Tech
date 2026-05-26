import { useState } from 'react';
import { FileDropzone } from './FileDropzone';
import { CertificateIcon } from '../services/svgIcons';
import { useOcrPipeline } from '../hooks/useOcrPipeline';
import { validateUploadFile } from '../services/fileValidation';
import { sanitizeImageForUpload } from '../services/imageSanitization';
import { saveCertificate, findMatchingScantronsForCert } from '../services/certificateService';
import { parseCertificateText } from '../services/certificateParser';
import {
  STORAGE_LIMITS,
  StorageLimitError,
  type Certificate,
  type CertificateContentType,
  type Scantron,
} from '../types/upload';
import '../styles/components/UploadCard.css';

interface CertificateUploadCardProps {
  uid: string;
  certificatesStored: number;
  onSaved: (cert: Certificate, matches: Scantron[]) => void;
  disabled?: boolean;
  onSavedConsumed: () => void;
}

interface CertForm {
  providerName: string;
  completedDate: string;
  expirationDate: string;
  ceCredits: string;
  examName: string;
  ocrText: string;
  ocrConfidence: number;
}

const EMPTY_FORM: CertForm = {
  providerName: '',
  completedDate: '',
  expirationDate: '',
  ceCredits: '',
  examName: '',
  ocrText: '',
  ocrConfidence: 0,
};

export const CertificateUploadCard = ({
  uid,
  certificatesStored,
  onSaved,
  disabled,
  onSavedConsumed,
}: CertificateUploadCardProps) => {
  const pipeline = useOcrPipeline();
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [validatedType, setValidatedType] = useState<CertificateContentType | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [form, setForm] = useState<CertForm>(EMPTY_FORM);
  const [showRawText, setShowRawText] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const storageRemaining = STORAGE_LIMITS.certificate - certificatesStored;
  const storageExhausted = storageRemaining <= 0;
  const isProcessing = pipeline.status === 'loading' || pipeline.status === 'recognizing';
  const isBusy = !!disabled || isSaving || isProcessing;
  const formReady = pipeline.status === 'done' && pickedFile !== null;

  const updateField = <K extends keyof CertForm>(key: K, value: CertForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetAll = () => {
    pipeline.reset();
    setPickedFile(null);
    setValidatedType(null);
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

    let declared: CertificateContentType;
    try {
      declared = await validateUploadFile(file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'File validation failed.';
      setPickError(msg);
      pipeline.reset();
      setPickedFile(null);
      setValidatedType(null);
      setForm(EMPTY_FORM);
      return;
    }

    setValidatedType(declared);
    setPickedFile(file);
    setForm(EMPTY_FORM);

    try {
      const { text, confidence } = await pipeline.processFile(file);
      const parsed = parseCertificateText(text);
      setForm({
        providerName: parsed.providerName ?? '',
        completedDate: parsed.completedDate ?? '',
        expirationDate: parsed.expirationDate ?? '',
        ceCredits: parsed.ceCredits != null ? String(parsed.ceCredits) : '',
        examName: parsed.examName ?? '',
        ocrText: text,
        ocrConfidence: confidence,
      });
    } catch {
      // pipeline.error is already set
    }
  };

  const handleSave = async () => {
    if (!pickedFile || !validatedType) return;
    if (!form.providerName.trim() && !form.completedDate.trim()) {
      setSaveError('Add at least the provider name or completion date before saving.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      let blobToUpload: Blob = pickedFile;
      let contentType: CertificateContentType = validatedType;

      if (validatedType === 'image/jpeg' || validatedType === 'image/png') {
        const sanitized = await sanitizeImageForUpload(pickedFile);
        blobToUpload = sanitized.blob;
        contentType = sanitized.contentType;
      }

      const ceCreditsNum = form.ceCredits.trim() === '' ? null : Number(form.ceCredits);
      const ceCreditsClean =
        ceCreditsNum !== null && Number.isFinite(ceCreditsNum) ? ceCreditsNum : null;

      const saved = await saveCertificate(
        {
          uid,
          displayFileName: pickedFile.name.slice(0, 200),
          contentType,
          ocrText: form.ocrText.trim(),
          ocrConfidence: form.ocrConfidence,
          providerName: form.providerName.trim() || null,
          completedDate: form.completedDate.trim() || null,
          expirationDate: form.expirationDate.trim() || null,
          ceCredits: ceCreditsClean,
          examName: form.examName.trim() || null,
        },
        blobToUpload,
      );

      onSavedConsumed();

      const matches = await findMatchingScantronsForCert(
        uid,
        saved.examName ?? saved.providerName,
        saved.completedDate,
      );

      onSaved(saved, matches);
      resetAll();
    } catch (err) {
      let msg = 'Failed to save certificate.';
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
          <CertificateIcon size={22} />
        </span>
        <div>
          <h2 className="upload-card__title">Certificate</h2>
          <p className="upload-card__subtitle">
            Stored long-term. Image and PDF files accepted.
          </p>
        </div>
        <span className="upload-card__quota">
          {certificatesStored}/{STORAGE_LIMITS.certificate} stored
        </span>
      </header>

      <FileDropzone
        file={pickedFile}
        onFileChange={handleFileChange}
        disabled={isBusy || storageExhausted}
        helperText={
          storageExhausted
            ? `You've reached the ${STORAGE_LIMITS.certificate}-certificate limit — delete an older one to upload more`
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
              <label className="form-label" htmlFor="cert-provider">Provider</label>
              <input
                id="cert-provider"
                className="form-input"
                type="text"
                value={form.providerName}
                onChange={e => updateField('providerName', e.target.value.slice(0, 120))}
                placeholder="e.g. ARRT"
                disabled={isBusy}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="cert-completed">Completed</label>
              <input
                id="cert-completed"
                className="form-input"
                type="date"
                value={form.completedDate}
                onChange={e => updateField('completedDate', e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="cert-expires">Expires</label>
              <input
                id="cert-expires"
                className="form-input"
                type="date"
                value={form.expirationDate}
                onChange={e => updateField('expirationDate', e.target.value)}
                disabled={isBusy}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="cert-credits">CE credits</label>
              <input
                id="cert-credits"
                className="form-number"
                type="text"
                inputMode="decimal"
                value={form.ceCredits}
                onChange={e => {
                  const raw = e.target.value.replace(/[^\d.]/g, '');
                  const first = raw.indexOf('.');
                  const cleaned =
                    first === -1
                      ? raw
                      : raw.slice(0, first + 1) + raw.slice(first + 1).replace(/\./g, '');
                  updateField('ceCredits', cleaned);
                }}
                disabled={isBusy}
              />
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
              {isSaving ? 'Saving…' : 'Save certificate'}
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

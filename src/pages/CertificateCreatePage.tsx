import { useId, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { CertificateUploadIcon, PlusIcon } from '../services/svgIcons';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import {
  createCertificateRecord,
  describeCertificateSaveError,
} from '../services/certificateService';
import type { CertificateSaveResultState } from './CertificateSaveResultPage';
import { useOcrPipeline } from '../hooks/useOcrPipeline';
import { parseCertificateText } from '../services/certificateParser';
import type { PreprocessingOptions } from '../types/ocr';
import '../styles/components/CertCreate.css';

const ALL_PREPROCESSING_OPTIONS: PreprocessingOptions = {
  grayscale: true,
  stretchContrast: true,
  otsuThreshold: true,
  deskew: true,
  upscale2x: true,
};

const PRIMARY_BTN =
  'rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--fg-on-brand)] px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50';

// Per-account image upload allowance. Once the cap is reached, certificates can
// still be created — they just save without a photo and fall back to a placeholder.
const IMAGE_UPLOAD_LIMIT = 48;
const MAX_UPLOAD_SIZE_MB = 50;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

function imageUploadKey(): string {
  let uid = 'anon';
  try {
    uid = getAuth().currentUser?.uid ?? 'anon';
  } catch {
    /* firebase not ready — fall back to a shared key */
  }
  return `cert-image-uploads:${uid}`;
}

function readImageUploadCount(): number {
  try {
    return parseInt(window.localStorage.getItem(imageUploadKey()) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function bumpImageUploadCount(): number {
  const next = readImageUploadCount() + 1;
  try {
    window.localStorage.setItem(imageUploadKey(), String(next));
  } catch {
    /* ignore storage failures */
  }
  return next;
}

export const CertificateCreatePage = () => {
  const formId = useId();
  const navigate = useNavigate();

  const [certificateName, setCertificateName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [expiresDate, setExpiresDate] = useState('');
  const [points, setPoints] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badFileType, setBadFileType] = useState(false);
  const [imagesUsed, setImagesUsed] = useState(() => readImageUploadCount());

  const pipeline = useOcrPipeline();
  const isReadingFile =
    pipeline.status === 'loading' || pipeline.status === 'recognizing';
  const formDisabled = loading || isReadingFile;

  const imagesRemaining = Math.max(0, IMAGE_UPLOAD_LIMIT - imagesUsed);
  const imageLimitReached = imagesRemaining <= 0;

  const clearForm = () => {
    setCertificateName('');
    setCompanyName('');
    setCompletedDate('');
    setExpiresDate('');
    setPoints('');
    setCategoryType('');
    setBadFileType(false);
  };

  const runOcrOnFile = async (file: File) => {
    clearForm();
    try {
      const { text } = await pipeline.processFile(file, ALL_PREPROCESSING_OPTIONS);
      if (text.trim().length < 15) {
        return;
      }
      const parsed = parseCertificateText(text);
      if (parsed.examName) setCertificateName(parsed.examName);
      if (parsed.providerName) setCompanyName(parsed.providerName);
      if (parsed.completedDate) setCompletedDate(parsed.completedDate);
      if (parsed.expirationDate) setExpiresDate(parsed.expirationDate);
      if (parsed.ceCredits !== null) setPoints(String(parsed.ceCredits));
      if (parsed.categoryType) {
        const normalized = parsed.categoryType.trim().toUpperCase();
        if (normalized === 'A' || normalized === 'A+' || normalized === 'N/A') {
          setCategoryType(normalized);
        }
      }
    } catch {
      // pipeline.error is already set; user can still fill the form manually
    }
  };

  const acceptFile = (file: File | null | undefined) => {
    if (!file) return;
    if (imageLimitReached) {
      setError(
        `Image upload limit reached (${IMAGE_UPLOAD_LIMIT} per account). You can still save this certificate — it will use a placeholder image.`,
      );
      return;
    }
    setBadFileType(false);
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setBadFileType(true);
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      setError(`That image is too large. Maximum file size is ${MAX_UPLOAD_SIZE_MB} MB.`);
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    void runOcrOnFile(file);
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    acceptFile(file);
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setBadFileType(false);
    pipeline.reset();
    clearForm();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!certificateName.trim()) {
      setError('Please fill the certificate name.');
      return;
    }
    if (!companyName.trim()) {
      setError('Please fill the provider.');
      return;
    }
    if (!completedDate || !expiresDate) {
      setError('Please fill both dates.');
      return;
    }
    const completed = new Date(`${completedDate}T12:00:00`);
    const expires = new Date(`${expiresDate}T12:00:00`);
    if (expires < completed) {
      setError('Expiry date must be on or after the completion date.');
      return;
    }

    const pointsNum = points === '' ? 0 : Number(points);
    if (!Number.isFinite(pointsNum) || pointsNum < 0) {
      setError('Points must be a valid non-negative number.');
      return;
    }

    setLoading(true);
    try {
      const id = await createCertificateRecord({
        photoFile,
        certificateName,
        providerName: companyName,
        completedDate,
        expirationDate: expiresDate,
        ceCredits: pointsNum,
        categoryType: categoryType.trim() || null,
        categories: [],
        appliedCycles: {},
      });
      if (photoFile) {
        setImagesUsed(bumpImageUploadCount());
      }
      const successState: CertificateSaveResultState = {
        status: 'success',
        certId: id,
        certificateName,
        expirationDate: expiresDate,
        categories: [],
      };
      navigate('/certificates/saved', { state: successState });
    } catch (err) {
      console.error(err);
      const errorState: CertificateSaveResultState = {
        status: 'error',
        errorMessage: describeCertificateSaveError(err),
      };
      navigate('/certificates/saved', { state: errorState });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const openFilePicker = () => {
    document.getElementById(`${formId}-photo`)?.click();
  };

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Add Certificate', to: '' }]} />

      <PageHeader
        icon={<PlusIcon size={22} />}
        title="Add certificate"
        subtitle="Add a certificate to track it. You can apply it to a license later from the Cycle Manager."
      />

      <section className="rounded-2xl cert-step-panel p-5 lg:p-6 relative overflow-hidden mx-auto max-w-5xl">
        <form id={formId} onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2 lg:items-start pt-2">
          <div className="form-field">
            <label htmlFor={`${formId}-photo`} className="form-label">
              Certificate photo <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id={`${formId}-photo`}
              name="photo"
              type="file"
              accept="image/jpeg,image/png"
              disabled={formDisabled || imageLimitReached}
              onChange={handlePhotoChange}
              className="sr-only"
            />

            {!photoFile ? (
              <div
                role="button"
                tabIndex={imageLimitReached ? -1 : 0}
                aria-disabled={imageLimitReached}
                onKeyDown={(ke) => {
                  if ((ke.key === 'Enter' || ke.key === ' ') && !imageLimitReached) {
                    ke.preventDefault();
                    openFilePicker();
                  }
                }}
                onDrop={handleOverlayDrop}
                onDragOver={(ev) => ev.preventDefault()}
                onClick={() => {
                  if (!imageLimitReached) openFilePicker();
                }}
                className={
                  imageLimitReached
                    ? 'relative flex min-h-[200px] cursor-not-allowed flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-800/40'
                    : 'relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.03] dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-primary-light/50'
                }
              >
                <div className="rounded-full bg-primary/10 p-4 dark:bg-primary-light/15">
                  <CertificateUploadIcon size={36} className="text-primary dark:text-secondary" />
                </div>
                <p className="text-base font-semibold text-primary dark:text-slate-100">
                  Upload a photo
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {imageLimitReached
                    ? 'This certificate will be saved with a placeholder image.'
                    : 'Drag and drop or click to add an image'}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  Supported formats: JPG, PNG · Max {MAX_UPLOAD_SIZE_MB} MB
                </p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/80">
                {photoPreview ? (
                  <img src={photoPreview} alt="Certificate preview" className="max-h-56 w-full object-contain" />
                ) : null}

                {isReadingFile && (
                  <div className="absolute inset-0 grid place-items-center bg-white/75 dark:bg-slate-900/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-primary dark:text-secondary">
                      <span
                        className="inline-block w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-semibold">
                        Processing image…
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end border-t border-gray-200 dark:border-slate-600 p-3">
                  <button
                    type="button"
                    disabled={formDisabled}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      clearPhoto();
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-primary-light/50"
                  >
                    Replace image
                  </button>
                </div>
              </div>
            )}

            {!photoFile && (
              badFileType ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Unsupported file type. Please use a JPG or PNG image.
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Upload a photo of your certificate.{' '}
                  <span
                    className={
                      imageLimitReached
                        ? 'font-medium text-red-600 dark:text-red-400'
                        : 'font-medium text-sky-600 dark:text-sky-400'
                    }
                  >
                   {imagesRemaining} of {IMAGE_UPLOAD_LIMIT} image uploads remaining
                  </span>
                </p>
              )
            )}
          </div>

          <div className="flex flex-col gap-5">
          <div className="form-field">
            <label htmlFor={`${formId}-name`} className="form-label">
              Certificate name <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-name`}
              type="text"
              placeholder="e.g. Advanced CT Imaging"
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              required
              disabled={formDisabled}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-company`} className="form-label">
              Provider <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-company`}
              type="text"
              placeholder="Company or institution name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              disabled={formDisabled}
              className="form-input"
              autoComplete="organization"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="form-field">
              <label htmlFor={`${formId}-completed`} className="form-label">
                Date completed <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-completed`}
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                required
                disabled={formDisabled}
                className="form-input"
                max={expiresDate || undefined}
              />
            </div>
            <div className="form-field">
              <label htmlFor={`${formId}-expires`} className="form-label">
                Expiry date <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-expires`}
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                required
                disabled={formDisabled}
                className="form-input"
                min={completedDate || undefined}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-points`} className="form-label">
              CE points <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-points`}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={points}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d.]/g, '');
                const first = raw.indexOf('.');
                const cleaned =
                  first === -1
                    ? raw
                    : raw.slice(0, first + 1) + raw.slice(first + 1).replace(/\./g, '');
                setPoints(cleaned);
              }}
              required
              disabled={formDisabled}
              className="form-number"
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-category-type`} className="form-label">
              Category type
            </label>
            <select
              id={`${formId}-category-type`}
              value={categoryType}
              onChange={(e) => setCategoryType(e.target.value)}
              disabled={formDisabled}
              className="form-input"
            >
              <option value="">Select…</option>
              <option value="A+">A+</option>
              <option value="A">A</option>
              <option value="N/A">N/A</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Only A and A+ count toward ARRT and IEMA CE requirements. Pick N/A if the certificate has no category.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={formDisabled}
              className={PRIMARY_BTN}
            >
              {loading ? 'Saving…' : 'Save certificate'}
            </button>
          </div>
          </div>
        </form>

        {error ? (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>
    </main>
  );
};

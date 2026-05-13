import { useId, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CertificateUploadIcon, PlusIcon } from '../services/svgIcons';
import {
  createCertificateRecord,
  describeCertificateSaveError,
} from '../services/certificateService';
import type { CertificateCategory } from '../types/certification';
import { useOcrPipeline } from '../hooks/useOcrPipeline';
import { parseCertificateText } from '../services/certificateParser';
import type { PreprocessingOptions } from '../types/ocr';

// All preprocessing steps on so the OCR has its best chance at the text. We
// intentionally don't expose these as toggles on this page.
const ALL_PREPROCESSING_OPTIONS: PreprocessingOptions = {
  grayscale: true,
  stretchContrast: true,
  otsuThreshold: true,
  deskew: true,
  upscale2x: true,
};

const CATEGORY_ROUTE: Record<string, string> = { ARRT: '/arrt', IEMA: '/iema', CPR: '/cpr' };

export const CertificateCreatePage = () => {
  const categoryOptions: CertificateCategory[] = ['IEMA', 'ARRT', 'CPR'];
  const formId = useId();
  const navigate = useNavigate();
  const [certificateName, setCertificateName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [expiresDate, setExpiresDate] = useState('');
  const [points, setPoints] = useState('');
  const [categories, setCategories] = useState<CertificateCategory[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [badFileType, setBadFileType] = useState(false);
  const [noTextDetected, setNoTextDetected] = useState(false);

  const pipeline = useOcrPipeline();
  const isReadingFile =
    pipeline.status === 'loading' || pipeline.status === 'recognizing';
  const formDisabled = loading || isReadingFile;

  const UNSUPPORTED_IMAGE_TYPES = ['image/heic', 'image/heif', 'image/avif', 'image/tiff', 'image/bmp', 'image/svg+xml'];

  const clearForm = () => {
    setCertificateName('');
    setCompanyName('');
    setCompletedDate('');
    setExpiresDate('');
    setPoints('');
    setCategories([]);
    setBadFileType(false);
    setNoTextDetected(false);
  };

  const runOcrOnFile = async (file: File) => {
    clearForm();
    setNoTextDetected(false);
    try {
      const { text } = await pipeline.processFile(file, ALL_PREPROCESSING_OPTIONS);
      if (text.trim().length < 15) {
        setNoTextDetected(true);
        return;
      }
      const parsed = parseCertificateText(text);
      if (parsed.examName) setCertificateName(parsed.examName);
      if (parsed.providerName) setCompanyName(parsed.providerName);
      if (parsed.completedDate) setCompletedDate(parsed.completedDate);
      if (parsed.expirationDate) setExpiresDate(parsed.expirationDate);
      if (parsed.ceCredits !== null) setPoints(String(parsed.ceCredits));
    } catch {
      // pipeline.error is already set; user can still fill the form manually
    }
  };

  const acceptFile = (file: File | null | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    setBadFileType(false);
    setNoTextDetected(false);
    if (UNSUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setBadFileType(true);
      return;
    }
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
    setNoTextDetected(false);
    pipeline.reset();
    clearForm();
  };

  const toggleCategory = (selected: CertificateCategory) => {
    setCategories((prev) => {
      if (prev.includes(selected)) return prev.filter((c) => c !== selected);
      // CPR is mutually exclusive with ARRT/IEMA and vice versa
      if (selected === 'CPR') return ['CPR'];
      return [...prev.filter((c) => c !== 'CPR'), selected];
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessId(null);

    if (!photoFile || categories.length === 0) {
      setError('Please complete all required fields.');
      return;
    }

    const isCpr = categories.includes('CPR');
    const pointsNum = points === '' && isCpr ? 0 : Number(points);
    if (!Number.isFinite(pointsNum) || pointsNum < 0) {
      setError('Points must be a valid non-negative number.');
      return;
    }

    const completed = new Date(`${completedDate}T12:00:00`);
    const expires = new Date(`${expiresDate}T12:00:00`);
    if (expires < completed) {
      setError('Expiry date must be on or after the completion date.');
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
        categories,
      });
      const route = CATEGORY_ROUTE[categories[0]] ?? '/arrt';
      navigate(`${route}?certificate=${id}`);
    } catch (err) {
      console.error(err);
      setError(describeCertificateSaveError(err));
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
    <main className="min-h-[calc(100vh-6rem)] pb-16 px-5 lg:px-10 w-full max-w-3xl mx-auto">
      <header className="mt-2 mb-8 flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-secondary">
          <PlusIcon size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-50 leading-tight">
            Add certificate
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Upload a photo and we'll pre-fill the details from the certificate text.
          </p>
        </div>
      </header>

      <section className="rounded-2xl glass-panel p-5 lg:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary dark:bg-secondary pointer-events-none" />

        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          <div className="form-field">
            <label htmlFor={`${formId}-photo`} className="form-label">
              Certificate photo <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-photo`}
              name="photo"
              type="file"
              accept="image/*"
              disabled={formDisabled}
              onChange={handlePhotoChange}
              className="sr-only"
            />

            {!photoFile ? (
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(ke) => {
                  if (ke.key === 'Enter' || ke.key === ' ') {
                    ke.preventDefault();
                    openFilePicker();
                  }
                }}
                onDrop={handleOverlayDrop}
                onDragOver={(ev) => ev.preventDefault()}
                onClick={openFilePicker}
                className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-white/60 px-6 py-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.03] dark:border-slate-600 dark:bg-slate-800/40 dark:hover:border-primary-light/50"
              >
                <div className="rounded-full bg-primary/10 p-4 dark:bg-primary-light/15">
                  <CertificateUploadIcon
                    size={36}
                    className="text-primary dark:text-secondary"
                  />
                </div>
                <p className="text-base font-semibold text-primary dark:text-slate-100">
                  Upload certificate photo
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Drag and drop or click to select an image
                </p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/80">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Certificate preview"
                    className="max-h-56 w-full object-contain"
                  />
                ) : null}

                {isReadingFile && (
                  <div className="absolute inset-0 grid place-items-center bg-white/75 dark:bg-slate-900/70 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2 text-primary dark:text-secondary">
                      <span
                        className="inline-block w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin"
                        aria-hidden="true"
                      />
                      <p className="text-sm font-semibold">
                        {pipeline.status === 'loading'
                          ? 'Reading image…'
                          : `Extracting text… ${Math.round(pipeline.progress * 100)}%`}
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
                    className="global-btn outline default-btn max-w-[10rem] py-2 text-xs"
                  >
                    Replace image
                  </button>
                </div>
              </div>
            )}

            {!badFileType && pipeline.error && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Couldn't read text from this image. Try a clearer photo.
              </p>
            )}
            {!badFileType && noTextDetected && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                No text detected — consider uploading a different image.
              </p>
            )}
            {!badFileType && pipeline.status === 'done' && !pipeline.error && !noTextDetected && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Certificate text auto-filled.
              </p>
            )}
            {!photoFile && (
              badFileType ? (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Unsupported file type. Please convert to JPEG or PNG and try again.
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Upload a photo or scan from email or mail.
                </p>
              )
            )}
          </div>

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
              CE points {!categories.includes('CPR') && <span className="text-red-500">*</span>}
            </label>
            <input
              id={`${formId}-points`}
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              placeholder="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required={!categories.includes('CPR')}
              disabled={formDisabled || categories.includes('CPR')}
              className="form-number"
            />
          </div>

          <div className="form-field">
            <span className="form-label">
              Licenses <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-row gap-2 sm:gap-3">
              {categoryOptions.map((cat) => {
                const isCprSelected = categories.includes('CPR');
                const isArrtIemaSelected = categories.some((c) => c === 'ARRT' || c === 'IEMA');
                const isGreyed =
                  (cat === 'CPR' && isArrtIemaSelected) ||
                  ((cat === 'ARRT' || cat === 'IEMA') && isCprSelected);
                const isDisabled = formDisabled || isGreyed;
                return (
                  <label
                    key={cat}
                    className={`flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      categories.includes(cat)
                        ? 'border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/20 dark:text-slate-100'
                        : isGreyed
                        ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-600'
                        : 'cursor-pointer border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500'
                    } ${formDisabled ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      name="categories"
                      value={cat}
                      checked={categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      disabled={isDisabled}
                      className="form-checkbox"
                    />
                    {cat}
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Select at least one license. CPR cannot be combined with other licenses.</p>
          </div>

          <button
            type="submit"
            disabled={formDisabled}
            className="global-btn default-btn mt-1 flex max-w-sm items-center justify-between gap-3 self-center"
          >
            <span>{loading ? 'Saving…' : 'Save certificate'}</span>
            <ArrowRightIcon size={18} className="shrink-0" />
          </button>
        </form>

        {error ? (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {successId ? (
          <p
            className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
            role="status"
          >
            Saved successfully. Record ID:{' '}
            <strong className="font-mono text-sm">{successId}</strong>
          </p>
        ) : null}
      </section>
    </main>
  );
};

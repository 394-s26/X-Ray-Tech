import { useId, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CertificateUploadIcon, PlusIcon } from '../services/svgIcons';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import { CreditBar } from '../components/CreditBar';
import {
  createCertificateRecord,
  describeCertificateSaveError,
} from '../services/certificateService';
import type { AppliedCycles, CertificateCategory } from '../types/certification';
import type { AppUser } from '../types/auth';
import type { CertificateSaveResultState } from './CertificateSaveResultPage';
import { useOcrPipeline } from '../hooks/useOcrPipeline';
import { useCertifications } from '../hooks/useCertifications';
import { parseCertificateText } from '../services/certificateParser';
import {
  PER_LICENSE,
  computeArrtCycle,
  computeIemaCycle,
  creditsInCycle,
} from '../utils/cycles';
import type { PreprocessingOptions } from '../types/ocr';
import '../styles/components/CertCreate.css';

const ALL_PREPROCESSING_OPTIONS: PreprocessingOptions = {
  grayscale: true,
  stretchContrast: true,
  otsuThreshold: true,
  deskew: true,
  upscale2x: true,
};

type LicensedCategory = Exclude<CertificateCategory, 'CPR'>;

interface CertificateCreatePageProps {
  appUser: AppUser;
}

const PRIMARY_BTN =
  'rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--fg-on-brand)] px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50';
const OUTLINE_BTN =
  'rounded-lg border border-[var(--ink-200)] dark:border-[var(--ink-700)] bg-transparent text-[var(--ink-700)] dark:text-[var(--ink-300)] px-4 py-2 text-sm font-semibold hover:bg-[var(--ink-100)] dark:hover:bg-[var(--ink-800)] transition-colors disabled:opacity-50';

export const CertificateCreatePage = ({ appUser }: CertificateCreatePageProps) => {
  const categoryOptions: CertificateCategory[] = ['IEMA', 'ARRT', 'CPR'];
  const formId = useId();
  const navigate = useNavigate();
  const { certifications } = useCertifications();

  const [step, setStep] = useState<1 | 2>(1);
  const [certificateName, setCertificateName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [expiresDate, setExpiresDate] = useState('');
  const [points, setPoints] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [categories, setCategories] = useState<CertificateCategory[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badFileType, setBadFileType] = useState(false);
  const [noTextDetected, setNoTextDetected] = useState(false);

  const pipeline = useOcrPipeline();
  const isReadingFile =
    pipeline.status === 'loading' || pipeline.status === 'recognizing';
  const formDisabled = loading || isReadingFile;

  const UNSUPPORTED_IMAGE_TYPES = ['image/heic', 'image/heif', 'image/avif', 'image/tiff', 'image/bmp', 'image/svg+xml'];

  // ── Cycle math for step 2 ──────────────────────────────────────────────────
  const iemaCurrent = useMemo(() => computeIemaCycle(appUser), [appUser]);
  const arrtCurrent = useMemo(() => computeArrtCycle(appUser), [appUser]);

  const incomingPoints = (() => {
    const n = Number(points);
    return Number.isFinite(n) && n > 0 ? n : 0;
  })();

  const usedInCurrent = useMemo(() => {
    return {
      ARRT: arrtCurrent ? creditsInCycle(certifications, 'ARRT', arrtCurrent, appUser) : 0,
      IEMA: iemaCurrent ? creditsInCycle(certifications, 'IEMA', iemaCurrent, appUser) : 0,
    };
  }, [certifications, appUser, arrtCurrent, iemaCurrent]);

  const cycleFull = (license: LicensedCategory): boolean => {
    return usedInCurrent[license] >= PER_LICENSE;
  };

  // ── Form handlers ──────────────────────────────────────────────────────────
  const clearForm = () => {
    setCertificateName('');
    setCompanyName('');
    setCompletedDate('');
    setExpiresDate('');
    setPoints('');
    setCategoryType('');
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
      if (categories.includes('CPR')) {
        setPoints('0');
      } else if (parsed.ceCredits !== null) {
        setPoints(String(parsed.ceCredits));
      }
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
    // Defensive: ignore clicks on a license whose current cycle is already full.
    if (selected !== 'CPR' && !categories.includes(selected) && cycleFull(selected)) return;
    setCategories((prev) => {
      if (prev.includes(selected)) return prev.filter((c) => c !== selected);
      if (selected === 'CPR') {
        setPoints('0');
        return ['CPR'];
      }
      return [...prev.filter((c) => c !== 'CPR'), selected];
    });
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep1 = (): string | null => {
    if (!certificateName.trim()) return 'Please fill the certificate name.';
    if (!companyName.trim()) return 'Please fill the provider.';
    if (!completedDate || !expiresDate) return 'Please fill both dates.';
    const completed = new Date(`${completedDate}T12:00:00`);
    const expires = new Date(`${expiresDate}T12:00:00`);
    if (expires < completed) return 'Expiry date must be on or after the completion date.';
    // Points required only if the user didn't pre-pick CPR in step 1 (rare path).
    if (!categories.includes('CPR')) {
      const n = Number(points);
      if (!Number.isFinite(n) || n < 0) return 'Points must be a valid non-negative number.';
    }
    return null;
  };

  const handleNext = () => {
    setError(null);
    const v = validateStep1();
    if (v) {
      setError(v);
      return;
    }
    setStep(2);
  };

  const buildAppliedCycles = (): AppliedCycles => {
    const out: AppliedCycles = {};
    for (const cat of categories) {
      if (cat === 'CPR') continue;
      const cycle = cat === 'ARRT' ? arrtCurrent : iemaCurrent;
      if (cycle) out[cat] = cycle.startISO;
    }
    return out;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const isCpr = categories.includes('CPR');
    const pointsNum = points === '' && isCpr ? 0 : Number(points);
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
        categories,
        appliedCycles: buildAppliedCycles(),
      });
      const successState: CertificateSaveResultState = {
        status: 'success',
        certId: id,
        certificateName,
        expirationDate: expiresDate,
        categories,
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

  // ── Rendering ──────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <div className="form-field">
        <label htmlFor={`${formId}-photo`} className="form-label">
          Certificate photo <span className="text-gray-400 font-normal">(optional)</span>
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
              <CertificateUploadIcon size={36} className="text-primary dark:text-secondary" />
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
          type="button"
          onClick={handleNext}
          disabled={formDisabled}
          className={PRIMARY_BTN}
        >
          Next
        </button>
      </div>
    </>
  );

  const renderLicenseRow = (cat: CertificateCategory) => {
    const isCprSelected = categories.includes('CPR');
    const isArrtIemaSelected = categories.some((c) => c === 'ARRT' || c === 'IEMA');
    const mutexBlocked =
      (cat === 'CPR' && isArrtIemaSelected) ||
      ((cat === 'ARRT' || cat === 'IEMA') && isCprSelected);
    const selected = categories.includes(cat);
    const cycleFullForLicense = cat !== 'CPR' && cycleFull(cat);
    const disabled = formDisabled || mutexBlocked || (cycleFullForLicense && !selected);

    const buttonClass = [
      'flex h-12 w-28 shrink-0 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors',
      selected
        ? 'border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-700)] dark:bg-[rgba(91,63,228,0.18)] dark:text-[var(--ink-100)]'
        : disabled
          ? 'cursor-not-allowed border-[var(--ink-200)] bg-[var(--ink-100)] text-[var(--ink-400)] dark:border-[var(--ink-700)] dark:bg-[var(--ink-800)] dark:text-[var(--ink-500)]'
          : 'cursor-pointer border-[var(--ink-200)] bg-[var(--paper)] text-[var(--ink-800)] hover:border-[var(--ink-400)] dark:border-[var(--ink-700)] dark:bg-[var(--bg-surface,#14111F)] dark:text-[var(--ink-200)]',
    ].join(' ');

    const usedNow = cat === 'CPR' ? 0 : usedInCurrent[cat];
    const projected = usedNow + (selected ? incomingPoints : 0);

    return (
      <div key={cat} className="flex items-center gap-3">
        <label className={buttonClass}>
          <input
            type="checkbox"
            name="categories"
            checked={selected}
            onChange={() => toggleCategory(cat)}
            disabled={disabled}
            className="form-checkbox"
          />
          {cat}
        </label>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {cat === 'CPR' ? (
            <p className="text-[11px] text-[var(--ink-500)] dark:text-[var(--ink-400)] leading-tight">
              No CE cycle. Cannot combine with ARRT or IEMA.
            </p>
          ) : (
            <>
              <CreditBar
                used={usedNow}
                incoming={selected ? incomingPoints : 0}
                label={`${cat} current cycle credits`}
              />
              <p className="text-[11px] text-[var(--ink-700)] dark:text-[var(--ink-300)] leading-tight">
                {cycleFullForLicense && !selected ? (
                  <span className="text-[var(--ink-500)]">Current cycle full.</span>
                ) : selected ? (
                  <>
                    <span className="font-semibold">+{incomingPoints} pts</span> reaches{' '}
                    <span className="font-semibold tabular-nums">
                      {Math.round(projected)}/{PER_LICENSE}
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--ink-500)]">Not applied.</span>
                )}
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-500)] dark:text-[var(--ink-400)]">
          Step 2 of 2
        </p>
        <h2 className="font-display text-xl font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
          Apply {certificateName || 'this certificate'}
          {incomingPoints > 0 && (
            <span className="text-[var(--ink-500)] font-normal"> · {incomingPoints} CE pts</span>
          )}
        </h2>
        <p className="text-sm text-[var(--ink-600)] dark:text-[var(--ink-400)]">
          Choose which licenses this counts toward. ARRT and IEMA cap at 24 credits per cycle.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {categoryOptions.map(renderLicenseRow)}
      </div>

      <p className="text-xs text-[var(--ink-500)] dark:text-[var(--ink-400)]">
        Leave all unchecked to save without applying.
      </p>

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={() => setStep(1)}
          disabled={formDisabled}
          className={OUTLINE_BTN}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={formDisabled}
          className={PRIMARY_BTN}
        >
          {loading ? 'Saving…' : 'Save certificate'}
        </button>
      </div>
    </>
  );

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Add Certificate', to: '' }]} />

      <PageHeader
        icon={<PlusIcon size={22} />}
        title="Add certificate"
        subtitle={
          step === 1
            ? "Upload a photo and we'll pre-fill the details from the certificate text."
            : 'Choose which licenses these credits land in.'
        }
      />

      <section className="rounded-2xl cert-step-panel p-5 lg:p-6 relative overflow-hidden mx-auto max-w-180">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary dark:bg-secondary pointer-events-none" />

        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
          {step === 1 ? renderStep1() : renderStep2()}
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

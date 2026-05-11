import { useId, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { ArrowRightIcon, CertificateUploadIcon, PlusIcon } from '../services/svgIcons';
import {
  createCertificateRecord,
  describeCertificateSaveError,
  type CertificateCategory,
} from '../services/certificateService';

export const CertificateCreatePage = () => {
  const categoryOptions: CertificateCategory[] = ['IEMA', 'ARRT'];
  const formId = useId();
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

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoFile(file ?? null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const toggleCategory = (selected: CertificateCategory) => {
    setCategories((prev) =>
      prev.includes(selected)
        ? prev.filter((category) => category !== selected)
        : [...prev, selected],
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessId(null);

    if (!photoFile || categories.length === 0) {
      setError('Please complete all required fields.');
      return;
    }

    const pointsNum = Number(points);
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
        companyName,
        completedDate,
        expiresDate,
        points: pointsNum,
        categories,
      });
      setSuccessId(id);
      setCertificateName('');
      setCompanyName('');
      setCompletedDate('');
      setExpiresDate('');
      setPoints('');
      setCategories([]);
      clearPhoto();
      e.currentTarget.reset();
    } catch (err) {
      console.error(err);
      setError(describeCertificateSaveError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
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
            Log continuing education credits with a photo of your certificate.
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
              disabled={loading}
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
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/80">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Certificate preview"
                    className="max-h-56 w-full object-contain"
                  />
                ) : null}
                <div className="flex justify-end border-t border-gray-200 dark:border-slate-600 p-3">
                  <button
                    type="button"
                    disabled={loading}
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
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Upload a photo or scan from email or mail.
            </p>
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
              disabled={loading}
              className="form-input"
              autoComplete="off"
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${formId}-company`} className="form-label">
              Issuing organization <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-company`}
              type="text"
              placeholder="Company or institution name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              placeholder="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
              disabled={loading}
              className="form-number"
            />
          </div>

          <div className="form-field">
            <span className="form-label">
              Category <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-row gap-2 sm:gap-3">
              {categoryOptions.map((cat) => (
                <label
                  key={cat}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    categories.includes(cat)
                      ? 'border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/20 dark:text-slate-100'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-500'
                  } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    name="categories"
                    value={cat}
                    checked={categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    disabled={loading}
                    className="form-checkbox"
                  />
                  {cat}
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">Select at least one category.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
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

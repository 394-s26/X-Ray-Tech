import { useId, useState } from 'react';
import { ArrowRightIcon } from '../services/svgIcons';
import {
  createCertificateRecord,
  describeCertificateSaveError,
  type CertificateCategory,
} from '../services/certificateService';

const inputClass =
  'w-full px-4 py-[0.8rem] rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-[0.9375rem] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 disabled:opacity-60 transition-colors';

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoFile(file ?? null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const toggleCategory = (selected: CertificateCategory) => {
    setCategories((prev) =>
      prev.includes(selected)
        ? prev.filter((category) => category !== selected)
        : [...prev, selected]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      setPhotoFile(null);
      setPhotoPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      console.error(err);
      setError(describeCertificateSaveError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto rounded-2xl w-full max-w-2xl overflow-hidden">
      <div className="login-card-body">
        <h1 className="login-heading">New certificate record</h1>

        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor={`${formId}-photo`} className={labelClass}>
              Certificate photo <span className="text-red-500">*</span>
            </label>
            <input
              id={`${formId}-photo`}
              name="photo"
              type="file"
              accept="image/*"
              required
              disabled={loading}
              onChange={handlePhotoChange}
              className={`${inputClass} file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15`}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Upload a photo or scan from email or mail.
            </p>
            {photoPreview && (
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40">
                <img
                  src={photoPreview}
                  alt="Certificate preview"
                  className="max-h-48 w-full object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor={`${formId}-name`} className={labelClass}>
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
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor={`${formId}-company`} className={labelClass}>
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
              className={inputClass}
              autoComplete="organization"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-completed`} className={labelClass}>
                Date completed <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-completed`}
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                required
                disabled={loading}
                className={inputClass}
                max={expiresDate || undefined}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-expires`} className={labelClass}>
                Expiry date <span className="text-red-500">*</span>
              </label>
              <input
                id={`${formId}-expires`}
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                required
                disabled={loading}
                className={inputClass}
                min={completedDate || undefined}
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${formId}-points`} className={labelClass}>
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
              className={inputClass}
            />
          </div>

          <div>
            <span className={labelClass}>
              Category <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              {categoryOptions.map((cat) => (
                <label
                  key={cat}
                  className={`flex flex-1 cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-[0.9375rem] font-medium transition-colors ${
                    categories.includes(cat)
                      ? 'border-primary bg-primary/10 text-primary dark:border-primary dark:bg-primary/20 dark:text-slate-100'
                      : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-200 dark:hover:border-slate-500'
                  } ${loading ? 'opacity-60' : ''}`}
                >
                  <input
                    type="checkbox"
                    name="categories"
                    value={cat}
                    checked={categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    disabled={loading}
                    className="size-4 accent-primary"
                  />
                  {cat}
                </label>
              ))}
            </div>
            {categories.length === 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Select at least one category.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-3 default-btn cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{loading ? 'Saving…' : 'Save certificate'}</span>
            <ArrowRightIcon size={18} className="shrink-0" />
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}
        {successId && (
          <p className="login-success">
            Saved successfully. Record ID: <strong className="font-mono text-sm">{successId}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

import { useId, useState } from 'react';
import { ArrowRightIcon } from '../services/svgIcons';
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

  const handleOverlayDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  return (
    <div className="mx-auto w-full h-full max-w-2xl overflow-hidden">
      <div className="login-card-body relative">
        {/* <h1 className="login-heading">New certificate record</h1> */}

        {!photoFile && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm cursor-pointer"
            onDrop={handleOverlayDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById(`${formId}-photo`)?.click()}
          >
            <div className="flex flex-col items-center gap-3 px-8 text-center pointer-events-none">
              <div className="rounded-full bg-primary/10 p-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-800 dark:text-slate-100">Upload certificate photo</p>
              <p className="text-sm text-gray-500 dark:text-slate-400">Drag & drop or click to select an image</p>
            </div>
          </div>
        )}

        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="form-field">
            <label htmlFor={`${formId}-photo`} className="form-label">
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
              className="form-input file:mr-4 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/15"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Upload a photo or scan from email or mail.
            </p>
            {photoPreview && (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800">
                <img
                  src={photoPreview}
                  alt="Certificate preview"
                  className="max-h-48 w-full object-contain"
                />
              </div>
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
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Select at least one category.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="global-btn default-btn mt-2 flex items-center max-w-sm mx-auto justify-between"
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

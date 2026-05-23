import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Certification } from '../types/certification';
import { useCertifications } from '../hooks/useCertifications';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import { PhotoOverlay } from '../components/PhotoOverlay';
import {
  ArchiveIcon,
  CertificateIcon,
  FilterIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from '../services/svgIcons';
import { EXPIRING_SOON_DAYS, getArchiveStatus, unusedPointsByLicense, type LifecycleStatus } from '../services/archiveLogic';
import { renderPdfThumbnailFromUrl } from '../services/pdfRender';

type StatusFilter = 'all' | 'expired' | 'used' | 'arrt' | 'iema';

const MOBILE_PAGE_SIZE = 10;
const DESKTOP_PAGE_SIZE = 12;

const formatDate = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

const isPdfPath = (path: string | undefined | null): boolean =>
  Boolean(path && /\.pdf$/i.test(path));

function PdfThumbnail({ url, alt }: { url: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    renderPdfThumbnailFromUrl(url, 1.0, controller.signal)
      .then((canvas) => {
        if (cancelled) return;
        const node = containerRef.current;
        if (!node) return;
        node.innerHTML = '';
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100%';
        canvas.style.width = 'auto';
        canvas.style.height = 'auto';
        canvas.style.objectFit = 'contain';
        canvas.style.transform = 'scale(1)';
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', alt);
        node.appendChild(canvas);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [url, alt]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-white"
    >
      {status === 'loading' && (
        <span className="text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
          Loading PDF…
        </span>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-center gap-1 text-[var(--ink-500)]">
          <CertificateIcon size={28} />
          <span className="text-[10px] uppercase tracking-wider">PDF</span>
        </div>
      )}
    </div>
  );
}

type ChipTone =
  | 'arrtUsed'
  | 'arrtAvailable'
  | 'iemaUsed'
  | 'iemaAvailable'
  | 'cpr';

function StatusChip({ tone, label }: { tone: ChipTone; label: string }) {
  const cls =
    tone === 'arrtUsed' || tone === 'iemaUsed' || tone === 'cpr'
      ? 'bg-gray-200 text-[var(--ink-700)] dark:bg-secondary/30 dark:text-[var(--ink-100)]'
      : tone === 'arrtAvailable' || tone === 'iemaAvailable'
        ? 'bg-gray-200 text-[var(--ink-700)] dark:bg-secondary/30 dark:text-[var(--ink-100)]'
        : '';
  const dotCls =
    tone === 'arrtUsed' || tone === 'iemaUsed' || tone === 'cpr'
      ? 'bg-red-500'
      : tone === 'arrtAvailable' || tone === 'iemaAvailable'
        ? 'bg-emerald-500'
        : '';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      <span className={`mr-1.5 size-1.5 rounded-full ${dotCls}`} aria-hidden="true" />
      {label}
    </span>
  );
}

const LIFECYCLE_LABEL: Record<LifecycleStatus, string> = {
  active: 'Active',
  expiringSoon: 'Expiring Soon',
  expired: 'Expired',
};

function LifecycleLabel({ status, used = false }: { status: LifecycleStatus; used?: boolean }) {
  const cls =
    used
      ? 'bg-[var(--danger-100)] text-[var(--danger-600)]'
      : status === 'active'
      ? 'bg-[var(--success-100)] text-[var(--success-600)]'
      : status === 'expiringSoon'
        ? 'bg-[var(--warn-100)] text-[var(--warn-600)]'
        : 'bg-[var(--danger-100)] text-[var(--danger-600)]';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {used ? 'Used' : LIFECYCLE_LABEL[status]}
    </span>
  );
}

function ArchiveCard({
  cert,
  onOpen,
}: {
  cert: Certification;
  onOpen: (cert: Certification) => void;
}) {
  const status = getArchiveStatus(cert);
  const cprOnly =
    cert.categories.includes('CPR') &&
    !cert.categories.includes('ARRT') &&
    !cert.categories.includes('IEMA');
  const fullyUsed =
    (cprOnly && status.usedByCpr) || (!cprOnly && status.usedByArrt && status.usedByIema);
  const isPdf = isPdfPath(cert.photoStoragePath);
  const expiryTooltip = status.expired
    ? `Expired ${formatDate(cert.expirationDate)}`
    : `Expires ${formatDate(cert.expirationDate)}`;

  const [showTip, setShowTip] = useState(false);
  const pressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);

  const startPress = () => {
    isLongPressRef.current = false;
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);
    pressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      setShowTip(true);
    }, 400);
  };

  const endPress = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (showTip) {
      window.setTimeout(() => setShowTip(false), 1500);
    }
  };

  const handleClick = () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    onOpen(cert);
  };

  return (
    <div className="relative group">
      <div
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-20 transition-opacity duration-150 ${showTip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'}`}
      >
        <div className="rounded-full bg-white text-black border border-gray-200 text-[11px] font-semibold px-3 py-1.5 whitespace-nowrap shadow-md">
          {expiryTooltip}
        </div>
      </div>
    <button
      type="button"
      onClick={handleClick}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchCancel={endPress}
      onTouchMove={endPress}
      className="nb-card is-clickable text-left overflow-hidden flex flex-col w-full"
      aria-label={`Open ${cert.certificateName}. ${expiryTooltip}`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--ink-900)] dark:border-[var(--ink-200)]">
        <span className="text-sm font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)] truncate min-w-0 flex-1">
          {cert.certificateName}
        </span>
        <span className="shrink-0 flex items-center">
          <LifecycleLabel status={status.lifecycle} used={fullyUsed} />
        </span>
      </div>

      <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden">
        {isPdf ? (
          <PdfThumbnail url={cert.photoURL} alt={cert.certificateName} />
        ) : (
          <img
            src={cert.photoURL}
            alt={cert.certificateName}
            className="max-w-full max-h-full object-contain scale-105"
            loading="lazy"
          />
        )}
      </div>

      <div className="px-3 py-2.5 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {status.unreported ? null : cprOnly ? (
            <StatusChip tone="cpr" label="CPR Already Used" />
          ) : (
            <>
              <StatusChip
                tone={status.usedByArrt ? 'arrtUsed' : 'arrtAvailable'}
                label={status.usedByArrt ? 'ARRT Already Used' : 'ARRT Available'}
              />
              <StatusChip
                tone={status.usedByIema ? 'iemaUsed' : 'iemaAvailable'}
                label={status.usedByIema ? 'IEMA Already Used' : 'IEMA Available'}
              />
            </>
          )}
        </div>
        <p className="text-[11px] text-[var(--ink-500)] dark:text-[var(--ink-300)] leading-tight">
          Start {formatDate(cert.completedDate)} · End {formatDate(cert.expirationDate)} · {cert.ceCredits} hr
          {cert.categoryType ? ` · Cat ${cert.categoryType}` : ''}
        </p>
      </div>
    </button>
    </div>
  );
}

function ExpiringSoonSummary({ count }: { count: number }) {
  return (
    <div
      className="nb-card px-4 py-3 flex flex-col gap-1 min-w-[12rem] shadow-none"
      style={{ boxShadow: 'none' }}
      title={`Certificates with less than ${EXPIRING_SOON_DAYS} days until expiration`}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-600)] dark:text-[var(--ink-300)]">
        Expiring soon
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums leading-none">
          {count}
        </span>
        <span className="text-xs font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">
          {count === 1 ? 'certificate' : 'certificates'}
        </span>
      </div>
      <p className="text-[10px] text-[var(--ink-500)] dark:text-[var(--ink-400)] leading-tight">
        Less than {EXPIRING_SOON_DAYS} days until expiration
      </p>
    </div>
  );
}

function UnusedPointsSummary({ arrt, iema }: { arrt: number; iema: number }) {
  const fmt = (n: number) => `${n} pt${n === 1 ? '' : 's'}`;
  return (
    <div
      className="nb-card px-4 py-3 flex flex-col gap-1 min-w-[12rem] shadow-none"
      style={{ boxShadow: 'none' }}
      title="Category A/A+ credits from non-expired certificates not yet reported to this license"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-600)] dark:text-[var(--ink-300)]">
        Unused points
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">ARRT</span>
        <span className="text-base font-bold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums">
          {fmt(arrt)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[var(--ink-900)] dark:text-[var(--ink-100)]">IEMA</span>
        <span className="text-base font-bold text-[var(--ink-900)] dark:text-[var(--ink-100)] tabular-nums">
          {fmt(iema)}
        </span>
      </div>
    </div>
  );
}

function getInt(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key);
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function Archive() {
  const { certifications, loading } = useCertifications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [photoTarget, setPhotoTarget] = useState<Certification | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 1024px)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!filterContainerRef.current?.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  const search = searchParams.get('q') ?? '';
  const statusFilter = (searchParams.get('status') as StatusFilter) || 'all';
  const categoryFilter = searchParams.get('cat') ?? 'all'; // all | ARRT | IEMA | CPR
  const typeFilter = searchParams.get('type') ?? 'all';    // all | A | A+
  const completedAfter = searchParams.get('after') ?? '';
  const completedBefore = searchParams.get('before') ?? '';
  const page = getInt(searchParams, 'page', 1);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === 'all') next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    setSearchParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certifications
      .filter((c) => {
        if (q) {
          const hit =
            c.certificateName.toLowerCase().includes(q) ||
            (c.providerName ?? '').toLowerCase().includes(q);
          if (!hit) return false;
        }
        const s = getArchiveStatus(c);
        const certIsCprOnly =
          c.categories.includes('CPR') &&
          !c.categories.includes('ARRT') &&
          !c.categories.includes('IEMA');
        const certFullyUsed =
          (certIsCprOnly && s.usedByCpr) || (!certIsCprOnly && s.usedByArrt && s.usedByIema);
        if (statusFilter === 'expired' && !s.expired) return false;
        if (statusFilter === 'used' && !certFullyUsed) return false;
        if (statusFilter === 'arrt' && !s.usedByArrt) return false;
        if (statusFilter === 'iema' && !s.usedByIema) return false;

        if (categoryFilter !== 'all' && !c.categories.includes(categoryFilter as 'ARRT' | 'IEMA' | 'CPR')) {
          return false;
        }
        if (typeFilter !== 'all') {
          const t = (c.categoryType ?? '').trim().toUpperCase();
          if (t !== typeFilter.toUpperCase()) return false;
        }
        if (completedAfter && c.completedDate < completedAfter) return false;
        if (completedBefore && c.completedDate > completedBefore) return false;
        return true;
      })
      .sort((a, b) => b.completedDate.localeCompare(a.completedDate));
  }, [certifications, search, statusFilter, categoryFilter, typeFilter, completedAfter, completedBefore]);

  const pageSize = isDesktop ? DESKTOP_PAGE_SIZE : MOBILE_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(pageStart, pageStart + pageSize);

  const activeCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (completedAfter ? 1 : 0) +
    (completedBefore ? 1 : 0);

  const unused = useMemo(
    () => unusedPointsByLicense(certifications),
    [certifications],
  );

  const expiringSoonCount = useMemo(
    () => certifications.reduce((n, c) => n + (getArchiveStatus(c).expiringSoon ? 1 : 0), 0),
    [certifications],
  );

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-3xl md:max-w-4xl lg:max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Archive', to: '' }]} />

      <div className="mt-2 mb-6 flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          icon={<ArchiveIcon size={22} />}
          title="Archive"
          subtitle="Every certificate you've uploaded"
          className=""
        />
        <div className="flex items-stretch gap-3 flex-wrap">
          <ExpiringSoonSummary count={expiringSoonCount} />
          <UnusedPointsSummary arrt={unused.arrt} iema={unused.iema} />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
        <span>{loading ? '…' : `${filtered.length} certificate${filtered.length === 1 ? '' : 's'}`}</span>
        <span className="h-px flex-1 bg-gray-200 dark:bg-slate-700" />
        <div ref={filterContainerRef} className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-label="Filter records"
            aria-expanded={filtersOpen}
            className={
              'shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors ' +
              (filtersOpen || activeCount > 0
                ? 'border-[#7C49D5] dark:border-[#A876FF] text-[#7C49D5] dark:text-[#A876FF] bg-[#7C49D5]/10 dark:bg-[#A876FF]/15'
                : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-[#7C49D5] hover:text-[#7C49D5] dark:hover:border-[#A876FF] dark:hover:text-[#A876FF]')
            }
          >
            <FilterIcon size={14} />
            Filter
            {activeCount > 0 && (
              <span className="ml-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-[#7C49D5] dark:bg-[#A876FF] text-white text-[10px] tabular-nums leading-none">
                {activeCount}
              </span>
            )}
          </button>

          {filtersOpen && (
            <div
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2.5rem))] rounded-2xl border border-[var(--ink-200)] dark:border-[var(--ink-700)] bg-white/80 dark:bg-[#14111F]/80 backdrop-blur-md shadow-xl p-4"
              role="dialog"
              aria-label="Filter options"
            >
              <div className="grid grid-cols-1 gap-3">
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={statusFilter}
                    onChange={(e) => setParam('status', e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="expired">Expired</option>
                    <option value="used">Used</option>
                    <option value="arrt">Used by ARRT</option>
                    <option value="iema">Used by IEMA</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-field">
                    <label className="form-label">Category</label>
                    <select
                      className="form-input"
                      value={categoryFilter}
                      onChange={(e) => setParam('cat', e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="ARRT">ARRT</option>
                      <option value="IEMA">IEMA</option>
                      <option value="CPR">CPR</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Type</label>
                    <select
                      className="form-input"
                      value={typeFilter}
                      onChange={(e) => setParam('type', e.target.value)}
                    >
                      <option value="all">Any</option>
                      <option value="A">A</option>
                      <option value="A+">A+</option>
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Completed after</label>
                  <input
                    type="date"
                    className="form-input"
                    value={completedAfter}
                    onChange={(e) => setParam('after', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Completed before</label>
                  <input
                    type="date"
                    className="form-input"
                    value={completedBefore}
                    onChange={(e) => setParam('before', e.target.value)}
                  />
                </div>
              </div>
              {activeCount > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-[#7C49D5] dark:hover:text-[#A876FF] transition-colors inline-flex items-center gap-1"
                  >
                    <XIcon size={12} /> Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-5 relative w-full max-w-xs">
        <span className="absolute inset-y-0 left-3 flex items-center text-[var(--ink-500)] dark:text-[var(--ink-400)] pointer-events-none">
          <SearchIcon size={16} />
        </span>
        <input
          type="text"
          className="form-input w-full"
          style={{ paddingLeft: '2.25rem', paddingRight: search ? '2rem' : '0.875rem' }}
          placeholder="Search certificate or provider name…"
          value={search}
          onChange={(e) => setParam('q', e.target.value)}
          aria-label="Search certificates"
        />
        {search && (
          <button
            type="button"
            onClick={() => setParam('q', '')}
            aria-label="Clear search"
            className="absolute inset-y-0 right-2 flex items-center text-[var(--ink-400)] hover:text-[var(--ink-700)] dark:hover:text-[var(--ink-100)] transition-colors"
          >
            <XIcon size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 text-center py-12">
          Loading…
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400 text-center py-12">
          {certifications.length === 0
            ? 'No certificates yet. Add one via the + button.'
            : 'No certificates match these filters.'}
        </p>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageItems.map((c) => (
              <ArchiveCard key={c.id} cert={c} onOpen={setPhotoTarget} />
            ))}
          </section>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-8 flex items-center justify-center gap-2"
            >
              <button
                type="button"
                onClick={() => setParam('page', String(Math.max(1, safePage - 1)))}
                disabled={safePage <= 1}
                className="w-9 h-9 grid place-items-center rounded-full border border-[var(--ink-200)] dark:border-[var(--ink-700)] text-[var(--ink-600)] dark:text-[var(--ink-300)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brand-50)] dark:hover:bg-[rgba(91,63,228,0.15)] transition-colors"
                aria-label="Previous page"
              >
                <ChevronRightIcon size={16} className="rotate-180" />
              </button>
              <span className="text-xs font-semibold text-[var(--ink-600)] dark:text-[var(--ink-300)] tabular-nums px-2">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setParam('page', String(Math.min(totalPages, safePage + 1)))}
                disabled={safePage >= totalPages}
                className="w-9 h-9 grid place-items-center rounded-full border border-[var(--ink-200)] dark:border-[var(--ink-700)] text-[var(--ink-600)] dark:text-[var(--ink-300)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brand-50)] dark:hover:bg-[rgba(91,63,228,0.15)] transition-colors"
                aria-label="Next page"
              >
                <ChevronRightIcon size={16} />
              </button>
            </nav>
          )}
        </>
      )}

      {photoTarget && (
        <PhotoOverlay cert={photoTarget} onClose={() => setPhotoTarget(null)} />
      )}
    </main>
  );
}

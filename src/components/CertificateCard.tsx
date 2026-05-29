import { useEffect, useRef, useState } from 'react';
import type { Certification } from '../types/certification';
import type { AppUser } from '../types/auth';
import { CertificateIcon } from '../services/svgIcons';
import { CertImagePlaceholder } from './CertImagePlaceholder';
import {
  getArchiveStatus,
  getLicenseUsage,
  isFullyUsed,
  type LicenseUsage,
  type LifecycleStatus,
} from '../services/archiveLogic';
import { renderPdfThumbnailFromUrl } from '../services/pdfRender';

export const formatCertDate = (iso: string): string =>
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

type ChipTone = 'spent' | 'inUse' | 'available' | 'cpr';

function StatusChip({ tone, label }: { tone: ChipTone; label: string }) {
  const cls = 'bg-gray-200 text-[var(--ink-700)] dark:bg-secondary/30 dark:text-[var(--ink-100)]';
  const dotCls =
    tone === 'spent' || tone === 'cpr'
      ? 'bg-red-500'
      : tone === 'inUse'
        ? 'bg-amber-500'
        : 'bg-emerald-500';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      <span className={`mr-1.5 size-1.5 rounded-full ${dotCls}`} aria-hidden="true" />
      {label}
    </span>
  );
}

const LICENSE_LABELS: Record<LicenseUsage, (license: 'ARRT' | 'IEMA') => string> = {
  available: (l) => `${l} Available`,
  inUse: (l) => `${l} In Use`,
  spent: (l) => `${l} Used`,
};

const USAGE_TONE: Record<LicenseUsage, ChipTone> = {
  available: 'available',
  inUse: 'inUse',
  spent: 'spent',
};

const LIFECYCLE_LABEL: Record<LifecycleStatus, string> = {
  active: 'Active',
  expiringSoon: 'Expiring Soon',
  expired: 'Expired',
};

function LifecycleLabel({
  status,
  used = false,
  usedLabel = 'Used',
}: {
  status: LifecycleStatus;
  used?: boolean;
  usedLabel?: string;
}) {
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
      {used ? usedLabel : LIFECYCLE_LABEL[status]}
    </span>
  );
}

export function CertificateCard({
  cert,
  onOpen,
  usedLabel,
  appUser,
}: {
  cert: Certification;
  onOpen: (cert: Certification) => void;
  usedLabel?: string;
  appUser?: AppUser;
}) {
  const status = getArchiveStatus(cert);
  const cprOnly =
    cert.categories.includes('CPR') &&
    !cert.categories.includes('ARRT') &&
    !cert.categories.includes('IEMA');
  const fullyUsed = isFullyUsed(cert);
  const arrtUsage: LicenseUsage = appUser
    ? getLicenseUsage(cert, 'ARRT', appUser)
    : status.usedByArrt
      ? 'spent'
      : 'available';
  const iemaUsage: LicenseUsage = appUser
    ? getLicenseUsage(cert, 'IEMA', appUser)
    : status.usedByIema
      ? 'spent'
      : 'available';
  const isPdf = isPdfPath(cert.photoStoragePath);
  const expiryTooltip = status.expired
    ? `Expired ${formatCertDate(cert.expirationDate)}`
    : `Expires ${formatCertDate(cert.expirationDate)}`;

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
            <LifecycleLabel status={status.lifecycle} used={fullyUsed} usedLabel={usedLabel} />
          </span>
        </div>

        <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden">
          {!cert.photoURL ? (
            <CertImagePlaceholder />
          ) : isPdf ? (
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
            {cprOnly ? (
              <StatusChip tone="cpr" label="CPR Used" />
            ) : (
              <>
                <StatusChip
                  tone={USAGE_TONE[arrtUsage]}
                  label={LICENSE_LABELS[arrtUsage]('ARRT')}
                />
                <StatusChip
                  tone={USAGE_TONE[iemaUsage]}
                  label={LICENSE_LABELS[iemaUsage]('IEMA')}
                />
              </>
            )}
          </div>
          <p className="text-[11px] text-[var(--ink-500)] dark:text-[var(--ink-300)] leading-tight">
            Start {formatCertDate(cert.completedDate)} · End {formatCertDate(cert.expirationDate)} · {cert.ceCredits} hr
            {cert.categoryType ? ` · Cat ${cert.categoryType}` : ''}
          </p>
        </div>
      </button>
    </div>
  );
}

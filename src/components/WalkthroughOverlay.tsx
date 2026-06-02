import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { WalkthroughContext } from './walkthroughContext';
import { useMobileMenu } from './mobileMenuContext';
import {
  BellIcon,
  IdCardIcon,
  LayoutGridIcon,
  PlusIcon,
  RotateCwIcon,
  TeamIcon,
} from '../services/svgIcons';

const STORAGE_PREFIX = 'xray-tech:walkthrough-seen';

const seenKey = (uid: string) => `${STORAGE_PREFIX}:${uid}`;

const hasSeenWalkthrough = (uid: string): boolean => {
  try {
    return localStorage.getItem(seenKey(uid)) === '1';
  } catch {
    return false;
  }
};

const markWalkthroughSeen = (uid: string): void => {
  try {
    localStorage.setItem(seenKey(uid), '1');
  } catch {
    /* private mode / quota */
  }
};

interface Step {
  icon: ReactElement;
  title: string;
  body: ReactElement;
  /** When set, the matching `[data-walkthrough-id]` element is spotlighted. */
  targetId?: string;
  /** When set, navigate to this route as the step opens. */
  targetRoute?: string;
}

const STEPS: Step[] = [
  {
    icon: <IdCardIcon size={28} />,
    title: 'Welcome to X-Ray Tech',
    body: (
      <p>
        This is your home for tracking ARRT and IEMA continuing education. The next few screens
        will walk you through each page — feel free to skip and come back later from{' '}
        <strong>System Settings</strong>.
      </p>
    ),
  },
  {
    icon: <LayoutGridIcon size={28} />,
    title: 'Compliance overview',
    body: (
      <p>
        Your home page. See your CE credit total against the 48-credit requirement and the
        countdown to your next renewal. Green means on track; yellow and red flag what needs
        attention first.
      </p>
    ),
    targetId: 'dashboard',
    targetRoute: '/',
  },
  {
    icon: <PlusIcon size={28} />,
    title: 'Add a certificate',
    body: (
      <p>
        Upload a PDF or photo of your CE certificate here. We read the title, date, and credit
        count automatically — you just confirm and save.
      </p>
    ),
    targetId: 'add-cert',
    targetRoute: '/certificates/new',
  },
  {
    icon: <RotateCwIcon size={28} />,
    title: 'License cycles',
    body: (
      <p>
        ARRT cycles run from your birth month for two years; IEMA cycles run from your
        accreditation month. This page shows where you stand in each one.
      </p>
    ),
    targetId: 'cycles',
    targetRoute: '/cycles',
  },
  {
    icon: <TeamIcon size={28} />,
    title: 'Your team',
    body: (
      <p>
        Join a team with a 7-character code from your manager, or create one if you're leading.
        Managers can see who's compliant at a glance from here.
      </p>
    ),
    targetId: 'team',
    targetRoute: '/team',
  },
  {
    icon: <BellIcon size={28} />,
    title: 'System settings',
    body: (
      <p>
        Turn on desktop notifications, change the theme, or replay this walkthrough any time
        from here. We notify ~60 days before each certificate expires.
      </p>
    ),
    targetId: 'settings',
    targetRoute: '/settings',
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const findVisibleTargetEl = (targetId: string | undefined): HTMLElement | null => {
  if (!targetId) return null;
  const all = document.querySelectorAll<HTMLElement>(`[data-walkthrough-id="${targetId}"]`);
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
};

const readTargetRect = (targetId: string | undefined): TargetRect | null => {
  const el = findVisibleTargetEl(targetId);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
};

const useTargetRect = (targetId: string | undefined): TargetRect | null => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!targetId) return;
    const bump = () => setTick((t) => t + 1);
    const el = findVisibleTargetEl(targetId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.addEventListener('resize', bump);
    window.addEventListener('scroll', bump, true);
    const raf = requestAnimationFrame(bump);
    const timers = [120, 280, 600, 1000].map((ms) => window.setTimeout(bump, ms));
    return () => {
      window.removeEventListener('resize', bump);
      window.removeEventListener('scroll', bump, true);
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [targetId]);

  // Recompute synchronously on each render so the popup never appears at a stale
  // (previous-step) position. `tick` increments cause re-evaluation on
  // resize/scroll/delayed-retry without an extra setState round-trip.
  return useMemo(() => readTargetRect(targetId), [targetId, tick]);
};

type DockSide = 'right' | 'left' | 'top' | 'bottom';

interface DockPlacement {
  side: DockSide;
  top: number;
  left: number;
  /** Pixel offset of the arrow tip from the panel's top (for right/left dock). */
  arrowOffsetTop?: number;
  /** Pixel offset of the arrow tip from the panel's left (for top/bottom dock). */
  arrowOffsetLeft?: number;
}

function pickDock(
  rect: TargetRect,
  panelW: number,
  panelHEstimate: number,
  gap: number,
  pad: number,
): DockPlacement | null {
  if (typeof window === 'undefined') return null;
  const W = window.innerWidth;
  const H = window.innerHeight;

  const rectRight = rect.left + rect.width;
  const rectBottom = rect.top + rect.height;
  const spaceRight = W - rectRight;
  const spaceLeft = rect.left;
  const spaceAbove = rect.top;
  const spaceBelow = H - rectBottom;

  const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

  const targetCenterY = rect.top + rect.height / 2;
  const targetCenterX = rect.left + rect.width / 2;

  if (spaceRight >= panelW + gap + pad) {
    const top = clamp(rect.top, pad, H - panelHEstimate - pad);
    const left = rectRight + gap;
    return { side: 'right', top, left, arrowOffsetTop: targetCenterY - top };
  }
  if (spaceLeft >= panelW + gap + pad) {
    const top = clamp(rect.top, pad, H - panelHEstimate - pad);
    const left = rect.left - panelW - gap;
    return { side: 'left', top, left, arrowOffsetTop: targetCenterY - top };
  }
  if (spaceAbove >= panelHEstimate + gap + pad) {
    const top = rect.top - panelHEstimate - gap;
    const left = clamp(rect.left, pad, W - panelW - pad);
    return { side: 'top', top, left, arrowOffsetLeft: targetCenterX - left };
  }
  if (spaceBelow >= panelHEstimate + gap + pad) {
    const top = rectBottom + gap;
    const left = clamp(rect.left, pad, W - panelW - pad);
    return { side: 'bottom', top, left, arrowOffsetLeft: targetCenterX - left };
  }
  return null;
}

interface WalkthroughOverlayProps {
  onClose: () => void;
}

const PANEL_WIDTH = 320;
const PANEL_HEIGHT_ESTIMATE = 300;
const PANEL_GAP = 16;
const VIEWPORT_PADDING = 12;

/** Target ids that, on mobile (no desktop sidebar), only exist inside the hamburger menu. */
const MOBILE_MENU_ONLY_TARGETS = new Set(['team', 'settings']);

const WalkthroughOverlay = ({ onClose }: WalkthroughOverlayProps) => {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const { isOpen: mobileMenuOpen, setOpen: setMobileMenuOpen } = useMobileMenu();
  const step = STEPS[stepIndex];

  useEffect(() => {
    if (step.targetRoute) navigate(step.targetRoute);
  }, [step.targetRoute, navigate]);

  // Decide whether the hamburger menu needs to be open for this step.
  useEffect(() => {
    if (!step.targetId) {
      if (mobileMenuOpen) setMobileMenuOpen(false);
      return;
    }
    const tryDecide = () => {
      const el = findVisibleTargetEl(step.targetId);
      const isMobile =
        typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches;
      if (el) {
        // Already visible somewhere — close the menu if it was opened for a previous step.
        if (mobileMenuOpen && !MOBILE_MENU_ONLY_TARGETS.has(step.targetId!)) {
          setMobileMenuOpen(false);
        }
        return;
      }
      if (isMobile && step.targetId && MOBILE_MENU_ONLY_TARGETS.has(step.targetId)) {
        setMobileMenuOpen(true);
      }
    };
    tryDecide();
    const t = window.setTimeout(tryDecide, 200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.targetId]);

  const targetRect = useTargetRect(step.targetId);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && stepIndex < STEPS.length - 1) {
        setStepIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft' && stepIndex > 0) {
        setStepIndex((i) => i - 1);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, stepIndex]);

  // Make sure the menu closes when the walkthrough itself closes.
  const handleClose = useCallback(() => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
    onClose();
  }, [mobileMenuOpen, onClose, setMobileMenuOpen]);

  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;

  const placement = targetRect
    ? pickDock(targetRect, PANEL_WIDTH, PANEL_HEIGHT_ESTIMATE, PANEL_GAP, VIEWPORT_PADDING)
    : null;
  const docked = placement !== null;

  const arrowStyle = (): React.CSSProperties | null => {
    if (!placement) return null;
    const offset = -7;
    switch (placement.side) {
      case 'right':
        return {
          left: offset,
          top: Math.max(16, Math.min((placement.arrowOffsetTop ?? 0) - 6, PANEL_HEIGHT_ESTIMATE - 24)),
          borderLeft: '1px solid',
          borderBottom: '1px solid',
        };
      case 'left':
        return {
          right: offset,
          top: Math.max(16, Math.min((placement.arrowOffsetTop ?? 0) - 6, PANEL_HEIGHT_ESTIMATE - 24)),
          borderRight: '1px solid',
          borderTop: '1px solid',
        };
      case 'top':
        return {
          bottom: offset,
          left: Math.max(16, Math.min((placement.arrowOffsetLeft ?? 0) - 6, PANEL_WIDTH - 24)),
          borderRight: '1px solid',
          borderBottom: '1px solid',
        };
      case 'bottom':
        return {
          top: offset,
          left: Math.max(16, Math.min((placement.arrowOffsetLeft ?? 0) - 6, PANEL_WIDTH - 24)),
          borderLeft: '1px solid',
          borderTop: '1px solid',
        };
    }
  };
  const arrowCss = arrowStyle();

  const panel = (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4 bg-white dark:bg-slate-800 shadow-2xl border border-gray-200 dark:border-slate-700 relative"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="walkthrough-title"
      style={{ width: PANEL_WIDTH }}
    >
      {docked && arrowCss && (
        <span
          aria-hidden="true"
          className="absolute w-3 h-3 rotate-45 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700"
          style={arrowCss}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#7C49D5]/10 dark:bg-[#A876FF]/15 text-[#7C49D5] dark:text-[#A876FF] shrink-0">
            {step.icon}
          </span>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close walkthrough"
          className="cursor-pointer shrink-0 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3
          id="walkthrough-title"
          className="text-base font-extrabold text-primary dark:text-slate-100 tracking-tight"
        >
          {step.title}
        </h3>
        <div className="text-[13px] text-gray-600 dark:text-slate-300 leading-relaxed">
          {step.body}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {STEPS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStepIndex(i)}
            aria-label={`Go to step ${i + 1}`}
            className={
              'h-1.5 rounded-full transition-all cursor-pointer ' +
              (i === stepIndex
                ? 'w-5 bg-[#7C49D5] dark:bg-[#A876FF]'
                : 'w-1.5 bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500')
            }
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={isFirst}
          className="global-btn cancel-btn w-auto px-3 py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={() => {
              navigate('/');
              handleClose();
            }}
            className="global-btn default-btn w-auto px-4 py-1.5 text-xs"
          >
            Get started
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            className="global-btn default-btn w-auto px-4 py-1.5 text-xs"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/55"
        style={{ zIndex: 55 }}
        onClick={handleClose}
      />
      {docked && placement ? (
        <div
          className="fixed"
          style={{ top: placement.top, left: placement.left, zIndex: 70 }}
        >
          {panel}
        </div>
      ) : (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: 70 }}
          onClick={handleClose}
        >
          {panel}
        </div>
      )}
    </>,
    document.body,
  );
};

interface WalkthroughProviderProps {
  uid: string;
}

export const WalkthroughProvider = ({
  uid,
  children,
}: PropsWithChildren<WalkthroughProviderProps>) => {
  const [open, setOpen] = useState(false);
  const hasAutoCheckedForUid = useRef<string | null>(null);

  useEffect(() => {
    if (hasAutoCheckedForUid.current === uid) return;
    hasAutoCheckedForUid.current = uid;
    if (!hasSeenWalkthrough(uid)) {
      setOpen(true);
    }
  }, [uid]);

  const handleClose = useCallback(() => {
    setOpen(false);
    markWalkthroughSeen(uid);
  }, [uid]);

  const openWalkthrough = useCallback(() => setOpen(true), []);

  return (
    <WalkthroughContext.Provider value={{ open: openWalkthrough }}>
      {children}
      {open && <WalkthroughOverlay onClose={handleClose} />}
    </WalkthroughContext.Provider>
  );
};

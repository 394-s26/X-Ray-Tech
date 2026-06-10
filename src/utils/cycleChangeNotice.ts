// One-shot, cross-page notice that a profile edit shifted the user's cycle grid.
//
// ProfilePage writes it after a cycle-affecting save; CyclesPage peeks it for the
// initial banner state and clears it on mount so the banner shows exactly once.
// sessionStorage (per-tab, cleared on tab close) is the right scope: the banner is
// a transient "heads up," not state to persist. All access is wrapped so a
// disabled/throwing storage never breaks a save or a page load.

export const CYCLES_CHANGED_NOTICE_KEY = 'cyclesChangedNotice';

export interface CyclesChangedNotice {
  /** How many certificates were re-pointed onto the corrected cycle grid. */
  realigned: number;
}

export function writeCyclesChangedNotice(notice: CyclesChangedNotice): void {
  try {
    sessionStorage.setItem(CYCLES_CHANGED_NOTICE_KEY, JSON.stringify(notice));
  } catch {
    /* storage unavailable (private mode / quota) — the banner is non-critical */
  }
}

/** Reads the notice without consuming it. Safe to call during render. */
export function peekCyclesChangedNotice(): CyclesChangedNotice | null {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(CYCLES_CHANGED_NOTICE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CyclesChangedNotice>;
    return { realigned: typeof parsed.realigned === 'number' ? parsed.realigned : 0 };
  } catch {
    return { realigned: 0 };
  }
}

/** Consumes the notice so it won't show again. */
export function clearCyclesChangedNotice(): void {
  try {
    sessionStorage.removeItem(CYCLES_CHANGED_NOTICE_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
}

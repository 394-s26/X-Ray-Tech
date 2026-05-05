const pad2 = (n: number) => String(n).padStart(2, '0');

export const toMinutes = (hhmm: string): number | null => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]), mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) return null;
  return h * 60 + mm;
};

export const fromMinutes = (total: number): string =>
  `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;

export const currentTimeRounded = (stepMinutes = 15): string => {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(totalMinutes / stepMinutes) * stepMinutes;
  return fromMinutes(rounded % (24 * 60));
};

export const parseTime = (raw: string): number | null => {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;

  let ampm: 'am' | 'pm' | null = null;
  let body = s;
  if (s.endsWith('am') || s.endsWith('a')) { ampm = 'am'; body = s.replace(/a(m)?$/, ''); }
  else if (s.endsWith('pm') || s.endsWith('p')) { ampm = 'pm'; body = s.replace(/p(m)?$/, ''); }

  let h = NaN, m = 0;
  if (body.includes(':')) {
    [h, m] = body.split(':').map(Number);
  } else if (/^\d+$/.test(body)) {
    if (body.length <= 2) { h = Number(body); }
    else if (body.length === 3) { h = Number(body[0]); m = Number(body.slice(1)); }
    else { h = Number(body.slice(0, 2)); m = Number(body.slice(2)); }
  }

  if (!Number.isFinite(h) || !Number.isFinite(m) || m < 0 || m > 59) return null;

  if (ampm) {
    if (h < 1 || h > 12) return null;
    if (ampm === 'pm' && h !== 12) h += 12;
    if (ampm === 'am' && h === 12) h = 0;
  } else {
    if (h < 0 || h > 23) return null;
  }

  return h * 60 + m;
};

export const snapToNearest = (minutes: number, stepMinutes = 15): number => {
  const snapped = Math.round(minutes / stepMinutes) * stepMinutes;
  return snapped % (24 * 60);
};

export const formatTime12h = (hhmm: string): string => {
  const total = toMinutes(hhmm);
  if (total == null) return '';
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h24 >= 12 ? 'pm' : 'am';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(m)} ${ampm}`;
};

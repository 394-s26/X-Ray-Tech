export interface ParsedCertificate {
  providerName: string | null;
  completedDate: string | null;
  expirationDate: string | null;
  ceCredits: number | null;
  examName: string | null;
  categoryType: string | null;
}

export interface ParsedScantron {
  examName: string | null;
  examDate: string | null;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const KNOWN_PROVIDERS = [
  'ARRT',
  'ASRT',
  'NMTCB',
  'CAMRT',
  'ACR',
  'AAPM',
  'AHA',
  'ARDMS',
  'CCI',
  'NBRC',
  'AHRA',
  'American Heart Association',
  'American Red Cross',
];

const monthNamesAlt = Object.keys(MONTHS).join('|');

const pad = (n: number) => String(n).padStart(2, '0');

const isValidIso = (y: number, m: number, d: number): string | null => {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < 1950 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
};

const parseDateNear = (text: string): string | null => {
  const isoMatch = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const iso = isValidIso(+isoMatch[1], +isoMatch[2], +isoMatch[3]);
    if (iso) return iso;
  }

  const monthDayYear = text.match(
    new RegExp(`\\b(${monthNamesAlt})\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, 'i'),
  );
  if (monthDayYear) {
    const month = MONTHS[monthDayYear[1].toLowerCase()];
    const iso = isValidIso(+monthDayYear[3], month, +monthDayYear[2]);
    if (iso) return iso;
  }

  const dayMonthYear = text.match(
    new RegExp(`\\b(\\d{1,2})\\s+(${monthNamesAlt})\\.?,?\\s+(\\d{4})\\b`, 'i'),
  );
  if (dayMonthYear) {
    const month = MONTHS[dayMonthYear[2].toLowerCase()];
    const iso = isValidIso(+dayMonthYear[3], month, +dayMonthYear[1]);
    if (iso) return iso;
  }

  const usSlash = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (usSlash) {
    let year = +usSlash[3];
    if (year < 100) year += 2000;
    const iso = isValidIso(year, +usSlash[1], +usSlash[2]);
    if (iso) return iso;
  }

  // MM/YYYY or MM-YYYY (e.g. CPR "Renew By: 01/2028") — default to 1st of month
  const monthYear = text.match(/\b(\d{1,2})[/-](\d{4})\b/);
  if (monthYear) {
    const iso = isValidIso(+monthYear[2], +monthYear[1], 1);
    if (iso) return iso;
  }

  return null;
};

const isPlausibleProviderLine = (line: string): boolean => {
  if (!line || line.length < 3 || line.length > 120) return false;
  if (/\d{3,}/.test(line)) return false;
  return true;
};

const cleanProviderText = (raw: string): string => {
  return raw
    .replace(/[^\w&,.()\-' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
};

export const extractProvider = (text: string): string | null => {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  for (const line of lines) {
    const m = line.match(/^(?:issued by|provider|granted by|awarded by|sponsor)[:\s]+(.+)/i);
    if (m && isPlausibleProviderLine(m[1])) {
      return cleanProviderText(m[1]);
    }
  }

  for (const known of KNOWN_PROVIDERS) {
    const re = new RegExp(`\\b${known}\\b`, 'i');
    const line = lines.find(l => re.test(l));
    if (line) return cleanProviderText(line);
  }

  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      isPlausibleProviderLine(line) &&
      /[a-z]/.test(line) &&
      /[A-Z]/.test(line) &&
      !/certificate|completion|hereby|presented|awarded/i.test(line)
    ) {
      return cleanProviderText(line);
    }
  }

  return null;
};

const findDateAfterKeyword = (text: string, keywordRe: RegExp): string | null => {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!keywordRe.test(lines[i])) continue;
    // Check the keyword line itself first
    const onSameLine = parseDateNear(lines[i]);
    if (onSameLine) return onSameLine;
    // Scan up to 3 subsequent lines, skipping blanks, to handle OCR-inserted gaps
    let ahead = 0;
    for (let j = i + 1; j < lines.length && ahead < 3; j++) {
      const trimmed = lines[j].trim();
      if (!trimmed) continue;
      ahead++;
      const found = parseDateNear(trimmed);
      if (found) return found;
    }
  }
  return null;
};

export const extractCompletedDate = (text: string): string | null => {
  const dateAfter = findDateAfterKeyword(
    text,
    /(?:completed|completion|date of completion|issued?(?:\s+date)?|granted on|awarded on|earned)/i,
  );
  if (dateAfter) return dateAfter;
  return parseDateNear(text);
};

export const extractExpirationDate = (text: string): string | null => {
  return findDateAfterKeyword(
    text,
    /(?:expir|valid until|valid through|good through|renewal due|renew(?:\s*by)?|renewal)/i,
  );
};

export const extractCeCredits = (text: string): number | null => {
  const patterns = [
    /([\d.]+)\s*(?:ce\s*credits?|c\.?e\.?u\.?s?|continuing\s*education\s*(?:credits?|points?|hours?|units?)|category\s*(?:[a1]|one))/i,
    /(?:credits?|hours?|ceus?|units?)[:\s]+([\d.]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n) && n > 0 && n <= 200) return n;
    }
  }
  return null;
};

// Matches "BLS Provider", "ACLS Instructor", "PALS Renewal", etc.
const CPR_CARD_RE = /\b((?:BLS|ACLS|PALS|NRP|HEARTSAVER|CPR(?:\s*(?:and|&|\/)\s*AED)?)\s+(?:Provider|Instructor|Renewal|Certification))\b/i;
// Matches a standalone CPR program type on its own line
const CPR_TYPE_RE = /\b(BLS|ACLS|PALS|NRP|HEARTSAVER|Basic\s+Life\s+Support|Advanced\s+Cardiac\s+Life\s+Support|Pediatric\s+Advanced\s+Life\s+Support)\b/i;

export const extractExamName = (text: string): string | null => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Check first 8 lines for a specific CPR card type ("BLS Provider", etc.)
  for (const line of lines.slice(0, 8)) {
    const m = line.match(CPR_CARD_RE);
    if (m) return m[1].trim().slice(0, 100);
  }

  // Fall back to a CPR program type keyword anywhere in the first 8 lines
  for (const line of lines.slice(0, 8)) {
    if (CPR_TYPE_RE.test(line)) return line.slice(0, 100);
  }

  // Generic keyword-based extraction for non-CPR certificates
  const m = text.match(/(?:exam|course|subject|certification|training|module|category)[:.\s]+(.+)/i);
  if (m) {
    const cleaned = m[1].split(/[\n.]/)[0].trim().slice(0, 100);
    if (cleaned.length >= 3) return cleaned;
  }

  return null;
};

export const extractCategoryType = (text: string): string | null => {
  // Matches "Category A+", "Category A", "Category 1", "Cat. A+", etc.
  const m = text.match(/\bcat(?:egory)?\.?\s+([A-Z][+]?|\d+)\b/i);
  if (m) return m[1].toUpperCase();
  return null;
};

export const parseCertificateText = (text: string): ParsedCertificate => {
  return {
    providerName: extractProvider(text),
    completedDate: extractCompletedDate(text),
    expirationDate: extractExpirationDate(text),
    ceCredits: extractCeCredits(text),
    examName: extractExamName(text),
    categoryType: extractCategoryType(text),
  };
};

export const parseScantronText = (text: string): ParsedScantron => {
  return {
    examName: extractExamName(text),
    examDate: extractCompletedDate(text),
  };
};

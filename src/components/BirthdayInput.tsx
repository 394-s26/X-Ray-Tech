import { useState } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const daysInMonth = (m: number): number => {
  if (m === 2) return 29;
  if ([4, 6, 9, 11].includes(m)) return 30;
  return 31;
};

const ordinal = (n: number): string => {
  const rem100 = n % 100;
  const rem10 = n % 10;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  if (rem10 === 1) return `${n}st`;
  if (rem10 === 2) return `${n}nd`;
  if (rem10 === 3) return `${n}rd`;
  return `${n}th`;
};

const formatPreview = (value: string): string | null => {
  const match = value.match(/^(\d{2})-(\d{2})$/);
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(month)) return null;
  return `${MONTH_NAMES[month - 1]} ${ordinal(day)}`;
};

interface BirthdayInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onErrorClear?: () => void;
}

export const BirthdayInput = ({ value, onChange, error, onErrorClear }: BirthdayInputProps) => {
  // Internal display state so the user sees what they typed even when the
  // propagated value is '' (incomplete or invalid dates both become '').
  const [display, setDisplay] = useState(value);

  const preview = formatPreview(display);
  const isInvalid = display.length === 5 && preview === null;

  const handleChange = (raw: string) => {
    const digitsOnly = raw.replace(/[^\d]/g, '');
    const clamped = digitsOnly.slice(0, 4);
    const formatted = clamped.length > 2
      ? `${clamped.slice(0, 2)}-${clamped.slice(2)}`
      : clamped;
    setDisplay(formatted);
    const isValid = formatted.length === 5 && formatPreview(formatted) !== null;
    onChange(isValid ? formatted : '');
    if (isValid) onErrorClear?.();
  };

  return (
    <div>
      <div className="relative max-w-48">
        <input
          className={`form-input ${isInvalid ? 'is-error' : ''} ${preview ? 'pr-44' : ''}`}
          type="text"
          placeholder="MM-DD"
          value={display}
          maxLength={5}
          onChange={e => handleChange(e.target.value)}
        />
        {preview && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm italic text-slate-400 dark:text-slate-500 pointer-events-none select-none whitespace-nowrap">
            {preview}
          </span>
        )}
      </div>
      <p className="setup-flow__field-error">
        {isInvalid ? 'Invalid date.' : error}
      </p>
    </div>
  );
};

export default BirthdayInput;

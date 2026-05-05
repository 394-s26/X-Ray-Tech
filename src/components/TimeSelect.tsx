import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toMinutes, fromMinutes, formatTime12h, parseTime, snapToNearest } from './timeUtils';
import { ClockIcon } from '../services/svgIcons';
import '../styles/components/TimeSelect.css';

const STEP_MINUTES = 15;

interface TimeSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const options: { hhmm: string; minutes: number }[] = Array.from(
  { length: (24 * 60) / STEP_MINUTES },
  (_, i) => ({ hhmm: fromMinutes(i * STEP_MINUTES), minutes: i * STEP_MINUTES })
);

const TimeSelect = ({ id, value, onChange, disabled, ariaLabel }: TimeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedMinutes = toMinutes(value);
  const displayText = focused ? draft : formatTime12h(value);

  function openDropdown() {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const maxH = 240;
    const spaceBelow = window.innerHeight - rect.bottom - 4;
    const spaceAbove = rect.top - 4;
    const expandUp = spaceBelow < maxH && spaceAbove > spaceBelow;
    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(expandUp
        ? { bottom: window.innerHeight - rect.top + 4, top: 'auto' }
        : { top: rect.bottom + 4, bottom: 'auto' }),
    });
    setOpen(true);
  }

  function commit(raw: string) {
    const parsed = parseTime(raw);
    if (parsed != null) {
      onChange(fromMinutes(snapToNearest(parsed, STEP_MINUTES)));
    }
  }

  function handleChevronMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    if (open) {
      setOpen(false);
    } else {
      inputRef.current?.focus();
      openDropdown();
    }
  }

  useLayoutEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current
      .querySelector<HTMLButtonElement>('.time-select-option--selected')
      ?.scrollIntoView({ block: 'center' });

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapRef.current && !wrapRef.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="time-select" ref={wrapRef}>
      <div className="form-select flex items-center gap-2">
        <ClockIcon size={15} className="text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          aria-label={ariaLabel}
          autoComplete="off"
          className="flex-1 outline-none bg-transparent text-sm text-gray-800 min-w-0"
          value={displayText}
          onFocus={(e) => { setFocused(true); setDraft(formatTime12h(value)); openDropdown(); e.target.select(); }}
          onBlur={(e) => { commit(e.target.value); setFocused(false); setOpen(false); }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { commit(draft); setFocused(false); setOpen(false); (e.target as HTMLInputElement).blur(); }
            else if (e.key === 'Escape') { setFocused(false); setOpen(false); (e.target as HTMLInputElement).blur(); }
          }}
        />
        <svg
          className={`size-3 text-gray-400 transition-transform duration-150 flex-shrink-0 cursor-pointer ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 12 12" fill="currentColor"
          onMouseDown={handleChevronMouseDown}
        >
          <path d="M6 8L1 3h10z" />
        </svg>
      </div>

      {open && createPortal(
        <div className="time-select-options" role="listbox" ref={listRef} style={dropdownStyle}>
          {options.map(opt => (
            <button
              key={opt.hhmm}
              type="button"
              role="option"
              aria-selected={opt.minutes === selectedMinutes}
              className={`time-select-option${opt.minutes === selectedMinutes ? ' time-select-option--selected' : ''}`}
              onMouseDown={() => { onChange(opt.hhmm); setFocused(false); setOpen(false); }}
            >
              <span className="time-select-option-label">{formatTime12h(opt.hhmm)}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default TimeSelect;

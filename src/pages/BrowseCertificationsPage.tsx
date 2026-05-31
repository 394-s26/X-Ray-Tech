import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { GraduationCapIcon, ArrowRightIcon, FilterIcon } from '../services/svgIcons';
import arrtLogo from '../assets/arrt.png';
import iemaLogo from '../assets/iema.png';

type Agency = 'ARRT' | 'IEMA' | 'CPR';

interface Certification {
  id: string;
  title: string;
  description: string;
  agency: Agency;
  credits: number;
  approvalEnds: string;
  link: string;
}

const AGENCY_COLORS: Record<Agency, string> = {
  ARRT: '#1A4975',
  IEMA: '#0EA37E',
  CPR:  '#DC2626',
};

const AGENCY_LOGOS: Partial<Record<Agency, string>> = {
  ARRT: arrtLogo,
  IEMA: iemaLogo,
};

const AGENCIES: Agency[] = ['ARRT', 'IEMA', 'CPR'];


interface DualRangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
}

function DualRangeSlider({ min, max, low, high, onLowChange, onHighChange }: DualRangeSliderProps) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const track = `linear-gradient(to right, #e5e7eb ${pct(low)}%, #7C49D5 ${pct(low)}%, #7C49D5 ${pct(high)}%, #e5e7eb ${pct(high)}%)`;
  const thumbStyle = `
    [&::-webkit-slider-thumb]:appearance-none
    [&::-webkit-slider-thumb]:w-4
    [&::-webkit-slider-thumb]:h-4
    [&::-webkit-slider-thumb]:rounded-full
    [&::-webkit-slider-thumb]:bg-white
    [&::-webkit-slider-thumb]:border-2
    [&::-webkit-slider-thumb]:border-[#7C49D5]
    [&::-webkit-slider-thumb]:cursor-pointer
    [&::-webkit-slider-thumb]:shadow-sm
    [&::-moz-range-thumb]:w-4
    [&::-moz-range-thumb]:h-4
    [&::-moz-range-thumb]:rounded-full
    [&::-moz-range-thumb]:bg-white
    [&::-moz-range-thumb]:border-2
    [&::-moz-range-thumb]:border-[#7C49D5]
    [&::-moz-range-thumb]:cursor-pointer
  `;
  return (
    <div className="relative h-6 flex items-center">
      <div
        className="absolute inset-x-0 h-1.5 rounded-full"
        style={{ background: track }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={low}
        onChange={(e) => onLowChange(Math.min(Number(e.target.value), high))}
        className={`absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto ${thumbStyle}`}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={high}
        onChange={(e) => onHighChange(Math.max(Number(e.target.value), low))}
        className={`absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto ${thumbStyle}`}
      />
    </div>
  );
}

export function BrowseCertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedAgencies, setSelectedAgencies] = useState<Set<Agency>>(new Set());
  const [nameSearch, setNameSearch] = useState('');
  const [minCredits, setMinCredits] = useState(0);
  const [maxCreditsFilter, setMaxCreditsFilter] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    getDocs(collection(db, 'certification_courses')).then((snap) => {
      const docs: Certification[] = snap.docs.map((doc) => {
        const d = doc.data();
        const firstLicense = ((d.licenses as string[])?.[0] ?? 'arrt').toUpperCase() as Agency;
        return {
          id: doc.id,
          title: d.title ?? '',
          description: d.description ?? '',
          agency: firstLicense,
          credits: parseFloat(d.num_credits ?? '0'),
          approvalEnds: d.expiration ?? '',
          link: d.link ?? '',
        };
      });
      const max = Math.max(...docs.map((c) => c.credits), 1);
      setCertifications(docs);
      setMaxCreditsFilter(max);
      setLoading(false);
    });
  }, []);

  const maxCredits = useMemo(
    () => Math.max(...certifications.map((c) => c.credits), 1),
    [certifications],
  );

  const toggleAgency = (agency: Agency) => {
    setSelectedAgencies((prev) => {
      const next = new Set(prev);
      if (next.has(agency)) next.delete(agency); else next.add(agency);
      return next;
    });
  };

  const activeFilterCount =
    (selectedAgencies.size > 0 ? 1 : 0) +
    (nameSearch.trim() ? 1 : 0) +
    (minCredits > 0 || maxCreditsFilter < maxCredits ? 1 : 0);

  const clearFilters = () => {
    setSelectedAgencies(new Set());
    setNameSearch('');
    setMinCredits(0);
    setMaxCreditsFilter(maxCredits);
    setPage(1);
  };

  const visible = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    return certifications.filter((c) => {
      if (selectedAgencies.size > 0 && !selectedAgencies.has(c.agency)) return false;
      if (q && !c.title.toLowerCase().includes(q)) return false;
      if (c.credits < minCredits || c.credits > maxCreditsFilter) return false;
      return true;
    });
  }, [selectedAgencies, nameSearch, minCredits, maxCreditsFilter, certifications]);

  const PAGE_SIZE = 6;
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Browse Certifications', to: '/browse' }]} />
      <PageHeader
        icon={<GraduationCapIcon size={22} />}
        title="Browse Certifications"
        subtitle="Discover new certifications to complete and earn more points"
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
        <button
          type="button"
          onClick={() => setFilterOpen((o) => !o)}
          aria-label="Filter certifications"
          aria-expanded={filterOpen}
          className={
            'sm:ml-auto w-full sm:w-auto cursor-pointer flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-colors ' +
            (filterOpen || activeFilterCount > 0
              ? 'border-[#7C49D5] dark:border-[#A876FF] text-[#7C49D5] dark:text-[#A876FF] bg-[#7C49D5]/10 dark:bg-[#A876FF]/15'
              : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:border-[#7C49D5] hover:text-[#7C49D5] dark:hover:border-[#A876FF] dark:hover:text-[#A876FF]')
          }
        >
          <FilterIcon size={14} />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 rounded-full bg-[#7C49D5] dark:bg-[#A876FF] text-white text-[10px] tabular-nums leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {filterOpen && (
        <div className="mb-6">
          <div className="rounded-2xl glass-panel p-4 w-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4">
                <div className="form-field flex-1 min-w-[160px]">
                  <label className="form-label">License type</label>
                  <div className="flex flex-wrap gap-2">
                    {AGENCIES.map((agency) => {
                      const active = selectedAgencies.has(agency);
                      return (
                        <button
                          key={agency}
                          type="button"
                          onClick={() => toggleAgency(agency)}
                          className={
                            'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ' +
                            (active
                              ? 'text-white'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600')
                          }
                          style={active ? { backgroundColor: AGENCY_COLORS[agency] } : undefined}
                        >
                          {agency}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-field flex-1 min-w-[200px]">
                  <label className="form-label">Search by name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Certification name…"
                    value={nameSearch}
                    onChange={(e) => setNameSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="form-field flex-1 min-w-[200px]">
                  <label className="form-label">
                    Credit range
                    <span className="ml-2 text-[11px] font-normal text-gray-400 dark:text-slate-500 normal-case tracking-normal">
                      {minCredits}–{maxCreditsFilter} credits
                    </span>
                  </label>
                  <DualRangeSlider
                    min={0}
                    max={maxCredits}
                    low={minCredits}
                    high={maxCreditsFilter}
                    onLowChange={(v) => setMinCredits(v)}
                    onHighChange={(v) => setMaxCreditsFilter(v)}
                  />
                </div>

              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 hover:text-[#7C49D5] dark:hover:text-[#A876FF] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <p className="text-center text-gray-400 dark:text-slate-500 py-16">Loading certifications…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && paged.map((cert) => {
          const color = AGENCY_COLORS[cert.agency];
          return (
            <a
              key={cert.id}
              href={cert.link}
              target="_blank"
              rel="noopener noreferrer"
              className="nb-card is-clickable p-5 flex flex-col gap-3 min-w-0 h-64"
            >
              <div className="flex items-center gap-3">
                {AGENCY_LOGOS[cert.agency] ? (
                  <img
                    src={AGENCY_LOGOS[cert.agency]}
                    alt={cert.agency}
                    className="w-24 object-contain shrink-0"
                  />
                ) : (
                  <span
                    className="grid place-items-center w-9 h-9 rounded-xl text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {cert.agency}
                  </span>
                )}
                <h2 className="text-base font-bold text-primary dark:text-slate-50 leading-snug">
                  {cert.title}
                </h2>
              </div>

              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed flex-1 overflow-hidden line-clamp-4">
                {cert.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
                <span className="font-semibold" style={{ color }}>
                  {cert.credits} {cert.credits === 1 ? 'credit' : 'credits'}
                </span>
                <span>Approved until {cert.approvalEnds}</span>
              </div>

              <span className="flex items-center justify-end gap-1 text-xs font-semibold underline underline-offset-2" style={{ color }}>
                Open certification
                <ArrowRightIcon size={13} />
              </span>
            </a>
          );
        })}
      </div>

      {!loading && visible.length === 0 && (
        <p className="text-center text-gray-400 dark:text-slate-500 py-16">
          No certifications found for this filter.
        </p>
      )}

      {totalPages > 1 && (() => {
        // Always 7 fixed slots: first, ellipsis-or-gap, p-1, p, p+1, ellipsis-or-gap, last
        type Slot = { kind: 'page'; n: number } | { kind: 'ellipsis' } | { kind: 'ghost' };
        let slots: Slot[];
        if (totalPages <= 7) {
          slots = Array.from({ length: totalPages }, (_, i) => ({ kind: 'page', n: i + 1 }));
        } else if (safePage <= 4) {
          // near start: 1 2 3 4 5 ··· last
          slots = [1, 2, 3, 4, 5].map((n) => ({ kind: 'page', n }) as Slot)
            .concat([{ kind: 'ellipsis' }, { kind: 'page', n: totalPages }]);
        } else if (safePage >= totalPages - 3) {
          // near end: 1 ··· last-4 last-3 last-2 last-1 last
          slots = ([{ kind: 'page', n: 1 }, { kind: 'ellipsis' }] as Slot[])
            .concat([4, 3, 2, 1, 0].map((d) => ({ kind: 'page', n: totalPages - d }) as Slot));
        } else {
          // middle: 1 ··· p-1 p p+1 ··· last
          slots = [
            { kind: 'page', n: 1 }, { kind: 'ellipsis' },
            { kind: 'page', n: safePage - 1 }, { kind: 'page', n: safePage }, { kind: 'page', n: safePage + 1 },
            { kind: 'ellipsis' }, { kind: 'page', n: totalPages },
          ];
        }

        const btnBase = 'min-w-[2rem] px-2 py-1.5 rounded-lg text-sm font-semibold border transition-colors';
        const btnIdle = 'cursor-pointer border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-[#7C49D5] hover:text-[#7C49D5] dark:hover:border-[#A876FF] dark:hover:text-[#A876FF]';
        const btnActive = 'border-[#7C49D5] dark:border-[#A876FF] bg-[#7C49D5]/10 dark:bg-[#A876FF]/15 text-[#7C49D5] dark:text-[#A876FF]';
        const btnNav = 'cursor-pointer px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-[#7C49D5] hover:text-[#7C49D5] dark:hover:border-[#A876FF] dark:hover:text-[#A876FF] disabled:opacity-30 disabled:cursor-default transition-colors';

        return (
          <div className="flex items-center justify-center gap-1 mt-8">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1} className={btnNav}>‹</button>
            {slots.map((slot, i) =>
              slot.kind === 'page' ? (
                <button key={slot.n} type="button" onClick={() => setPage(slot.n)} className={`${btnBase} ${slot.n === safePage ? btnActive : btnIdle}`}>
                  {slot.n}
                </button>
              ) : slot.kind === 'ellipsis' ? (
                <span key={`ellipsis-${i}`} className="min-w-[2rem] px-2 py-1.5 text-sm text-center text-gray-400 dark:text-slate-500 select-none">···</span>
              ) : (
                <span key={`ghost-${i}`} className="min-w-[2rem] px-2 py-1.5" aria-hidden />
              )
            )}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className={btnNav}>›</button>
          </div>
        );
      })()}

      <section className="mt-12">
        <h2 className="text-lg font-bold text-primary dark:text-slate-50 mb-4">Recommended Sources</h2>
        <div className="rounded-2xl glass-panel p-5 flex flex-col gap-2">
          {[
            { label: 'ARRT CE Finder', href: 'https://apps.arrt.org/FindCE' },
            { label: 'IEMA Accreditation', href: 'https://iemaohs.illinois.gov/accreditation.html' },
            { label: 'American Heart Association', href: 'https://www.heart.org/' },
            { label: 'Philips Learning', href: 'http://www.learn.philips.com/' },
            { label: 'ISCD', href: 'https://iscd.org/' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium text-[#7C49D5] dark:text-[#A876FF] hover:underline underline-offset-2"
            >
              <ArrowRightIcon size={13} />
              {label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

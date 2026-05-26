import { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { GraduationCapIcon, ArrowRightIcon } from '../services/svgIcons';
import certData from '../data/availableCertifications.json';

type Agency = 'ARRT' | 'IEMA' | 'CPR';
type Filter = 'All' | Agency;

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

const FILTERS: Filter[] = ['All', 'ARRT', 'IEMA', 'CPR'];

const certifications = certData as Certification[];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function BrowseCertificationsPage() {
  const [filter, setFilter] = useState<Filter>('All');

  const visible = filter === 'All'
    ? certifications
    : certifications.filter((c) => c.agency === filter);

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Browse Certifications', to: '/browse' }]} />
      <PageHeader
        icon={<GraduationCapIcon size={22} />}
        title="Browse Certifications"
        subtitle="Discover new certifications to complete and earn more points"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          const color = f !== 'All' ? AGENCY_COLORS[f] : undefined;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="cursor-pointer px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border"
              style={
                isActive && color
                  ? { backgroundColor: color, borderColor: color, color: '#fff' }
                  : isActive
                  ? { backgroundColor: '#374151', borderColor: '#374151', color: '#fff' }
                  : { backgroundColor: 'transparent', borderColor: '#D1D5DB', color: 'inherit' }
              }
            >
              {f}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((cert) => {
          const color = AGENCY_COLORS[cert.agency];
          return (
            <a
              key={cert.id}
              href={cert.link}
              target="_blank"
              rel="noopener noreferrer"
              className="nb-card is-clickable p-5 flex flex-col gap-3 min-w-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid place-items-center w-9 h-9 rounded-xl text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {cert.agency}
                </span>
                <h2 className="text-base font-bold text-primary dark:text-slate-50 leading-snug">
                  {cert.title}
                </h2>
              </div>

              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed flex-1">
                {cert.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
                <span className="font-semibold" style={{ color }}>
                  {cert.credits} {cert.credits === 1 ? 'credit' : 'credits'}
                </span>
                <span>Approved until {formatDate(cert.approvalEnds)}</span>
              </div>

              <span className="flex items-center justify-end gap-1 text-xs font-semibold underline underline-offset-2" style={{ color }}>
                Open certification
                <ArrowRightIcon size={13} />
              </span>
            </a>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-gray-400 dark:text-slate-500 py-16">
          No certifications found for this filter.
        </p>
      )}
    </main>
  );
}

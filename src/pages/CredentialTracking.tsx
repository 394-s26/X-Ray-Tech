import { Link } from 'react-router-dom';
import { ChevronRightIcon, IdCardIcon } from '../services/svgIcons';
import { ARRT_RECORDS, IEMA_RECORDS } from '../data/certs';

interface AgencySummary {
  to: string;
  name: string;
  fullName: string;
  accent: string;
  count: number;
}

const AGENCIES: ReadonlyArray<AgencySummary> = [
  {
    to: '/arrt',
    name: 'ARRT',
    fullName: 'American Registry of Radiologic Technologists',
    accent: '#1A4975',
    count: ARRT_RECORDS.length,
  },
  {
    to: '/iema',
    name: 'IEMA',
    fullName: 'Illinois Emergency Management Agency',
    accent: '#0EA37E',
    count: IEMA_RECORDS.length,
  },
];

const CredentialTracking = () => {
  return (
    <main className="min-h-[calc(100vh-6rem)] pb-16 px-5 lg:px-10 w-full max-w-5xl mx-auto">
      <header className="mt-2 mb-8 flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-secondary">
          <IdCardIcon size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-50 leading-tight">
            Credential Tracking
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Browse and manage certificates by issuing agency.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENCIES.map((agency) => (
          <Link
            key={agency.to}
            to={agency.to}
            className="card card--md card--glass group block"
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className="grid place-items-center w-10 h-10 rounded-xl text-white font-bold"
                style={{ backgroundColor: agency.accent }}
              >
                {agency.name.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold tracking-wide text-primary dark:text-slate-50">
                  {agency.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                  {agency.fullName}
                </p>
              </div>
              <ChevronRightIcon
                size={18}
                className="text-gray-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {agency.count} {agency.count === 1 ? 'record' : 'records'} tracked
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default CredentialTracking;

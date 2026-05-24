import { Link } from 'react-router-dom';
import { ChevronRightIcon, IdCardIcon } from '../services/svgIcons';
import { useCertifications } from '../hooks/useCertifications';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';

interface AgencyConfig {
  to: string;
  name: string;
  fullName: string;
  accent: string;
}

const AGENCIES: ReadonlyArray<AgencyConfig> = [
  {
    to: '/arrt',
    name: 'ARRT',
    fullName: 'American Registry of Radiologic Technologists',
    accent: '#1A4975',
  },
  {
    to: '/iema',
    name: 'IEMA',
    fullName: 'Illinois Emergency Management Agency',
    accent: '#0EA37E',
  },
  {
    to: '/cpr',
    name: 'CPR',
    fullName: 'Cardiopulmonary Resuscitation',
    accent: '#DC2626',
  },
];

const CredentialTracking = () => {
  const { certifications } = useCertifications();

  const countFor = (name: string) =>
    certifications.filter((c) => c.categories.includes(name as 'ARRT' | 'IEMA' | 'CPR')).length;

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Certification Tracking', to: '' }]} />

      <PageHeader
        icon={<IdCardIcon size={22} />}
        title="Certification Tracking"
        subtitle="Browse and manage certificates by issuing agency."
      />

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
              {countFor(agency.name)} {countFor(agency.name) === 1 ? 'record' : 'records'} tracked
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default CredentialTracking;

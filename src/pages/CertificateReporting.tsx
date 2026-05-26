import type { AppUser } from '../types/auth';
import { useCertifications } from '../hooks/useCertifications';
import { Breadcrumb } from '../components/Breadcrumb';
import { PageHeader } from '../components/PageHeader';
import { CycleManager } from '../components/CycleManager';
import { ClipboardIcon } from '../services/svgIcons';

interface CertificateReportingProps {
  appUser: AppUser;
}

export default function CertificateReporting({ appUser }: CertificateReportingProps) {
  const { certifications, loading } = useCertifications();

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-3xl md:max-w-4xl lg:max-w-6xl mx-auto">
      <Breadcrumb items={[{ name: 'Certificate Reporting', to: '' }]} />

      <PageHeader
        icon={<ClipboardIcon size={22} />}
        title="Certificate Reporting"
        subtitle="Apply your certificates to the current ARRT and IEMA cycles. Toggle a chip to count or uncount a cert."
      />

      {loading ? (
        <p className="mt-12 text-sm text-gray-500 dark:text-slate-400 text-center">
          Loading…
        </p>
      ) : (
        <CycleManager certifications={certifications} appUser={appUser} />
      )}
    </main>
  );
}

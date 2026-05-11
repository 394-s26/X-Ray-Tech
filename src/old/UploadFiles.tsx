import { useEffect, useState } from 'react';
import type { AppUser } from '../types/auth';
import type { Certificate, Scantron } from '../types/upload';
import { getStoredCounts, type StoredCounts } from '../services/storedCounts';
import { CertificateUploadCard } from '../components/CertificateUploadCard';
import { ScanTronUploadCard } from '../components/ScanTronUploadCard';
import { UploadTransparencyNotice } from '../components/UploadTransparencyNotice';
import { MatchingScantronPrompt } from '../components/MatchingScantronPrompt';
import { deleteScantrons } from '../services/scantronService';
import '../styles/pages/UploadFiles.css';

interface UploadFilesProps {
  appUser: AppUser;
}

const UploadFiles = ({ appUser }: UploadFilesProps) => {
  const [counts, setCounts] = useState<StoredCounts | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [lastSavedCert, setLastSavedCert] = useState<Certificate | null>(null);
  const [lastSavedScantron, setLastSavedScantron] = useState<Scantron | null>(null);
  const [matchingScantrons, setMatchingScantrons] = useState<Scantron[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await getStoredCounts(appUser.uid);
        if (!cancelled) setCounts(c);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Could not load stored counts.';
        setCountsError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appUser.uid]);

  const bumpCount = (kind: 'certificate' | 'scantron') => {
    setCounts(prev => {
      if (!prev) return prev;
      return {
        certificates: prev.certificates + (kind === 'certificate' ? 1 : 0),
        scantrons: prev.scantrons + (kind === 'scantron' ? 1 : 0),
      };
    });
  };

  const dropScantronsFromCount = (n: number) => {
    setCounts(prev => {
      if (!prev) return prev;
      return { ...prev, scantrons: Math.max(0, prev.scantrons - n) };
    });
  };

  const handleCertificateSaved = (cert: Certificate, matches: Scantron[]) => {
    setLastSavedCert(cert);
    if (matches.length > 0) {
      setMatchingScantrons(matches);
    }
  };

  const handleScantronSaved = (scantron: Scantron) => {
    setLastSavedScantron(scantron);
  };

  const handleConfirmDeleteMatches = async () => {
    const n = matchingScantrons.length;
    await deleteScantrons(matchingScantrons);
    dropScantronsFromCount(n);
    setMatchingScantrons([]);
  };

  const handleKeepMatches = () => {
    setMatchingScantrons([]);
  };

  return (
    <div className="upload-page">
      <header className="upload-page__header">
        <h1 className="upload-page__title">Upload files</h1>
        <p className="upload-page__subtitle">
          Add a certificate to your record or capture a scan-tron test result.
        </p>
      </header>

      <UploadTransparencyNotice />

      {countsError && (
        <div className="card card--md card--red mb-6">
          <p className="card-header">Couldn't load stored counts</p>
          <p className="text-sm">{countsError}</p>
        </div>
      )}

      {lastSavedCert && (
        <div className="card card--md card--primary mb-6">
          <p className="card-header">Certificate uploaded</p>
          <p className="text-sm">
            Saved <span className="font-semibold">{lastSavedCert.displayFileName}</span>.
            We're running a server-side validation check — your record will show as verified
            shortly.
          </p>
        </div>
      )}

      {lastSavedScantron && (
        <div className="card card--md card--primary mb-6">
          <p className="card-header">Scan-tron text saved</p>
          <p className="text-sm">
            Recorded {lastSavedScantron.examName ?? 'untitled scan-tron'}
            {lastSavedScantron.examDate ? ` for ${lastSavedScantron.examDate}` : ''}. Upload
            the matching certificate when it arrives — we'll offer to clean this up then.
          </p>
        </div>
      )}

      <div className="upload-page__grid">
        <CertificateUploadCard
          uid={appUser.uid}
          certificatesStored={counts?.certificates ?? 0}
          onSaved={handleCertificateSaved}
          onSavedConsumed={() => bumpCount('certificate')}
        />
        <ScanTronUploadCard
          uid={appUser.uid}
          scantronsStored={counts?.scantrons ?? 0}
          onSaved={handleScantronSaved}
          onSavedConsumed={() => bumpCount('scantron')}
        />
      </div>

      {matchingScantrons.length > 0 && (
        <MatchingScantronPrompt
          scantrons={matchingScantrons}
          onConfirmDelete={handleConfirmDeleteMatches}
          onKeep={handleKeepMatches}
        />
      )}
    </div>
  );
};

export default UploadFiles;

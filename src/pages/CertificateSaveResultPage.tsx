import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRightIcon, CertificateUploadIcon } from '../services/svgIcons';
import { PageHeader } from '../components/PageHeader';
import { Breadcrumb } from '../components/Breadcrumb';
import { EXPIRING_SOON_DAYS, getArchiveStatus, isFullyUsed } from '../services/archiveLogic';
import type { CertificateCategory, Certification } from '../types/certification';

const HAPPY_EMOJIS = ['🥳', '😊', '😆', '🤠', '😎', '😺', '😻', '🤩', '😇', '😸', '💃🏽','🕺🏾', '👻', '😌', '😙'];
const FAILURE_EMOJIS = ['😪', '🦖', '😞', '😰', '😿', '😔', '😭'];
const EMOJI_FONT_STACK =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", sans-serif';

export interface CertificateSaveResultState {
  status: 'success' | 'error';
  certId?: string;
  certificateName?: string;
  expirationDate?: string;
  categories?: CertificateCategory[];
  errorMessage?: string;
}

interface Outcome {
  tone: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  destination?: { to: string; label: string };
}

const SUCCESS_TITLE = 'File Saved Successfully';

function buildOutcome(state: CertificateSaveResultState): Outcome {
  if (state.status === 'error') {
    return {
      tone: 'error',
      title: "We couldn't save your certificate",
      message:
        state.errorMessage ??
        'Something went wrong while saving. Please check your connection and try again.',
    };
  }

  const categories = state.categories ?? [];
  const expirationDate = state.expirationDate;

  if (!expirationDate) {
    return {
      tone: 'success',
      title: SUCCESS_TITLE,
      message: 'Your certificate is now on file.',
      destination: { to: '/certificates', label: 'View File' },
    };
  }

  const fakeCert = {
    expirationDate,
    categories,
  } as Pick<Certification, 'expirationDate' | 'categories'> as Certification;
  const status = getArchiveStatus(fakeCert);
  const fullyUsed = isFullyUsed(fakeCert);

  if (status.expired) {
    return {
      tone: 'warning',
      title: SUCCESS_TITLE,
      message:
        "Heads up, this certificate's expiration date has already passed, so we have moved it straight to your Archive instead of active tracking.",
      destination: { to: '/archive', label: 'View File' },
    };
  }

  if (fullyUsed) {
    return {
      tone: 'success',
      title: SUCCESS_TITLE,
      message:
        'Since this certificate covers every license it can apply to, it has been archived as fully reported.',
      destination: { to: '/archive', label: 'View File' },
    };
  }

  if (status.expiringSoon) {
    return {
      tone: 'warning',
      title: SUCCESS_TITLE,
      message: `Heads up, this certificate expires within ${EXPIRING_SOON_DAYS} days. It is in active tracking, but you will want to renew it soon.`,
      destination: { to: '/certificates', label: 'View File' },
    };
  }

  return {
    tone: 'success',
    title: SUCCESS_TITLE,
    message: 'Your certificate is now tracked and counting toward your active cycles.',
    destination: { to: '/certificates', label: 'View File' },
  };
}

export const CertificateSaveResultPage = () => {
  const location = useLocation();
  const [happyEmoji] = useState(
    () => HAPPY_EMOJIS[Math.floor(Math.random() * HAPPY_EMOJIS.length)],
  );
  const [failureEmoji] = useState(
    () => FAILURE_EMOJIS[Math.floor(Math.random() * FAILURE_EMOJIS.length)],
  );

  const state = location.state as CertificateSaveResultState | null;

  if (!state) {
    return <Navigate to="/certificates/new" replace />;
  }

  const outcome = buildOutcome(state);
  const isError = outcome.tone === 'error';
  const emoji = isError ? failureEmoji : happyEmoji;

  return (
    <main className="min-h-[calc(100vh-6rem)] pt-6 pb-16 px-5 lg:px-10 w-full max-w-6xl mx-auto">
      <Breadcrumb
        items={[
          { name: 'Add Certificate', to: '/certificates/new' },
          { name: isError ? 'Save failed' : 'Saved', to: '' },
        ]}
      />

      <PageHeader
        icon={<CertificateUploadIcon size={22} />}
        title={isError ? 'Save failed' : 'Certificate saved'}
        subtitle="Here is what happened with your upload."
      />

      <section
        className="rounded-2xl text-[var(--ink-900)] dark:text-[var(--fg)] p-6 lg:p-8 relative overflow-hidden mx-auto max-w-2xl"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40">
            <span
              role="img"
              aria-label={isError ? 'Sad face' : 'Celebration'}
              className="text-[6rem] sm:text-[8rem] leading-none select-none"
              style={{ fontFamily: EMOJI_FONT_STACK }}
            >
              {emoji}
            </span>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-primary dark:text-slate-50">
              {outcome.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-300">
              {outcome.message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          {isError ? (
            <Link
              to="/certificates/new"
              className="rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--fg-on-brand)] px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 sm:flex-1"
            >
              <span>Try again</span>
              <ArrowRightIcon size={18} className="shrink-0" />
            </Link>
          ) : (
            <>
              <Link
                to="/certificates/new"
                className="rounded-lg border border-[var(--ink-200)] dark:border-[var(--ink-700)] text-[var(--ink-700)] dark:text-[var(--ink-300)] px-4 py-2 text-sm font-semibold hover:bg-[var(--ink-100)] dark:hover:bg-[var(--ink-800)] transition-colors flex items-center justify-center sm:flex-1"
              >
                Upload another
              </Link>
              <Link
                to="/reporting"
                className="rounded-lg border border-[var(--brand-600)] text-[var(--brand-700)] dark:text-[var(--brand-400)] px-4 py-2 text-sm font-semibold hover:bg-[var(--brand-50)] dark:hover:bg-[rgba(91,63,228,0.15)] transition-colors flex items-center justify-center sm:flex-1"
              >
                Report certificate
              </Link>
              {outcome.destination && (
                <Link
                  to={outcome.destination.to}
                  className="rounded-lg bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-[var(--fg-on-brand)] px-4 py-2 text-sm font-semibold transition-colors flex items-center justify-center gap-2 sm:flex-1"
                >
                  <span>{outcome.destination.label}</span>
                  <ArrowRightIcon size={18} className="shrink-0" />
                </Link>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default CertificateSaveResultPage;

import { Navigate } from 'react-router-dom';
import type { AppUser } from '../types/auth';
import { TeamIcon } from '../services/svgIcons';

interface TeamManagementProps {
  appUser: AppUser;
}

const TeamManagement = ({ appUser }: TeamManagementProps) => {
  if (appUser.role !== 'manager') {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-[calc(100vh-6rem)] pb-16 px-5 lg:px-10 w-full max-w-5xl mx-auto">
      <header className="mt-2 mb-8 flex items-center gap-3">
        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-primary/10 text-primary dark:bg-primary-light/20 dark:text-secondary">
          <TeamIcon size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-primary dark:text-slate-50 leading-tight">
            Team Members
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Invite teammates and review their certification progress.
          </p>
        </div>
      </header>

      <section className="card card--md card--glass">
        <p className="card-header">Coming soon</p>
        <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed">
          Team management for {appUser.teamCode ? `team "${appUser.teamCode}"` : 'your team'}{' '}
          will land here. You'll be able to invite technologists, see who's lagging on
          required credits, and assign reminders.
        </p>
      </section>
    </main>
  );
};

export default TeamManagement;

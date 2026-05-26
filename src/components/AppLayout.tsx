import type { PropsWithChildren } from 'react';
import type { AppUser } from '../types/auth';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { SetupReminderProvider } from './SetupModal';
import { useSyncCycleCredits } from '../hooks/useSyncCycleCredits';

interface AppLayoutProps {
  appUser: AppUser;
  onAppUserUpdate: (user: AppUser) => void;
}

const AppLayout = ({ appUser, onAppUserUpdate, children }: PropsWithChildren<AppLayoutProps>) => {
  useSyncCycleCredits(appUser);
  return (
    <SetupReminderProvider appUser={appUser} onAppUserUpdate={onAppUserUpdate}>
      <div className="min-h-screen flex">
        <Sidebar appUser={appUser} />
        <div className="flex-1 min-w-0 flex flex-col">
          <Navbar appUser={appUser} />
          <div className="app-canvas flex-1 pt-0 pb-28 lg:pt-0 lg:pb-0">{children}</div>
        </div>
      </div>
    </SetupReminderProvider>
  );
};

export default AppLayout;

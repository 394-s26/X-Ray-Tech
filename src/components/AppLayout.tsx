import { useEffect, useState, type PropsWithChildren } from 'react';
import type { AppUser } from '../types/auth';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { SetupReminderProvider } from './SetupModal';
import { WalkthroughProvider } from './WalkthroughOverlay';
import { MobileMenuContext } from './mobileMenuContext';
import { FCM_TOKEN_REFRESH_MS, ensureFcmTokenForCurrentUser } from '../services/notifications';
import { useSyncCycleCredits } from '../hooks/useSyncCycleCredits';

interface AppLayoutProps {
  appUser: AppUser;
  onAppUserUpdate: (user: AppUser) => void;
}

const AppLayout = ({ appUser, onAppUserUpdate, children }: PropsWithChildren<AppLayoutProps>) => {
  useEffect(() => {
    void ensureFcmTokenForCurrentUser();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void ensureFcmTokenForCurrentUser();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const intervalId = window.setInterval(() => {
      void ensureFcmTokenForCurrentUser();
    }, FCM_TOKEN_REFRESH_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(intervalId);
    };
  }, [appUser.uid]);

  useSyncCycleCredits(appUser);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <SetupReminderProvider appUser={appUser} onAppUserUpdate={onAppUserUpdate}>
      <MobileMenuContext.Provider value={{ isOpen: mobileMenuOpen, setOpen: setMobileMenuOpen }}>
        <WalkthroughProvider uid={appUser.uid}>
          <div className="min-h-screen flex">
            <Sidebar appUser={appUser} />
            <div className="flex-1 min-w-0 flex flex-col">
              <Navbar appUser={appUser} />
              <div className="app-canvas flex-1 pt-0 pb-28 lg:pt-0 lg:pb-0">{children}</div>
            </div>
          </div>
        </WalkthroughProvider>
      </MobileMenuContext.Provider>
    </SetupReminderProvider>
  );
};

export default AppLayout;

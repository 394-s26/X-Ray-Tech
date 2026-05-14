import type { PropsWithChildren } from 'react';
import type { AppUser } from '../types/auth';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

interface AppLayoutProps {
  appUser: AppUser;
}

const AppLayout = ({ appUser, children }: PropsWithChildren<AppLayoutProps>) => {
  return (
    <div className="app-canvas min-h-screen flex">
      <Sidebar appUser={appUser} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar />
        <div className="flex-1 pt-4 pb-28 lg:pt-0 lg:pb-0">{children}</div>
      </div>
    </div>
  );
};

export default AppLayout;

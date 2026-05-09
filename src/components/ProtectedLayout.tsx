import { Navigate, Outlet } from 'react-router-dom';
import type { AppUser } from '../types/auth';
import Navbar from './Navbar';

interface ProtectedLayoutProps {
  appUser: AppUser | null;
}

const ProtectedLayout = ({ appUser }: ProtectedLayoutProps) => {
  if (!appUser) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <Navbar appUser={appUser} />
      <main className="pt-20">
        <Outlet />
      </main>
    </>
  );
};

export default ProtectedLayout;

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { AppUser } from '../types/auth';
import { subscribeToAuthState, fetchAppUser, createStubAppUser } from '../services/authService';
import CertList from '../pages/CertList.tsx';
import { ARRT_RECORDS, IEMA_RECORDS } from '../data/certs.ts'
import Dashboard from './Dashboard';
import CredentialTracking from './CredentialTracking';
import TeamManagement from './TeamManagement';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import { AccountSetupPage } from './AccountSetupPage';
import AppLayout from '../components/AppLayout';

const Router = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appUserLoading, setAppUserLoading] = useState(true);

  useEffect(() => {
    return subscribeToAuthState(async (u) => {
      setUser(u);
      if (u) {
        setAppUserLoading(true);
        // Auth fires before the Firestore doc is written (signup race condition).
        // Retry once after a short delay if the doc isn't ready yet.
        let profile = await fetchAppUser(u.uid);
        if (!profile) {
          await new Promise(r => setTimeout(r, 1000));
          profile = await fetchAppUser(u.uid);
        }
        if (!profile) {
          profile = await createStubAppUser(u);
        }
        setAppUser(profile);
      } else {
        setAppUser(null);
      }
      setAuthLoading(false);
      setAppUserLoading(false);
    });
  }, []);

  if (authLoading || appUserLoading) return null;

  const requireAuth = (element: React.ReactElement): React.ReactElement => {
    if (!user) return <Navigate to="/login" replace />;
    if (!appUser) return <></>;
    if (!appUser.setupCompleted) return <Navigate to="/setup" replace />;
    return <AppLayout appUser={appUser}>{element}</AppLayout>;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={requireAuth(<Dashboard />)} />
        <Route path="/credentials" element={requireAuth(<CredentialTracking />)} />
        <Route
          path="/team"
          element={requireAuth(appUser ? <TeamManagement appUser={appUser} /> : <></>)}
        />
        <Route
          path="/arrt"
          element={requireAuth(
            <CertList
              name="ARRT"
              fullName="American Registry of Radiologic Technologists"
              accent="#1A4975"
              records={ARRT_RECORDS}
            />,
          )}
        />
        <Route
          path="/iema"
          element={requireAuth(
            <CertList
              name="IEMA"
              fullName="Illinois Emergency Management Agency"
              accent="#0EA37E"
              records={IEMA_RECORDS}
            />,
          )}
        />

        <Route
          path="/setup"
          element={
            !user ? <Navigate to="/login" replace /> :
            !appUser ? null :
            !appUser.setupCompleted
              ? <AccountSetupPage appUser={appUser} onComplete={(updated) => setAppUser(updated)} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/login"
          element={
            !user ? <LoginPage /> :
            !appUser ? null :
            !appUser.setupCompleted ? <Navigate to="/setup" replace /> :
            <Navigate to="/" replace />
          }
        />
        <Route
          path="/signup"
          element={
            !user ? <SignupPage /> :
            !appUser ? null :
            !appUser.setupCompleted ? <Navigate to="/setup" replace /> :
            <Navigate to="/" replace />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;

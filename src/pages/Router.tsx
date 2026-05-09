import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { AppUser } from '../types/auth';
import { subscribeToAuthState, fetchAppUser, createStubAppUser } from '../services/authService';
import App from './App';
import { LoginPage } from './LoginPage';
import { SignupPage } from './SignupPage';
import OCRTest from './OCRTest';
import UploadFiles from './UploadFiles';
import Liability from './Liability';
import ProtectedLayout from '../components/ProtectedLayout';

const Router = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [appUserLoading, setAppUserLoading] = useState(true);

  useEffect(() => {
    return subscribeToAuthState(async (u) => {
      setUser(u);
      if (u) {
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/legal" element={<Liability />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <SignupPage />} />

        <Route element={<ProtectedLayout appUser={user && appUser ? appUser : null} />}>
          <Route
            path="/"
            element={
              appUser
                ? <App appUser={appUser} onSetupComplete={(updated) => setAppUser(updated)} />
                : null
            }
          />
          <Route path="/upload" element={appUser ? <UploadFiles appUser={appUser} /> : null} />
          <Route path="/ocr" element={<OCRTest />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;

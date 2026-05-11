import { useNavigate } from 'react-router-dom';
import type { AppUser } from '../types/auth';
import { AccountSetupFlow } from '../components/AccountSetupFlow';

interface AccountSetupPageProps {
  appUser: AppUser;
  onComplete: (updated: AppUser) => void;
}

export const AccountSetupPage = ({ appUser, onComplete }: AccountSetupPageProps) => {
  const navigate = useNavigate();

  const handleComplete = (updated: AppUser) => {
    onComplete(updated);
    navigate('/', { replace: true });
  };

  return <AccountSetupFlow user={appUser} onComplete={handleComplete} />;
};

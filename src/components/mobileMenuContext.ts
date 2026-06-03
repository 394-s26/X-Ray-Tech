import { createContext, useContext } from 'react';

export interface MobileMenuContextValue {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

export const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export const useMobileMenu = (): MobileMenuContextValue => {
  const ctx = useContext(MobileMenuContext);
  if (!ctx) return { isOpen: false, setOpen: () => undefined };
  return ctx;
};

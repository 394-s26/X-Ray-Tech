import { createContext, useContext } from 'react';

export interface WalkthroughContextValue {
  open: () => void;
}

export const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

export const useWalkthrough = (): WalkthroughContextValue => {
  const ctx = useContext(WalkthroughContext);
  if (!ctx) return { open: () => undefined };
  return ctx;
};

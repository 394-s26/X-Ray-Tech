import { createContext, useContext } from 'react';

export interface SetupReminderContextValue {
  openModal: () => void;
  isSetupIncomplete: boolean;
}

export const SetupReminderContext = createContext<SetupReminderContextValue | null>(null);

export const useSetupReminder = (): SetupReminderContextValue => {
  const ctx = useContext(SetupReminderContext);
  if (!ctx) {
    return { openModal: () => undefined, isSetupIncomplete: false };
  }
  return ctx;
};

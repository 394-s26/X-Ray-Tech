import type { Timestamp } from 'firebase/firestore';

// This file defines TypeScript interfaces for user authentication data.

// Stored in Firestore at users/{uid}. Extends the Firebase Auth identity
// with profile fields that Auth does not natively support.
export interface AppUser {
  uid: string;        // Same as Firebase Auth uid — used as the Firestore document ID
  email: string | null;
  username: string;
  accountCreatedDate: Timestamp | null;

  setupCompleted: boolean;   // The below fields should no longer be null after setup is completed.

  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  birthday?: string | null;  // "MM-DD", e.g. "03-24"
  teamCode?: string | null;
  hospitalAddress?: string | null;
  colorCode?: string | null;

  // License cycle anchors. ARRT cycle month is derived from the birth month;
  // IEMA cycle end month is the accreditation month and stored independently.
  arrtCycleStartYear?: number | null;
  iemaCycleStartYear?: number | null;
  iemaCycleEndMonth?: number | null;  // 1-12

  /** Optional registry / state identification numbers */
  arrtIdNumber?: string | null;
  iemaIdNumber?: string | null;

  // 'manager' unlocks the Team Management area in the sidebar; everyone else
  // is treated as a member.
  role?: 'manager' | 'member' | null;

  /**
   * ISO date YYYY-MM-DD — end of ARRT-style CE probation window for this user, if applicable.
   * See license_ce_logic.md (ARRT probation ~6 months when CE is incomplete at cycle end).
   */
  ceProbationEndsAt?: string | null;
}

export interface EmailRegistrationInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  photoFile?: File | null;
}

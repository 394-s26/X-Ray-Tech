// Fake team data used for the manager view of /team.
// Will be replaced when the backend provides per-employee certification data.

export interface TeamEmployeeCategory {
  /** Earliest expiry across all records in this category, ISO YYYY-MM-DD. */
  earliestExpiry: string;
}

export interface TeamEmployee {
  id: string;
  firstName: string;
  lastName: string;
  /** MM-DD format, matching AppUser.birthday. */
  birthday: string;
  arrt: TeamEmployeeCategory;
  iema: TeamEmployeeCategory;
}

export const FAKE_TEAM: TeamEmployee[] = [
  { id: '1', firstName: 'Sarah',  lastName: 'Chen',     birthday: '03-15',
    arrt: { earliestExpiry: '2026-04-22' },
    iema: { earliestExpiry: '2026-09-12' } },
  { id: '2', firstName: 'James',  lastName: 'Patel',    birthday: '07-04',
    arrt: { earliestExpiry: '2026-05-26' },
    iema: { earliestExpiry: '2027-02-10' } },
  { id: '3', firstName: 'Maria',  lastName: 'Lopez',    birthday: '11-22',
    arrt: { earliestExpiry: '2026-10-05' },
    iema: { earliestExpiry: '2026-05-30' } },
  { id: '4', firstName: 'David',  lastName: 'Kim',      birthday: '01-08',
    arrt: { earliestExpiry: '2026-07-18' },
    iema: { earliestExpiry: '2026-11-04' } },
  { id: '5', firstName: 'Emily',  lastName: 'Nguyen',   birthday: '06-30',
    arrt: { earliestExpiry: '2026-12-22' },
    iema: { earliestExpiry: '2027-03-15' } },
  { id: '6', firstName: 'Marcus', lastName: 'Johnson',  birthday: '09-12',
    arrt: { earliestExpiry: '2027-01-09' },
    iema: { earliestExpiry: '2026-08-14' } },
  { id: '7', firstName: 'Alex',   lastName: 'Morgan',   birthday: '04-25',
    arrt: { earliestExpiry: '2026-11-30' },
    iema: { earliestExpiry: '2027-04-02' } },
  { id: '8', firstName: 'Priya',  lastName: 'Sharma',   birthday: '12-03',
    arrt: { earliestExpiry: '2026-04-15' },
    iema: { earliestExpiry: '2026-10-21' } },
];

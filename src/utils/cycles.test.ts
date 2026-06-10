// Unit tests for the applied-cycle migration planner.
//
// Run with Node's built-in test runner + type stripping (no extra deps):
//   npm test
//   # or directly:
//   node --experimental-strip-types --test src/utils/cycles.test.ts
//
// cycles.ts has only type-only imports, so it loads at runtime with no Firebase
// dependency. We compute expected startISO values via the same compute* helpers
// (instead of hardcoding dates) so the assertions hold regardless of run date.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeArrtCycle,
  computeIemaCycle,
  listIemaCycles,
  planAppliedCycleMigrations,
} from './cycles.ts';
import type { AppUser } from '../types/auth';
import type { AppliedCycles, Certification } from '../types/certification';

function makeUser(partial: Partial<AppUser>): AppUser {
  return {
    uid: 'u1',
    email: null,
    username: 'tester',
    accountCreatedDate: null,
    setupCompleted: true,
    arrtCycleStartYear: null,
    iemaCycleStartYear: null,
    iemaCycleEndMonth: null,
    birthday: null,
    ...partial,
  };
}

function cert(id: string, appliedCycles?: AppliedCycles): Certification {
  return {
    id,
    ownerId: 'u1',
    certificateName: id,
    providerName: 'Provider',
    completedDate: '2025-01-01',
    expirationDate: '2027-01-01',
    ceCredits: 4,
    categoryType: 'A',
    categories: appliedCycles ? (Object.keys(appliedCycles) as Certification['categories']) : [],
    ...(appliedCycles ? { appliedCycles } : {}),
    photoStoragePath: '',
    photoURL: '',
    createdAt: null as unknown as Certification['createdAt'],
  };
}

const iemaStart = (u: AppUser): string => {
  const c = computeIemaCycle(u);
  assert.ok(c, 'expected an IEMA cycle');
  return c.startISO;
};
const arrtStart = (u: AppUser): string => {
  const c = computeArrtCycle(u);
  assert.ok(c, 'expected an ARRT cycle');
  return c.startISO;
};

// ── IEMA: end-month edit shifts the active window ──────────────────────────

test('migrates a cert applied to the active IEMA cycle to the new startISO', () => {
  const prev = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6 });
  const next = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 3 });
  const oldStart = iemaStart(prev);
  const newStart = iemaStart(next);
  assert.notEqual(oldStart, newStart); // the edit really does move the window

  const result = planAppliedCycleMigrations([cert('c1', { IEMA: oldStart })], prev, next);
  assert.deepEqual(result, [{ certId: 'c1', appliedCycles: { IEMA: newStart } }]);
});

test('leaves an attribution that predates the cycle timeline untouched', () => {
  const prev = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6 });
  const next = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 3 });
  // '2000-06-01' is older than the anchor, so it's in no cycle list and has no
  // remap entry — unlike a within-timeline past cycle, which would be remapped.
  const result = planAppliedCycleMigrations([cert('c1', { IEMA: '2000-06-01' })], prev, next);
  assert.deepEqual(result, []);
});

test('remaps a within-timeline PAST cycle to the new same-offset past cycle', () => {
  const Y = new Date().getFullYear();
  // Same end month, anchor shifted by one year (odd) → the whole 2-year grid
  // moves, so past cycles get new startISOs too. Anchored several cycles back so
  // a past cycle is guaranteed regardless of the run date.
  const prev = makeUser({ iemaCycleStartYear: Y - 6, iemaCycleEndMonth: 6 });
  const next = makeUser({ iemaCycleStartYear: Y - 5, iemaCycleEndMonth: 6 });
  const oldCycles = listIemaCycles(prev);
  const newCycles = listIemaCycles(next);
  const oldCur = oldCycles.findIndex((c) => c.isCurrent);
  const newCur = newCycles.findIndex((c) => c.isCurrent);
  assert.ok(oldCur >= 1 && newCur >= 1, 'expected at least one past cycle in both timelines');

  // Current → current (offset 0).
  assert.notEqual(oldCycles[oldCur].startISO, newCycles[newCur].startISO);
  assert.deepEqual(
    planAppliedCycleMigrations([cert('cur', { IEMA: oldCycles[oldCur].startISO })], prev, next),
    [{ certId: 'cur', appliedCycles: { IEMA: newCycles[newCur].startISO } }],
  );

  // Immediately-previous past cycle (offset −1) → new offset −1.
  assert.notEqual(oldCycles[oldCur - 1].startISO, newCycles[newCur - 1].startISO);
  assert.deepEqual(
    planAppliedCycleMigrations([cert('past', { IEMA: oldCycles[oldCur - 1].startISO })], prev, next),
    [{ certId: 'past', appliedCycles: { IEMA: newCycles[newCur - 1].startISO } }],
  );
});

test('skips legacy certs that have no appliedCycles map', () => {
  const prev = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6 });
  const next = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 3 });
  const result = planAppliedCycleMigrations([cert('legacy')], prev, next);
  assert.deepEqual(result, []);
});

test('no-op when the cycle window is unchanged', () => {
  const prev = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6 });
  const oldStart = iemaStart(prev);
  // Same cycle anchors, only a non-cycle field (ID number) differs.
  const next = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6, iemaIdNumber: 'IL-9' });
  const result = planAppliedCycleMigrations([cert('c1', { IEMA: oldStart })], prev, next);
  assert.deepEqual(result, []);
});

// ── Per-license independence ───────────────────────────────────────────────

test('migrates only the edited license, preserving the other licence attribution', () => {
  const prev = makeUser({
    iemaCycleStartYear: 2024,
    iemaCycleEndMonth: 6,
    arrtCycleStartYear: 2024,
    birthday: '09-15',
  });
  const next = makeUser({
    iemaCycleStartYear: 2024,
    iemaCycleEndMonth: 3, // only IEMA changes
    arrtCycleStartYear: 2024,
    birthday: '09-15',
  });
  const oldIema = iemaStart(prev);
  const newIema = iemaStart(next);
  const arrt = arrtStart(prev);
  assert.equal(arrt, arrtStart(next)); // ARRT window did not move
  assert.notEqual(oldIema, newIema);

  const result = planAppliedCycleMigrations(
    [cert('c1', { IEMA: oldIema, ARRT: arrt })],
    prev,
    next,
  );
  assert.deepEqual(result, [{ certId: 'c1', appliedCycles: { IEMA: newIema, ARRT: arrt } }]);
});

// ── ARRT is anchored to the birth month (Personal Info edit) ───────────────

test('migrates the active ARRT cycle when the birthday month changes', () => {
  const prev = makeUser({ arrtCycleStartYear: 2024, birthday: '06-15' });
  const next = makeUser({ arrtCycleStartYear: 2024, birthday: '03-15' });
  const oldStart = arrtStart(prev);
  const newStart = arrtStart(next);
  assert.notEqual(oldStart, newStart);

  const result = planAppliedCycleMigrations([cert('c1', { ARRT: oldStart })], prev, next);
  assert.deepEqual(result, [{ certId: 'c1', appliedCycles: { ARRT: newStart } }]);
});

// ── Adding / removing setup ────────────────────────────────────────────────

test('does not migrate when there was no prior cycle (setup just added)', () => {
  const prev = makeUser({}); // IEMA not set up → no current cycle
  const next = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6 });
  const result = planAppliedCycleMigrations([cert('c1', { IEMA: '2024-06-01' })], prev, next);
  assert.deepEqual(result, []);
});

test('does not migrate when setup is removed (no new cycle to point at)', () => {
  const prev = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6 });
  const oldStart = iemaStart(prev);
  const next = makeUser({}); // IEMA cleared
  const result = planAppliedCycleMigrations([cert('c1', { IEMA: oldStart })], prev, next);
  assert.deepEqual(result, []);
});

// ── Mixed batch ────────────────────────────────────────────────────────────

test('migrates only active certs in a mixed batch', () => {
  const prev = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 6 });
  const next = makeUser({ iemaCycleStartYear: 2024, iemaCycleEndMonth: 3 });
  const oldStart = iemaStart(prev);
  const newStart = iemaStart(next);

  const certs = [
    cert('active', { IEMA: oldStart }),
    cert('ancient', { IEMA: '2000-06-01' }), // predates the timeline → untouched
    cert('legacy'),
  ];
  const result = planAppliedCycleMigrations(certs, prev, next);
  assert.deepEqual(result, [{ certId: 'active', appliedCycles: { IEMA: newStart } }]);
});

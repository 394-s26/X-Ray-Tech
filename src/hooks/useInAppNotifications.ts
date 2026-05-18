import { useCallback, useEffect, useMemo, useState } from 'react';
import { arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { AppUser } from '../types/auth';
import { fetchAppUser } from '../services/authService';
import { db } from '../services/firebase';
import { buildInAppNotifications } from '../services/inAppNotificationRules';
import type { InAppNotification } from '../types/notifications';
import { useCertifications } from './useCertifications';

const SEVERITY_SORT: Record<InAppNotification['severity'], number> = {
  urgent: 0,
  warning: 1,
  info: 2,
};

/** Baseline member UID list per team — survives refresh so joins notify after reopening the app. */
function knownMembersStorageKey(teamIdUpper: string): string {
  return `xraytech.teamKnownMembers.${teamIdUpper}`;
}

function loadKnownMemberIds(teamIdUpper: string): string[] | null {
  try {
    const raw = localStorage.getItem(knownMembersStorageKey(teamIdUpper));
    if (raw === null) return null;
    const arr = JSON.parse(raw) as string[];
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

function saveKnownMemberIds(teamIdUpper: string, memberIds: string[]): void {
  const sorted = [...new Set(memberIds)].sort();
  localStorage.setItem(knownMembersStorageKey(teamIdUpper), JSON.stringify(sorted));
}

/** Pending join rows until manager dismisses — survives refresh (probation-style persistence). */
function pendingJoinsStorageKey(teamIdUpper: string): string {
  return `xraytech.pendingTeamJoins.${teamIdUpper}`;
}

function loadPendingTeamJoins(teamIdUpper: string): { uid: string; displayName: string }[] {
  try {
    const raw = localStorage.getItem(pendingJoinsStorageKey(teamIdUpper));
    if (!raw) return [];
    const arr = JSON.parse(raw) as { uid: string; displayName: string }[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function savePendingTeamJoins(
  teamIdUpper: string,
  joins: { uid: string; displayName: string }[],
): void {
  localStorage.setItem(pendingJoinsStorageKey(teamIdUpper), JSON.stringify(joins));
}

export function useInAppNotifications(appUser: AppUser | null | undefined) {
  const { certifications, loading: certsLoading } = useCertifications();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [teamMembers, setTeamMembers] = useState<AppUser[]>([]);
  const [joinEvents, setJoinEvents] = useState<{ uid: string; displayName: string }[]>([]);

  const userUid = appUser?.uid;
  const userTeamCode = appUser?.teamCode;

  useEffect(() => {
    if (!userUid) return;
    const unsub = onSnapshot(doc(db, 'users', userUid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as { dismissedNotificationIds?: string[] };
      setDismissed(new Set(data.dismissedNotificationIds ?? []));
    });
    return () => {
      unsub();
      setDismissed(new Set());
    };
  }, [userUid]);

  const dismiss = useCallback(
    (id: string) => {
      if (userUid) {
        updateDoc(doc(db, 'users', userUid), {
          dismissedNotificationIds: arrayUnion(id),
        });
      }
      if (id.startsWith('team-join-')) {
        const uid = id.slice('team-join-'.length);
        const tc = userTeamCode?.toUpperCase();
        if (tc) {
          const next = loadPendingTeamJoins(tc).filter((j) => j.uid !== uid);
          savePendingTeamJoins(tc, next);
        }
        setJoinEvents((prev) => prev.filter((j) => j.uid !== uid));
      }
    },
    [userUid, userTeamCode],
  );

  useEffect(() => {
    if (!appUser || appUser.role !== 'manager' || !appUser.teamCode) return;

    const teamIdUpper = appUser.teamCode.toUpperCase();
    const teamRef = doc(db, 'teams', teamIdUpper);
    let cancelled = false;
    let initialized = false;

    const unsub = onSnapshot(teamRef, async (snap) => {
      if (cancelled) return;
      if (!initialized) {
        initialized = true;
        setJoinEvents(loadPendingTeamJoins(teamIdUpper));
      }
      if (!snap.exists()) return;
      const data = snap.data() as { members?: string[]; teamLead?: string };
      const memberArr = data.members ?? [];
      const lead = data.teamLead ?? '';

      const storedKnown = loadKnownMemberIds(teamIdUpper);

      if (storedKnown === null) {
        saveKnownMemberIds(teamIdUpper, memberArr);
      } else {
        const storedSet = new Set(storedKnown);
        const added = memberArr.filter(
          (uid) => !storedSet.has(uid) && uid !== lead && uid !== appUser.uid,
        );

        if (added.length > 0) {
          const profiles = await Promise.all(added.map((uid) => fetchAppUser(uid)));
          if (cancelled) return;
          const joins = profiles
            .filter((u): u is AppUser => u !== null)
            .map((u) => ({
              uid: u.uid,
              displayName:
                u.firstName?.trim() && u.lastName?.trim()
                  ? `${u.firstName.trim()} ${u.lastName.trim()}`
                  : u.username,
            }));
          setJoinEvents((prevEv) => {
            const existing = new Set(prevEv.map((j) => j.uid));
            const merged = [...prevEv];
            for (const j of joins) {
              if (!existing.has(j.uid)) merged.push(j);
            }
            savePendingTeamJoins(teamIdUpper, merged);
            return merged;
          });
        }
        saveKnownMemberIds(teamIdUpper, memberArr);
      }

      const uidsToFetch = memberArr.filter((uid) => uid !== appUser.uid);
      if (uidsToFetch.length === 0) {
        if (!cancelled) setTeamMembers([]);
        return;
      }
      const profiles = await Promise.all(uidsToFetch.map((uid) => fetchAppUser(uid)));
      if (!cancelled) setTeamMembers(profiles.filter((u): u is AppUser => u !== null));
    });

    return () => {
      cancelled = true;
      unsub();
      setTeamMembers([]);
      setJoinEvents([]);
    };
  }, [appUser?.uid, appUser?.role, appUser?.teamCode]);

  const allNotifications = useMemo(() => {
    if (!appUser) return [];
    return buildInAppNotifications({
      certifications,
      appUser,
      teamMemberProfiles: teamMembers,
      recentTeamJoins: joinEvents,
    });
  }, [appUser, certifications, teamMembers, joinEvents]);

  /** Urgent first; within the same severity, newer rows (later in build order) first — team joins etc. were appended last. */
  const visible = useMemo(() => {
    const indexed = allNotifications
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => !dismissed.has(n.id));
    indexed.sort((a, b) => {
      const bySev = SEVERITY_SORT[a.n.severity] - SEVERITY_SORT[b.n.severity];
      if (bySev !== 0) return bySev;
      return b.i - a.i;
    });
    return indexed.map(({ n }) => n);
  }, [allNotifications, dismissed]);

  return {
    notifications: visible,
    unreadCount: visible.length,
    dismiss,
    loading: !!appUser && certsLoading,
  };
}

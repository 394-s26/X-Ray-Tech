import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { AppUser } from '../types/auth';
import { fetchAppUser } from '../services/authService';
import { db } from '../services/firebase';
import { buildInAppNotifications } from '../services/inAppNotificationRules';
import { useCertifications } from './useCertifications';

const STORAGE_KEY = 'xraytech.dismissedNotificationIds';

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function useInAppNotifications(appUser: AppUser | null | undefined) {
  const { certifications, loading: certsLoading } = useCertifications();
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());
  const [teamMembers, setTeamMembers] = useState<AppUser[]>([]);
  const [joinEvents, setJoinEvents] = useState<{ uid: string; displayName: string }[]>([]);

  const prevMembersRef = useRef<Set<string> | null>(null);
  const skipFirstTeamSnapRef = useRef(true);

  const persistDismissed = useCallback((next: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    setDismissed(next);
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      persistDismissed(new Set([...dismissed, id]));
    },
    [dismissed, persistDismissed],
  );

  useEffect(() => {
    skipFirstTeamSnapRef.current = true;
    prevMembersRef.current = null;

    if (!appUser || appUser.role !== 'manager' || !appUser.teamCode) {
      setTeamMembers([]);
      setJoinEvents([]);
      return;
    }

    const teamRef = doc(db, 'teams', appUser.teamCode.toUpperCase());
    let cancelled = false;

    const unsub = onSnapshot(teamRef, async (snap) => {
      if (!snap.exists() || cancelled) return;
      const data = snap.data() as { members?: string[]; teamLead?: string };
      const members = data.members ?? [];
      const lead = data.teamLead ?? '';
      const memberSet = new Set(members);

      if (skipFirstTeamSnapRef.current) {
        skipFirstTeamSnapRef.current = false;
        prevMembersRef.current = memberSet;
      } else {
        const prev = prevMembersRef.current ?? new Set<string>();
        const added = [...memberSet].filter(
          (uid) => !prev.has(uid) && uid !== lead && uid !== appUser.uid,
        );
        prevMembersRef.current = memberSet;

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
            return merged;
          });
        }
      }

      const uidsToFetch = members.filter((uid) => uid !== appUser.uid);
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

  const visible = useMemo(
    () => allNotifications.filter((n) => !dismissed.has(n.id)),
    [allNotifications, dismissed],
  );

  return {
    notifications: visible,
    unreadCount: visible.length,
    dismiss,
    loading: !!appUser && certsLoading,
  };
}

import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { AppUser } from '../types/auth';
import type { Team } from '../types/team';
import UserAvatar from './UserAvatar';
import {
  LayoutGridIcon,
  IdCardIcon,
  PlusIcon,
  TeamIcon,
  SettingsIcon,
  ChevronRightIcon,
  LogOutIcon,
  ArchiveIcon,
  RotateCwIcon,
  ClipboardIcon,
} from '../services/svgIcons';
import { signOut, getTeamByCode } from '../services/authService';
import '../styles/components/Sidebar.css';

interface NavItem {
  to: string;
  longLabel: string;
  shortLabel: string;
  icon: (size: number) => React.ReactElement;
  managerOnly?: boolean;
  /** When true, only highlight this item when the path matches exactly. */
  exact?: boolean;
  highlighted?: boolean;
  /** When true, the item is hidden in the mobile bottom nav. */
  mobileHidden?: boolean;
  /** When true, the item is hidden in the desktop sidebar. */
  desktopHidden?: boolean;
}

const PRIMARY_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/',
    longLabel: 'Compliance Overview',
    shortLabel: 'Overview',
    icon: (s) => <LayoutGridIcon size={s} />,
    mobileHidden: true,
  },
  {
    to: '/reporting',
    longLabel: 'Certificate Reporting',
    shortLabel: 'Reporting',
    icon: (s) => <ClipboardIcon size={s} />,
    mobileHidden: true,
  },
  {
    to: '/certificates',
    longLabel: 'Available Certificates',
    shortLabel: 'Certificates',
    icon: (s) => <IdCardIcon size={s} />,
    mobileHidden: true,
  },
];

const CYCLES_ITEM_DESKTOP: NavItem = {
  to: '/cycles',
  longLabel: 'License Cycles',
  shortLabel: 'Cycles',
  icon: (s) => <RotateCwIcon size={s} />,
  mobileHidden: true,
};

const ADD_CERT_ITEM: NavItem = {
  to: '/certificates/new',
  longLabel: 'Add certification',
  shortLabel: 'Add cert',
  icon: (s) => <PlusIcon size={s} />,
  exact: true,
  highlighted: true,
};

const SETTINGS_ITEM: NavItem = {
  to: '/settings',
  longLabel: 'System Settings',
  shortLabel: 'Settings',
  icon: (s) => <SettingsIcon size={s} />,
  mobileHidden: true,
};

const ARCHIVE_ITEM_DESKTOP: NavItem = {
  to: '/archive',
  longLabel: 'Archived Certifications',
  shortLabel: 'Archive',
  icon: (s) => <ArchiveIcon size={s} />,
  mobileHidden: true,
};

const ARCHIVE_ITEM_MOBILE: NavItem = {
  to: '/archive',
  longLabel: 'Archived Certifications',
  shortLabel: 'Archive',
  icon: (s) => <ArchiveIcon size={s} />,
  desktopHidden: true,
};

const HISTORY_ITEM_MOBILE: NavItem = {
  to: '/cycles',
  longLabel: 'License history',
  shortLabel: 'History',
  icon: (s) => <RotateCwIcon size={s} />,
  desktopHidden: true,
};

const FILES_ITEM_MOBILE: NavItem = {
  to: '/certificates',
  longLabel: 'Available Certificates',
  shortLabel: 'Files',
  icon: (s) => <IdCardIcon size={s} />,
  desktopHidden: true,
};

const TRACKING_ITEM_MOBILE: NavItem = {
  to: '/reporting',
  longLabel: 'Certificate Reporting',
  shortLabel: 'Tracking',
  icon: (s) => <ClipboardIcon size={s} />,
  desktopHidden: true,
};

interface SidebarProps {
  appUser: AppUser;
}

const profileDisplayName = (user: AppUser): string => {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.username;
};

const NavItemLink = ({ item }: { item: NavItem }) => (
  <NavLink
    to={item.to}
    end={item.exact !== undefined ? item.exact : item.to === '/'}
    className={({ isActive }) =>
      `app-sidebar__nav-item${isActive ? ' app-sidebar__nav-item--active' : ''}${item.highlighted ? ' highlighted' : ''}${item.mobileHidden ? ' app-sidebar__nav-item--mobile-hidden' : ''}${item.desktopHidden ? ' app-sidebar__nav-item--desktop-hidden' : ''}`
    }
  >
    <span className="app-sidebar__nav-icon">{item.icon(20)}</span>
    <span className="app-sidebar__nav-label app-sidebar__nav-label--long">
      {item.longLabel}
    </span>
    <span className="app-sidebar__nav-label app-sidebar__nav-label--short">
      {item.shortLabel}
    </span>
  </NavLink>
);

const Sidebar = ({ appUser }: SidebarProps) => {
  const isManager = appUser.role === 'manager';
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (!appUser.teamCode) return;
    getTeamByCode(appUser.teamCode).then(setTeam);
  }, [appUser.teamCode]);

  const visiblePrimary = PRIMARY_ITEMS.filter(
    (item) => !item.managerOnly || isManager,
  );

  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      <div className="app-sidebar__inner">
        <button
          type="button"
          className="app-sidebar__profile"
          onClick={() => navigate('/profile')}
          aria-label="Go to profile"
        >
          <UserAvatar user={appUser} size="lg" bordered />
          <div className="min-w-0 flex-1">
            <p className="app-sidebar__profile-name">{profileDisplayName(appUser)}</p>
            <p className="app-sidebar__profile-role">
              {isManager ? 'Manager' : 'Technologist'}
            </p>
          </div>
          <span className="app-sidebar__profile-chevron">
            <ChevronRightIcon size={16} />
          </span>
        </button>

        <nav className="app-sidebar__section" aria-label="Sidebar">
          {visiblePrimary.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
          <NavItemLink item={ARCHIVE_ITEM_DESKTOP} />
          <NavItemLink item={CYCLES_ITEM_DESKTOP} />
          <NavLink
            to="/team"
            end={false}
            className={({ isActive }) =>
              `app-sidebar__nav-item app-sidebar__nav-item--mobile-hidden${isActive ? ' app-sidebar__nav-item--active' : ''}`
            }
          >
            <span className="app-sidebar__nav-icon"><TeamIcon size={20} /></span>
            <span className="app-sidebar__nav-label app-sidebar__nav-label--long">
              {isManager ? 'Manage Team' : 'View Team'}
              {team?.name && (
                <span className="app-sidebar__team-name">{team.name}</span>
              )}
            </span>
            <span className="app-sidebar__nav-label app-sidebar__nav-label--short">
              Team
            </span>
          </NavLink>
          <NavItemLink item={TRACKING_ITEM_MOBILE} />
          <NavItemLink item={FILES_ITEM_MOBILE} />
        </nav>

        <div className="app-sidebar__bottom">
          <div className="app-sidebar__divider" />
          <nav className="app-sidebar__section" aria-label="Add certificate">
            <NavItemLink item={ADD_CERT_ITEM} />
            <NavItemLink item={HISTORY_ITEM_MOBILE} />
            <NavItemLink item={ARCHIVE_ITEM_MOBILE} />
          </nav>
          <nav
            className="app-sidebar__section app-sidebar__section--settings"
            aria-label="Settings"
          >
            <NavItemLink item={SETTINGS_ITEM} />
            <button
              type="button"
              className="app-sidebar__nav-item app-sidebar__logout app-sidebar__nav-item--mobile-hidden"
              onClick={() => signOut()}
              aria-label="Log out"
            >
              <span className="app-sidebar__nav-icon"><LogOutIcon size={20} /></span>
              <span className="app-sidebar__nav-label app-sidebar__nav-label--long">Log Out</span>
              <span className="app-sidebar__nav-label app-sidebar__nav-label--short">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

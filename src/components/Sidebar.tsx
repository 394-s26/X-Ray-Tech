import { NavLink } from 'react-router-dom';
import type { AppUser } from '../types/auth';
import UserAvatar from './UserAvatar';
import {
  LayoutGridIcon,
  IdCardIcon,
  PlusIcon,
  TeamIcon,
  SettingsIcon,
} from '../services/svgIcons';
import '../styles/components/Sidebar.css';

interface NavItem {
  to: string;
  longLabel: string;
  shortLabel: string;
  icon: (size: number) => React.ReactElement;
  managerOnly?: boolean;
  /** When true, only highlight this item when the path matches exactly. */
  exact?: boolean;
}

const PRIMARY_ITEMS: ReadonlyArray<NavItem> = [
  {
    to: '/',
    longLabel: 'Compliance Overview',
    shortLabel: 'Overview',
    icon: (s) => <LayoutGridIcon size={s} />,
  },
  {
    to: '/credentials',
    longLabel: 'Credential Tracking',
    shortLabel: 'Credentials',
    icon: (s) => <IdCardIcon size={s} />,
  },
  {
    to: '/certificates/new',
    longLabel: 'Add certificate',
    shortLabel: 'Add cert',
    icon: (s) => <PlusIcon size={s} />,
    exact: true,
  },
  {
    to: '/team',
    longLabel: 'Team Members',
    shortLabel: 'Team',
    icon: (s) => <TeamIcon size={s} />,
    managerOnly: true,
  },
];

const SETTINGS_ITEM: NavItem = {
  to: '/settings',
  longLabel: 'System Settings',
  shortLabel: 'Settings',
  icon: (s) => <SettingsIcon size={s} />,
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
      `app-sidebar__nav-item${isActive ? ' app-sidebar__nav-item--active' : ''}`
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
  const visiblePrimary = PRIMARY_ITEMS.filter(
    (item) => !item.managerOnly || isManager,
  );

  return (
    <aside className="app-sidebar" aria-label="Primary navigation">
      <div className="app-sidebar__inner">
        <div className="app-sidebar__profile">
          <UserAvatar user={appUser} size="lg" bordered />
          <div className="min-w-0 flex-1">
            <p className="app-sidebar__profile-name">{profileDisplayName(appUser)}</p>
            <p className="app-sidebar__profile-role">
              {isManager ? 'Manager' : 'Technologist'}
            </p>
          </div>
        </div>

        <nav className="app-sidebar__section" aria-label="Sidebar">
          {visiblePrimary.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="app-sidebar__divider" />

        <nav
          className="app-sidebar__section app-sidebar__section--settings"
          aria-label="Settings"
        >
          <NavItemLink item={SETTINGS_ITEM} />
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;

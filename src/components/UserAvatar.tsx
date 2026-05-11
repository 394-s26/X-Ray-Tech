import React from 'react';
import type { AppUser } from '../types/auth';
import { UserIcon } from '../services/svgIcons';
import '../styles/components/UserAvatar.css';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface UserAvatarProps {
  user: AppUser | null;
  size?: AvatarSize;
  bordered?: boolean;
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

const iconSizeMap: Record<AvatarSize, number> = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
};

const textSizeMap: Record<AvatarSize, string> = {
  xs: '0.35rem',
  sm: '0.55rem',
  md: '0.8rem',
  lg: '0.9rem',
  xl: '1.05rem',
};

const UserAvatar = ({ user, size = 'md', bordered = false, borderColor, className = '', style }: UserAvatarProps) => {
  const hasBorder = bordered || !!borderColor;
  const borderClass = hasBorder
    ? (borderColor ? ' user-avatar-border-custom' : ' user-avatar-bordered')
    : '';
  const sizeClass = `user-avatar user-avatar-${size}${borderClass}${className ? ' ' + className : ''}`;
  const mergedStyle: React.CSSProperties = borderColor
    ? { ...style, borderColor }
    : { ...style };

  const initials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : null;

  if (initials && user?.colorCode) {
    return (
      <div
        className={`${sizeClass} user-avatar-initials`}
        style={{ ...mergedStyle, backgroundColor: user.colorCode, fontSize: textSizeMap[size] }}
        aria-label={`${user.firstName} ${user.lastName}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} user-avatar-default`} style={mergedStyle}>
      <UserIcon size={iconSizeMap[size]} />
    </div>
  );
};

export default UserAvatar;

'use client';

import { User } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function proxyUrl(url: string): string {
  if (url.includes('googleusercontent.com') || url.includes('googleapis.com')) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
}

const sizeMap = {
  sm: { wrapper: 'w-8 h-8', icon: 'w-4 h-4', text: 'text-sm' },
  md: { wrapper: 'w-10 h-10', icon: 'w-5 h-5', text: 'text-base' },
  lg: { wrapper: 'w-20 h-20', icon: 'w-8 h-8', text: 'text-2xl' },
};

export function UserAvatar({ src, name, size = 'sm', className = '' }: UserAvatarProps) {
  const s = sizeMap[size];

  return (
    <div
      className={`${s.wrapper} rounded-full flex items-center justify-center overflow-hidden bg-gray-200 flex-shrink-0 ${className}`}
    >
      {src ? (
        <img
          src={proxyUrl(src)}
          alt={name || 'User'}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('hidden');
          }}
        />
      ) : null}
      <span hidden={!!src} className={`font-bold ${s.text} text-gray-600`}>
        {name ? name.charAt(0).toUpperCase() : <User className={s.icon} />}
      </span>
    </div>
  );
}

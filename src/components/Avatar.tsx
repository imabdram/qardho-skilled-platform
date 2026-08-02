import React from 'react';
import { UserRound } from 'lucide-react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  eager?: boolean;
  className?: string;
}

const sizes = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

function resolveAvatarUrl(url?: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  return trimmed || null;
}

export default function Avatar({ name, src, size = 'md', eager = false, className = '' }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  const initials = (name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const validSrc = resolveAvatarUrl(src);

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-black text-brand-800 ring-1 ring-brand-950/10 ${sizes[size]} ${className}`} aria-hidden="true">
      {validSrc && !imgError ? (
        <img
          src={validSrc}
          alt=""
          className="h-full w-full object-cover"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          width={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 44 : 36}
          height={size === 'xl' ? 96 : size === 'lg' ? 64 : size === 'md' ? 44 : 36}
        />
      ) : initials ? (
        initials
      ) : (
        <UserRound className="h-1/2 w-1/2" />
      )}
    </span>
  );
}



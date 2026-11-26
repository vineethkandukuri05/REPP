import React, { useState } from 'react';

/** Profile picture (e.g. from Google) with an initials fallback in REPP's lime style. */
export default function UserAvatar({ src, name, className = 'w-8 h-8 rounded-sm text-xs' }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'RE';

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s profile picture` : 'Profile picture'}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} object-cover bg-subtle`}
      />
    );
  }
  return (
    <div className={`${className} bg-brand text-on-brand font-bold flex items-center justify-center `} aria-hidden="true">
      {initials}
    </div>
  );
}

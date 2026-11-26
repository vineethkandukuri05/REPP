import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReppLogo from './ReppLogo';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import { Menu } from './ui/icons';

/** App top bar: page title, one primary action, profile link. Hamburger on small screens. */
export default function Header({ activeTabTitle, onOpenMenu }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const displayName = profile?.name || user?.name || 'Athlete';

  return (
    <header className="bg-page border-b border-line sticky top-0 z-30 px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMenu}
          className="lg:hidden p-2 border border-line rounded-sm text-ink hover:bg-subtle cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="lg:hidden" aria-label="REPP home">
          <ReppLogo size="sm" showTagline={false} />
        </Link>
        <div className="hidden lg:block min-w-0">
          <h1 className="text-lg font-bold text-ink truncate">{activeTabTitle || 'Dashboard'}</h1>
          <p className="text-xs text-muted">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/scan-meal')}
          className="hidden sm:inline-block px-4 py-2 bg-brand hover:bg-brand-hover text-on-brand text-sm font-bold rounded-sm cursor-pointer"
        >
          Log a meal
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 p-1 pr-2 border border-line rounded-sm hover:bg-subtle cursor-pointer"
          aria-label="Profile and settings"
        >
          <UserAvatar src={user?.avatarUrl} name={displayName} className="w-7 h-7 rounded-sm text-xs" />
          <span className="hidden md:inline text-sm text-ink">{displayName.split(' ')[0]}</span>
        </button>
      </div>
    </header>
  );
}

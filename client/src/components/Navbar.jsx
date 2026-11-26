import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import ReppLogo from './ReppLogo';
import UserAvatar from './UserAvatar';
import { useAuth } from '../context/AuthContext';
import { useMeasurementReminder } from '../hooks/useMeasurementReminder';
import { X } from './ui/icons';

/**
 * App navigation. Desktop: fixed left sidebar. Mobile/tablet: the same menu as a
 * slide-over drawer, opened from the hamburger button in the top bar.
 */
export default function Navbar({ mobileOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, logout } = useAuth();
  const { reminder } = useMeasurementReminder();

  const displayName = profile?.name || user?.name || 'Athlete';
  const displayGoal = profile?.primaryGoal || 'Fitness goal';
  const streak = profile?.streakDays || 1;

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/diet', label: 'My Diet' },
    { to: '/workouts', label: 'Workouts' },
    { to: '/scan-meal', label: 'Log & Scan Meal', badge: 'AI' },
    { to: '/bodyvision', label: 'BodyVision', badge: 'AI' },
    { to: '/progress', label: 'Progress', badge: reminder?.due ? 'Due' : null, alert: true },
    { to: '/chat', label: 'Ask REPP', badge: 'Coach' },
    { to: '/adaptive-plan', label: 'Adaptive Plan' },
    { to: '/profile', label: 'Profile & Privacy' }
  ];

  // Close the drawer after navigating.
  useEffect(() => { onClose(); }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close the drawer with Escape.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, onClose]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const content = (
    <>
      <div className="px-6 py-5 border-b border-line">
        <NavLink to="/" aria-label="REPP home">
          <ReppLogo size="sm" showTagline={false} />
        </NavLink>
      </div>

      <div className="px-6 py-4 border-b border-line">
        <div className="text-xs text-muted">Current streak</div>
        <div className="text-base font-bold text-ink">{streak} day{streak === 1 ? '' : 's'}</div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3" aria-label="Main">
        <ul>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to || (item.to === '/scan-meal' && location.pathname === '/log-text');
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center justify-between px-6 py-2.5 text-sm border-l-0 ${
                    isActive ? 'bg-subtle text-ink font-bold' : 'text-body hover:text-ink hover:bg-subtle'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-sm border ${
                        item.alert ? 'border-warning text-warning' : 'border-line-strong text-muted'
                      }`}
                      title={item.alert ? 'Weekly measurement check-in is due' : undefined}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-line px-6 py-4 space-y-3">
        <NavLink to="/profile" className="flex items-center gap-3 hover:text-ink">
          <UserAvatar src={user?.avatarUrl} name={displayName} className="w-8 h-8 rounded-sm text-xs" />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink truncate">{displayName}</span>
            <span className="block text-xs text-muted truncate">{displayGoal}</span>
          </span>
        </NavLink>
        <div className="flex items-center gap-4 text-sm">
          <NavLink to="/" className="text-body hover:text-ink underline-offset-4 hover:underline">Landing page</NavLink>
          <button onClick={handleLogout} className="text-danger hover:underline underline-offset-4 cursor-pointer">Log out</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-surface border-r border-line h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile / tablet drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink/50 cursor-default" aria-label="Close menu" onClick={onClose} />
          <aside className="relative flex flex-col w-72 max-w-[85vw] h-full bg-surface border-r border-line">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-body hover:text-ink border border-line rounded-sm cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

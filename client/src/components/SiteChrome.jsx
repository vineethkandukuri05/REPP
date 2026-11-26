/**
 * Header and footer for the public pages (landing, login, terms, privacy).
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReppLogo from './ReppLogo';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from './ui/icons';

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How it works' },
    { href: '/#privacy', label: 'Privacy and safety' }
  ];

  return (
    <header className="bg-page border-b border-line">
      <div className="max-w-[1140px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to="/" aria-label="REPP home"><ReppLogo size="sm" showTagline={false} /></Link>

        <nav className="hidden md:flex items-center gap-8 text-sm" aria-label="Site">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-body hover:text-ink hover:underline underline-offset-4">{l.label}</a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {!user && <Link to="/login" className="text-sm text-body hover:text-ink hover:underline underline-offset-4">Log in</Link>}
          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="px-6 py-3 bg-brand hover:bg-brand-hover text-on-brand text-sm font-bold rounded-sm cursor-pointer"
          >
            {user ? 'Open dashboard' : 'Create an account'}
          </button>
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden p-2 border border-line rounded-sm text-ink cursor-pointer"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <nav className="md:hidden border-t border-line bg-page px-6 py-4 space-y-3" aria-label="Site">
          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-body hover:text-ink">{l.label}</a>
          ))}
          {!user && <Link to="/login" className="block text-body hover:text-ink">Log in</Link>}
          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="w-full px-6 py-3 bg-brand hover:bg-brand-hover text-on-brand text-sm font-bold rounded-sm cursor-pointer"
          >
            {user ? 'Open dashboard' : 'Create an account'}
          </button>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter({ compact = false }) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="border-t border-line bg-page">
        <div className="max-w-[1140px] mx-auto px-6 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted">
          <span>© {year} REPP. All rights reserved.</span>
          <nav className="flex gap-6" aria-label="Legal">
            <Link to="/terms" className="hover:text-ink hover:underline underline-offset-4">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-ink hover:underline underline-offset-4">Privacy Policy</Link>
          </nav>
        </div>
      </footer>
    );
  }

  const columns = [
    {
      title: 'Product',
      links: [
        { href: '/#features', label: 'Features' },
        { href: '/#how-it-works', label: 'How it works' },
        { to: '/login', label: 'Log in' },
        { to: '/login', label: 'Create an account' }
      ]
    },
    {
      title: 'Company',
      links: [
        { href: '/#privacy', label: 'Privacy and safety' },
        // TODO: replace with your real support email address.
        { href: 'mailto:support@example.com', label: 'Contact (add email)' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { href: '/#how-it-works', label: 'Getting started' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { to: '/terms', label: 'Terms of Service' },
        { to: '/privacy', label: 'Privacy Policy' }
      ]
    }
  ];

  return (
    <footer className="border-t border-line bg-page">
      <div className="max-w-[1140px] mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-12 gap-8">
        <div className="col-span-2 md:col-span-4 space-y-3">
          <ReppLogo size="sm" showTagline={false} />
          <p className="text-sm text-body max-w-xs">
            Workout, nutrition and progress tracking with a personal coach that adapts to your logged data.
          </p>
        </div>
        {columns.map(col => (
          <div key={col.title} className="md:col-span-2">
            <h2 className="text-sm font-bold text-ink mb-3">{col.title}</h2>
            <ul className="space-y-2 text-sm">
              {col.links.map(l => (
                <li key={l.label}>
                  {l.to
                    ? <Link to={l.to} className="text-body hover:text-ink hover:underline underline-offset-4">{l.label}</Link>
                    : <a href={l.href} className="text-body hover:text-ink hover:underline underline-offset-4">{l.label}</a>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="max-w-[1140px] mx-auto px-6 py-6 text-xs text-muted flex flex-col sm:flex-row justify-between gap-2">
          <span>© {year} REPP. All rights reserved.</span>
          <span>REPP gives general fitness and nutrition guidance. It is not medical advice.</span>
        </div>
      </div>
    </footer>
  );
}

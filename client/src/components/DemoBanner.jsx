import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Shown on every page while signed into the shared "Try the demo" account. */
export default function DemoBanner() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user?.isDemo) return null;

  const createAccount = async () => {
    await logout();
    navigate('/login', { state: { signup: true } });
  };

  return (
    <div className="bg-subtle border-b border-line-strong px-4 sm:px-6 lg:px-10 py-3" role="status">
      <div className="max-w-[1140px] mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <p className="flex-1 text-sm text-body">
          <span className="font-bold text-ink">You're using the demo account.</span>{' '}
          Feel free to try anything. The data resets every day and is shared with other visitors.
        </p>
        <button
          type="button"
          onClick={createAccount}
          className="self-start sm:self-auto px-4 py-2 bg-brand hover:bg-brand-hover text-on-brand font-bold text-sm rounded-sm cursor-pointer whitespace-nowrap"
        >
          Create your own account
        </button>
      </div>
    </div>
  );
}

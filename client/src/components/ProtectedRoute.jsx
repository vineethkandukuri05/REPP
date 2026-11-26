import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SkeletonBlock, SkeletonPage } from './ui/States';

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Skeleton of the app layout while the session is checked.
    return (
      <div className="min-h-screen bg-page flex" role="status" aria-live="polite">
        <span className="sr-only">Loading your account</span>
        <div className="hidden lg:block w-64 border-r border-line bg-surface p-6 space-y-4" aria-hidden="true">
          <SkeletonBlock className="h-6 w-24" />
          {Array.from({ length: 9 }).map((_, i) => <SkeletonBlock key={i} className="h-4 w-36" />)}
        </div>
        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-10 max-w-[1140px] mx-auto w-full">
          <SkeletonPage />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is logged in but hasn't completed onboarding, redirect to onboarding
  if (requireOnboarding && (!profile || !profile.isOnboarded)) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

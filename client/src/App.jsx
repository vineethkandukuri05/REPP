import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

import Navbar from './components/Navbar';
import Header from './components/Header';
import DemoBanner from './components/DemoBanner';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { SiteFooter } from './components/SiteChrome';
import { useAuth } from './context/AuthContext';

import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import DietPlannerView from './views/DietPlannerView';
import WorkoutGeneratorView from './views/WorkoutGeneratorView';
import LogMealView from './views/LogMealView';
import BodyVisionView from './views/BodyVisionView';
import ProgressTrackingView from './views/ProgressTrackingView';
import AskReppView from './views/AskReppView';
import AdaptivePlanView from './views/AdaptivePlanView';
import ProfilePrivacyView from './views/ProfilePrivacyView';
import LegalPage from './views/LegalPage';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/diet': 'Diet Planner',
  '/workouts': 'Workouts',
  '/scan-meal': 'Log & Scan Meal',
  '/log-text': 'Log & Scan Meal',
  '/bodyvision': 'BodyVision',
  '/progress': 'Progress',
  '/chat': 'Ask REPP: AI coach',
  '/adaptive-plan': 'Adaptive weekly plan',
  '/profile': 'Profile and privacy'
};

function AppLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  return (
    <div className="flex min-h-screen bg-page">
      <Navbar mobileOpen={menuOpen} onClose={closeMenu} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeTabTitle={routeTitles[location.pathname]} onOpenMenu={() => setMenuOpen(true)} />
        <DemoBanner />
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8 lg:py-10 max-w-[1140px] mx-auto w-full">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
        <SiteFooter compact />
      </div>
    </div>
  );
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-page text-body">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route
          path="/onboarding"
          element={<ProtectedRoute requireOnboarding={false}><OnboardingView /></ProtectedRoute>}
        />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/diet" element={<DietPlannerView />} />
          <Route path="/workouts" element={<WorkoutGeneratorView />} />
          <Route path="/scan-meal" element={<LogMealView />} />
          <Route path="/log-text" element={<LogMealView />} />
          <Route path="/bodyvision" element={<BodyVisionView />} />
          <Route path="/progress" element={<ProgressTrackingView />} />
          <Route path="/chat" element={<AskReppView />} />
          <Route path="/adaptive-plan" element={<AdaptivePlanView />} />
          <Route path="/profile" element={<ProfilePrivacyView />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

import React, { useState } from 'react';
import {
  initialUserProfile,
  sampleMealPlan,
  sampleWorkoutPlan,
  sampleBodyVisionReports,
  sampleGroceryList,
  sampleAdaptivePlan,
  sampleBadges,
  sampleChatHistory
} from './data/initialData';

import Navbar from './components/Navbar';
import Header from './components/Header';
import GamificationBadges from './components/GamificationBadges';

import LandingPage from './views/LandingPage';
import OnboardingView from './views/OnboardingView';
import DashboardView from './views/DashboardView';
import DietPlannerView from './views/DietPlannerView';
import WorkoutGeneratorView from './views/WorkoutGeneratorView';
import LogMealView from './views/LogMealView';
import BodyVisionView from './views/BodyVisionView';
import ProgressTrackingView from './views/ProgressTrackingView';
import AskReppView from './views/AskReppView';
import AdaptivePlanView from './views/AdaptivePlanView';
import GroceryPlannerView from './views/GroceryPlannerView';
import ProfilePrivacyView from './views/ProfilePrivacyView';

export default function App() {
  const [activeTab, setActiveTab] = useState('landing');
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const [meals, setMeals] = useState(sampleMealPlan);
  const [workoutPlan, setWorkoutPlan] = useState(sampleWorkoutPlan);
  const [reports, setReports] = useState(sampleBodyVisionReports);
  const [groceryItems, setGroceryItems] = useState(sampleGroceryList);
  const [adaptivePlan, setAdaptivePlan] = useState(sampleAdaptivePlan);
  const [badges, setBadges] = useState(sampleBadges);
  const [chatHistory, setChatHistory] = useState(sampleChatHistory);

  // Meal Handlers
  const handleToggleMeal = (mealId) => {
    setMeals(meals.map(m => {
      if (m.id === mealId) {
        const nextState = !m.isCompleted;
        const calorieDelta = nextState ? m.calories : -m.calories;
        const proteinDelta = nextState ? m.protein : -m.protein;
        setUserProfile(prev => ({
          ...prev,
          caloriesConsumed: Math.max(0, prev.caloriesConsumed + calorieDelta),
          proteinConsumed: Math.max(0, prev.proteinConsumed + proteinDelta)
        }));
        return { ...m, isCompleted: nextState };
      }
      return m;
    }));
  };

  const handleUpdateMeal = (mealId, newMealData) => {
    setMeals(meals.map(m => m.id === mealId ? { ...m, ...newMealData } : m));
  };

  const handleAddLoggedMeal = (newMeal) => {
    setMeals([newMeal, ...meals]);
    setUserProfile(prev => ({
      ...prev,
      caloriesConsumed: prev.caloriesConsumed + newMeal.calories,
      proteinConsumed: prev.proteinConsumed + newMeal.protein
    }));
  };

  const handleUpdateWater = (newAmount) => {
    setUserProfile(prev => ({ ...prev, waterIntake: newAmount }));
  };

  // Workout Handlers
  const handleCompleteWorkout = () => {
    setWorkoutPlan(prev => ({ ...prev, isCompletedToday: true }));
    setUserProfile(prev => ({
      ...prev,
      streakDays: prev.streakDays + 1,
      totalWorkoutsCompleted: prev.totalWorkoutsCompleted + 1
    }));
    alert("Workout Session Saved! +1 Day added to your REPP Streak 🔥");
  };

  // Grocery Handlers
  const handleToggleGroceryItem = (id) => {
    setGroceryItems(groceryItems.map(item => item.id === id ? { ...item, isBought: !item.isBought } : item));
  };

  const handleAddGroceryItem = (newItem) => {
    setGroceryItems([newItem, ...groceryItems]);
  };

  const handleDeleteGroceryItem = (id) => {
    setGroceryItems(groceryItems.filter(item => item.id !== id));
  };

  const handleRegenerateGroceryList = () => {
    setGroceryItems(sampleGroceryList.map(i => ({ ...i, isBought: false })));
    alert("Grocery list regenerated based on current AI meal plan!");
  };

  // Onboarding & Profile Handlers
  const handleCompleteOnboarding = (formData) => {
    setUserProfile({ ...formData, isOnboarded: true });
    setActiveTab('dashboard');
  };

  const handleUpdateProfile = (formData) => {
    setUserProfile(formData);
  };

  // Adaptive Plan Handler
  const handleApplyAdaptivePlan = () => {
    setUserProfile(prev => ({
      ...prev,
      dailyCalorieTarget: 2150
    }));
    alert("Week 5 Adaptive Plan Applied! Calorie target updated to 2,150 kcal.");
  };

  // Map view titles for Header
  const tabTitles = {
    dashboard: 'Dashboard',
    diet: 'AI Diet Planner',
    workouts: 'AI Workout Generator',
    'scan-meal': 'Log & Scan Meal',
    bodyvision: 'REPP BodyVision™',
    progress: 'Progress Tracking',
    chat: 'Ask REPP — AI Fitness Coach',
    grocery: 'Smart Grocery Planner',
    'adaptive-plan': 'Adaptive Weekly Plan',
    profile: 'Profile & Privacy Center'
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F8FAFC]">
      {/* 1. LANDING PAGE VIEW */}
      {activeTab === 'landing' && (
        <LandingPage
          onStartJourney={() => setActiveTab('onboarding')}
          onExploreApp={() => setActiveTab('dashboard')}
        />
      )}

      {/* 2. ONBOARDING VIEW */}
      {activeTab === 'onboarding' && (
        <OnboardingView
          userProfile={userProfile}
          onCompleteOnboarding={handleCompleteOnboarding}
          onCancel={() => setActiveTab('landing')}
        />
      )}

      {/* 3. MAIN DASHBOARD APP LAYOUT */}
      {activeTab !== 'landing' && activeTab !== 'onboarding' && (
        <div className="flex min-h-screen bg-[#090A0F]">
          {/* Desktop Sidebar & Mobile Bottom Navbar */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userProfile={userProfile}
          />

          {/* Main App Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Header */}
            <Header
              userProfile={userProfile}
              setActiveTab={setActiveTab}
              activeTabTitle={tabTitles[activeTab]}
            />

            {/* Page View Container */}
            <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <DashboardView
                    userProfile={userProfile}
                    meals={meals}
                    workoutPlan={workoutPlan}
                    setActiveTab={setActiveTab}
                    onUpdateWater={handleUpdateWater}
                    onToggleMeal={handleToggleMeal}
                    onStartWorkout={() => setActiveTab('workouts')}
                  />
                  <GamificationBadges badges={badges} />
                </div>
              )}

              {activeTab === 'diet' && (
                <DietPlannerView
                  userProfile={userProfile}
                  meals={meals}
                  onToggleMeal={handleToggleMeal}
                  onUpdateMeal={handleUpdateMeal}
                />
              )}

              {activeTab === 'workouts' && (
                <WorkoutGeneratorView
                  workoutPlan={workoutPlan}
                  userProfile={userProfile}
                  onCompleteWorkout={handleCompleteWorkout}
                />
              )}

              {(activeTab === 'scan-meal' || activeTab === 'log-text') && (
                <LogMealView
                  meals={meals}
                  onAddLoggedMeal={handleAddLoggedMeal}
                />
              )}

              {activeTab === 'bodyvision' && (
                <BodyVisionView
                  reports={reports}
                  onDeletePhoto={() => alert("All progress photos erased securely from local memory.")}
                />
              )}

              {activeTab === 'progress' && (
                <ProgressTrackingView
                  userProfile={userProfile}
                />
              )}

              {activeTab === 'chat' && (
                <AskReppView
                  userProfile={userProfile}
                  chatHistory={chatHistory}
                  onSendMessage={(msg) => console.log(msg)}
                />
              )}

              {activeTab === 'adaptive-plan' && (
                <AdaptivePlanView
                  planData={adaptivePlan}
                  onApplyPlan={handleApplyAdaptivePlan}
                />
              )}

              {activeTab === 'grocery' && (
                <GroceryPlannerView
                  groceryItems={groceryItems}
                  onToggleItem={handleToggleGroceryItem}
                  onAddItem={handleAddGroceryItem}
                  onDeleteItem={handleDeleteGroceryItem}
                  onRegenerate={handleRegenerateGroceryList}
                />
              )}

              {activeTab === 'profile' && (
                <ProfilePrivacyView
                  userProfile={userProfile}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}

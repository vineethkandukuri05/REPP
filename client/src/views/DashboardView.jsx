import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CalorieRing from '../components/CalorieRing';
import GamificationBadges from '../components/GamificationBadges';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import MeasurementReminder from '../components/MeasurementReminder';
import { useMeasurementReminder } from '../hooks/useMeasurementReminder';
import { Plus } from '../components/ui/icons';
import { SkeletonPage } from '../components/ui/States';

export default function DashboardView() {
  const navigate = useNavigate();
  const { reminder } = useMeasurementReminder();
  const { user, profile, refreshUser, updateLocalProfile } = useAuth();
  const { showToast } = useToast();

  const [meals, setMeals] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [workoutDoneToday, setWorkoutDoneToday] = useState(false);
  // Meals logged on Log & Scan Meal (photo/text), on top of diet-plan meals ticked off here
  const [loggedTotals, setLoggedTotals] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [waterLogged, setWaterLogged] = useState(2500);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [mealsRes, workoutRes, waterRes, badgesRes, summaryRes] = await Promise.allSettled([
        api.get('/diet/active'),
        api.get('/workouts/today'),
        api.get('/water'),
        api.get('/badges'),
        api.get('/meals/summary')
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.breakdown?.fromLogs) {
        setLoggedTotals(summaryRes.value.breakdown.fromLogs);
      }

      if (mealsRes.status === 'fulfilled' && mealsRes.value?.plan) {
        setMeals(mealsRes.value.plan.meals || []);
      }
      if (workoutRes.status === 'fulfilled' && workoutRes.value?.workoutPlan) {
        setWorkoutPlan(workoutRes.value.workoutPlan);
        setWorkoutDoneToday(Boolean(workoutRes.value.completedToday));
      }
      if (waterRes.status === 'fulfilled' && waterRes.value?.waterIntake !== undefined) {
        setWaterLogged(waterRes.value.waterIntake);
      }
      if (badgesRes.status === 'fulfilled' && badgesRes.value?.badges) {
        setBadges(badgesRes.value.badges);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const currentProfile = profile || {};
  const dailyCalorieTarget = currentProfile.dailyCalorieTarget || 2200;
  const proteinTarget = currentProfile.proteinTarget || 150;
  const carbsTarget = currentProfile.carbsTarget || 200;
  const fatsTarget = currentProfile.fatsTarget || 60;
  const waterTarget = currentProfile.waterTarget || 3500;

  // Today's intake: diet-plan meals ticked off here (updates instantly) + meals logged on Log & Scan Meal
  const planEaten = (key) => meals.filter(m => m.isCompleted).reduce((sum, m) => sum + (m[key] || 0), 0);
  const caloriesConsumed = planEaten('calories') + (loggedTotals.calories || 0);
  const proteinConsumed = planEaten('protein') + (loggedTotals.protein || 0);
  const carbsConsumed = planEaten('carbs') + (loggedTotals.carbs || 0);
  const fatsConsumed = planEaten('fats') + (loggedTotals.fats || 0);

  const addWater = async (amount) => {
    const newTotal = waterLogged + amount;
    setWaterLogged(newTotal);
    try {
      await api.post('/water/update', { amountMl: newTotal });
      showToast(`Logged +${amount} ml water!`, 'success');
      if (newTotal >= waterTarget && waterLogged < waterTarget) {
        showToast('Daily water target reached.', 'success');
      }
    } catch {
      showToast('Failed to save water intake', 'error');
    }
  };

  const handleToggleMeal = async (mealId) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;
    const nextState = !meal.isCompleted;

    // Optimistic UI update
    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, isCompleted: nextState } : m));

    try {
      await api.post(`/diet/toggle/${mealId}`, {});
      if (nextState) {
        showToast(`Marked ${meal.name} as completed!`, 'success');
      }
      refreshUser();
    } catch (err) {
      // Revert on error
      setMeals(prev => prev.map(m => m.id === mealId ? { ...m, isCompleted: !nextState } : m));
      showToast(err.message || 'Failed to update meal status', 'error');
    }
  };

  const completedMealsCount = meals.filter(m => m.isCompleted).length;

  if (loading) return <SkeletonPage stats={4} cards={2} label="Loading your dashboard" />;

  return (
    <div className="space-y-6 pb-12">
      <MeasurementReminder reminder={reminder} onAction={() => navigate('/progress')} />

      {/* Top Welcome Banner */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">
            Good day, {currentProfile.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Athlete'}
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            You're on day <strong className="text-ink">{currentProfile.streakDays || 1}</strong> of your <strong className="text-brand">{currentProfile.primaryGoal || 'Fitness'}</strong> program. Keep logging to stay on track.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap gap-2.5 z-10">
          <button
            onClick={() => navigate('/scan-meal')}
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2"
          >
             Scan Food
          </button>
          <button
            onClick={() => navigate('/workouts')}
            className="px-4 py-2.5 bg-subtle hover:bg-subtle-hover border border-line text-ink font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2"
          >
             Today's Gym Split
          </button>
        </div>
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Log a Meal', to: '/diet' },
          { label: 'Scan Food', to: '/scan-meal' },
          { label: 'Start Workout', to: '/workouts' },
          { label: 'Ask REPP', to: '/chat' },
          { label: 'View Diet Plan', to: '/diet' },
          { label: 'View Progress', to: '/progress' }
        ].map((act, index) => (
          <button
            key={index}
            onClick={() => navigate(act.to)}
            className="px-4 py-3 bg-surface hover:bg-subtle border border-line rounded-sm text-left transition-colors duration-150 cursor-pointer"
          >
            <span className="text-sm font-bold text-ink leading-tight">{act.label}</span>
          </button>
        ))}
      </div>

      {/* Main Grid: Calorie Ring & Daily Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: calorie ring, metrics, meals */}
        <div className="space-y-6">
          <CalorieRing
            target={dailyCalorieTarget}
            consumed={caloriesConsumed}
            protein={proteinConsumed}
            proteinTarget={proteinTarget}
            carbs={carbsConsumed}
            carbsTarget={carbsTarget}
            fats={fatsConsumed}
            fatsTarget={fatsTarget}
          />

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Water Tracker Card */}
            <div className="bg-surface border border-line rounded-sm p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span>Water Intake</span>
                
              </div>
              <div className="my-2">
                <div className="text-xl font-bold text-ink">{waterLogged} <span className="text-xs font-normal text-muted">ml</span></div>
                <div className="text-[10px] text-muted">Goal: {waterTarget} ml</div>
              </div>
              <button
                onClick={() => addWater(250)}
                className="w-full py-1.5 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-[11px] font-bold text-data-carbs flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" /> +250 ml
              </button>
            </div>

            {/* Daily Streak Card */}
            <div className="bg-surface border border-line rounded-sm p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span>Active Streak</span>
                
              </div>
              <div className="my-2">
                <div className="text-xl font-bold text-ink">{currentProfile.streakDays || 1} {(currentProfile.streakDays || 1) === 1 ? 'day' : 'days'}</div>
                <div className="text-xs text-muted">Consecutive workout days</div>
              </div>
              <div className="w-full bg-subtle h-1.5 rounded-sm overflow-hidden">
                <div className="bg-warning h-full w-[85%]"></div>
              </div>
            </div>

            {/* Workout Status */}
            <div className="bg-surface border border-line rounded-sm p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span>Workout Split</span>
                
              </div>
              <div className="my-2">
                <div className="text-sm font-bold text-ink truncate">
                  {workoutPlan ? workoutPlan.dayName : 'Upper / Lower Split'}
                </div>
                <div className="text-[10px] text-brand font-bold">
                  {workoutPlan ? `${workoutPlan.duration} Mins` : '45-60 Mins'}
                </div>
              </div>
              {workoutDoneToday ? (
                <button
                  onClick={() => navigate('/workouts')}
                  className="w-full py-1.5 bg-subtle border border-brand text-brand rounded-sm text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  Completed today
                </button>
              ) : (
                <button
                  onClick={() => navigate('/workouts')}
                  className="w-full py-1.5 bg-brand hover:bg-brand-hover text-on-brand rounded-sm text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  Start Gym Session
                </button>
              )}
            </div>

            {/* Sleep Target Card */}
            <div className="bg-surface border border-line rounded-sm p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-muted">
                <span>Sleep Target</span>
                
              </div>
              <div className="my-2">
                <div className="text-xl font-bold text-ink">{currentProfile.sleepDuration || '7.5 hours'}</div>
                <div className="text-[10px] text-data-sleep font-bold">Optimal Recovery</div>
              </div>
              <div className="w-full bg-subtle h-1.5 rounded-sm overflow-hidden">
                <div className="bg-data-sleep h-full w-[90%]"></div>
              </div>
            </div>
          </div>

          {/* Today's Meals Quick Overview */}
          <div className="bg-surface border border-line rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink">Today's Nutrition Timeline</h3>
                <p className="text-xs text-muted">{completedMealsCount} of {meals.length} meals completed</p>
              </div>
              <button
                onClick={() => navigate('/diet')}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                Full Diet Plan 
              </button>
            </div>

            {meals.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted bg-subtle rounded-sm">
                No active meals for today. <button onClick={() => navigate('/diet')} className="text-brand font-bold underline ml-1 cursor-pointer">Generate your diet plan</button>.
              </div>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className={`p-3.5 rounded-sm border flex items-center justify-between transition ${
                      meal.isCompleted ? 'bg-subtle border-line' : 'bg-subtle border-line hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleMeal(meal.id)}
                        className={`w-6 h-6 rounded-sm flex items-center justify-center transition cursor-pointer ${
                          meal.isCompleted ? 'bg-brand text-on-brand' : 'border border-line hover:border-brand'
                        }`}
                      >
                        {meal.isCompleted && null}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${meal.isCompleted ? 'line-through text-muted' : 'text-ink'}`}>
                            {meal.name}
                          </span>
                          <span className="text-[10px] text-muted bg-page px-2 py-0.5 rounded-sm font-mono">{meal.time}</span>
                        </div>
                        <div className="text-[11px] text-muted mt-0.5">{meal.rawVsCooked}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-ink">{meal.calories} kcal</div>
                      <div className="text-[10px] font-bold text-brand">{meal.protein}g Protein</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: tip, workout, badges */}
        <div className="space-y-6">
          {/* Tip card */}
          <div className="bg-surface border border-line-strong rounded-sm p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-subtle text-brand text-xs font-bold border border-line-strong">
                 Tip
              </span>
            </div>

            <h4 className="text-sm font-bold text-ink mb-2">Macro Target Tracking</h4>
            <p className="text-xs text-muted leading-relaxed mb-4">
              You have <strong className="text-ink">{Math.max(0, proteinTarget - proteinConsumed)}g protein</strong> remaining today to hit your target. Keep nutrition on point to accelerate body recomposition.
            </p>

            <button
              onClick={() => navigate('/chat')}
              className="w-full py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
               Ask Coach REPP
            </button>
          </div>

          {/* Today's Workout Card */}
          <div className="bg-surface border border-line rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">Today's Workout Target</h3>
              <span className="text-xs font-bold text-brand bg-subtle px-2 py-0.5 rounded-sm">
                {workoutPlan ? workoutPlan.difficulty : 'Plan'}
              </span>
            </div>

            {workoutPlan ? (
              <>
                <div className="bg-subtle p-4 rounded-sm border border-line space-y-2">
                  <div className="text-sm font-bold text-ink">{workoutPlan.dayName}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(workoutPlan.targetMuscles) ? workoutPlan.targetMuscles : []).map((m, i) => (
                      <span key={i} className="text-[10px] bg-page text-muted px-2 py-0.5 rounded-sm border border-line">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-muted font-semibold mb-1">Key Exercises:</div>
                  {workoutPlan.exercises?.slice(0, 3).map((ex, idx) => (
                    <div key={idx} className="flex justify-between items-center text-ink py-1 border-b border-line">
                      <span>{ex.name}</span>
                      <span className="text-muted font-mono">{ex.sets} x {ex.reps}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/workouts')}
                  className="w-full py-2.5 bg-subtle hover:bg-subtle-hover border border-line text-ink font-bold text-xs rounded-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                   Launch Exercise Guide
                </button>
              </>
            ) : (
              <div className="p-4 bg-subtle rounded-sm text-center text-xs text-muted">
                No workout planned for today yet.
                <button onClick={() => navigate('/workouts')} className="block mx-auto mt-2 text-brand font-bold underline cursor-pointer">
                  Generate Workout
                </button>
              </div>
            )}
          </div>

          {/* Gamification Badges */}
          <GamificationBadges badges={badges} />
        </div>
      </div>
    </div>
  );
}

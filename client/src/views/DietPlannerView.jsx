import React, { useState, useEffect, useCallback } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { X } from '../components/ui/icons';
import { SkeletonRows, ErrorState } from '../components/ui/States';

export default function DietPlannerView() {
  const { profile, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [swappingMealId, setSwappingMealId] = useState(null);
  const [activeRecipeMeal, setActiveRecipeMeal] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);

  const fetchMeals = useCallback(async () => {
    try {
      setLoadError('');
      setLoading(true);
      const res = await api.get('/diet/active');
      if (res && res.plan && res.plan.meals) {
        setMeals(res.plan.meals);
      }
    } catch (err) {
      console.error('Error fetching meals:', err);
      setLoadError(err?.message || 'Could not load your diet plan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      showToast('Generating personalized AI diet plan...', 'info');
      const res = await api.post('/diet/generate', { days: 1 });
      if (res && res.plan && res.plan.meals) {
        setMeals(res.plan.meals);
        showToast('New diet plan successfully generated!', 'success');
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Failed to generate diet plan', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSwapMeal = async (mealId) => {
    setSwappingMealId(mealId);
    try {
      showToast('Finding a high-protein alternative matching your targets...', 'info');
      const res = await api.post(`/diet/swap/${mealId}`, {});
      if (res && res.meal) {
        setMeals(prev => prev.map(m => m.id === mealId ? res.meal : m));
        showToast(`Meal swapped with ${res.meal.name}!`, 'success');
        refreshUser();
      }
    } catch (err) {
      showToast(err.message || 'Failed to swap meal', 'error');
    } finally {
      setSwappingMealId(null);
    }
  };

  const handleToggleMeal = async (mealId) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;
    const nextState = !meal.isCompleted;

    setMeals(prev => prev.map(m => m.id === mealId ? { ...m, isCompleted: nextState } : m));

    try {
      await api.post(`/diet/toggle/${mealId}`, {});
      if (nextState) {
        showToast(`Completed ${meal.name}!`, 'success');
      }
      refreshUser();
    } catch (err) {
      setMeals(prev => prev.map(m => m.id === mealId ? { ...m, isCompleted: !nextState } : m));
      showToast(err.message || 'Failed to toggle meal', 'error');
    }
  };

  const handleSavePortion = () => {
    if (editingMeal) {
      const updated = {
        ...editingMeal,
        calories: Math.round(editingMeal.calories * portionMultiplier),
        protein: Math.round(editingMeal.protein * portionMultiplier),
        carbs: Math.round(editingMeal.carbs * portionMultiplier),
        fats: Math.round(editingMeal.fats * portionMultiplier)
      };
      setMeals(prev => prev.map(m => m.id === editingMeal.id ? updated : m));
      setEditingMeal(null);
      showToast('Portion size updated!', 'success');
    }
  };

  const currentProfile = profile || {};
  const totalCalories = meals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const totalProtein = meals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const totalCarbs = meals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const totalFats = meals.reduce((acc, m) => acc + (m.fats || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">AI Diet & Meal Schedule</h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Customized for <strong className="text-ink">{currentProfile.dietPreference || 'Balanced'}</strong> preferences & <strong className="text-brand">{currentProfile.proteinTarget || 150}g protein target</strong>.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="px-4 py-2.5 bg-brand hover:bg-brand-hover disabled:opacity-50 text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2"
        >
          
          <span>{isRegenerating ? 'Generating with AI...' : 'Regenerate AI Diet Plan'}</span>
        </button>
      </div>

      {/* Target Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded-sm p-4">
          <span className="text-xs text-muted font-bold block mb-1">Calories Target</span>
          <div className="text-xl font-bold text-ink">{totalCalories} / {currentProfile.dailyCalorieTarget || 2200} <span className="text-xs text-muted">kcal</span></div>
        </div>
        <div className="bg-surface border border-line rounded-sm p-4">
          <span className="text-xs text-brand font-bold block mb-1">Protein Target</span>
          <div className="text-xl font-bold text-ink">{totalProtein}g / {currentProfile.proteinTarget || 150}g</div>
        </div>
        <div className="bg-surface border border-line rounded-sm p-4">
          <span className="text-xs text-data-carbs font-bold block mb-1">Carbohydrates</span>
          <div className="text-xl font-bold text-ink">{totalCarbs}g / {currentProfile.carbsTarget || 200}g</div>
        </div>
        <div className="bg-surface border border-line rounded-sm p-4">
          <span className="text-xs text-warning font-bold block mb-1">Fats</span>
          <div className="text-xl font-bold text-ink">{totalFats}g / {currentProfile.fatsTarget || 60}g</div>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Meals List */}
      {loading ? (
        <SkeletonRows rows={4} />
      ) : loadError ? (
        <ErrorState title="Couldn't load your diet plan" message={loadError} onRetry={fetchMeals} />
      ) : meals.length === 0 ? (
        <div className="bg-surface border border-line rounded-sm p-12 text-center space-y-4">
          
          <h3 className="text-lg font-bold text-ink">No meal plan generated yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">Click below to generate your personalized AI meal plan based on your dietary preferences.</p>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-6 py-3 bg-brand text-on-brand font-bold text-xs rounded-sm cursor-pointer"
          >
            Generate Meal Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className={`bg-surface border rounded-sm p-6 transition ${
                meal.isCompleted ? 'border-line opacity-75' : 'border-line hover:border-line-strong'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleMeal(meal.id)}
                    className={`w-7 h-7 rounded-sm flex items-center justify-center transition cursor-pointer ${
                      meal.isCompleted ? 'bg-brand text-on-brand font-bold' : 'border border-line hover:border-brand'
                    }`}
                  >
                    {meal.isCompleted && null}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand uppercase tracking-wider">{meal.category || 'Meal'}</span>
                      <span className="text-[10px] text-muted flex items-center gap-1">
                         {meal.time || '1:00 PM'}
                      </span>
                    </div>
                    <h3 className={`text-base font-bold ${meal.isCompleted ? 'line-through text-muted' : 'text-ink'}`}>
                      {meal.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingMeal(meal); setPortionMultiplier(1.0); }}
                    className="p-2 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-ink text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    
                    <span>Portions</span>
                  </button>
                  <button
                    onClick={() => handleSwapMeal(meal.id)}
                    disabled={swappingMealId === meal.id}
                    className="p-2 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-brand text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    
                    <span>AI Swap</span>
                  </button>
                </div>
              </div>

              {/* Meal Specs & Macros */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    
                    <span>Raw vs Cooked Specification:</span>
                  </div>
                  <p className="text-xs text-muted font-mono">{meal.rawVsCooked || 'Standard portion'}</p>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="text-ink"><span className="text-muted">Calories:</span> {meal.calories} kcal</div>
                  <div className="text-brand"><span className="text-muted">P:</span> {meal.protein}g</div>
                  <div className="text-data-carbs"><span className="text-muted">C:</span> {meal.carbs}g</div>
                  <div className="text-warning"><span className="text-muted">F:</span> {meal.fats}g</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modify Portions Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 max-w-md w-full space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">Modify Portion Size</h3>
              <button onClick={() => setEditingMeal(null)} className="text-muted hover:text-ink cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-muted font-bold">Meal:</span>
              <p className="text-sm font-bold text-ink">{editingMeal.name}</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted">Portion Scaling:</span>
                <span className="text-brand">{Math.round(portionMultiplier * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={portionMultiplier}
                onChange={(e) => setPortionMultiplier(parseFloat(e.target.value))}
                className="w-full accent-brand cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted">
                <span>Half (0.5x)</span>
                <span>Regular (1.0x)</span>
                <span>Double (2.0x)</span>
              </div>
            </div>

            <div className="p-4 bg-subtle rounded-sm grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-muted block">Calories</span>
                <span className="font-bold text-ink">{Math.round(editingMeal.calories * portionMultiplier)}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Protein</span>
                <span className="font-bold text-brand">{Math.round(editingMeal.protein * portionMultiplier)}g</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Carbs</span>
                <span className="font-bold text-data-carbs">{Math.round(editingMeal.carbs * portionMultiplier)}g</span>
              </div>
              <div>
                <span className="text-[10px] text-muted block">Fats</span>
                <span className="font-bold text-warning">{Math.round(editingMeal.fats * portionMultiplier)}g</span>
              </div>
            </div>

            <button
              onClick={handleSavePortion}
              className="w-full py-3 bg-brand text-on-brand font-bold text-xs rounded-sm cursor-pointer"
            >
              Confirm Adjusted Portion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  Utensils,
  CheckCircle2,
  RefreshCw,
  Edit3,
  BookOpen,
  Plus,
  Sparkles,
  Info,
  Clock,
  ChefHat,
  ChevronDown,
  X
} from 'lucide-react';

export default function DietPlannerView({ userProfile, meals, onToggleMeal, onUpdateMeal }) {
  const [activeMeal, setActiveMeal] = useState(null); // For recipe view modal
  const [editingMeal, setEditingMeal] = useState(null); // For portion modification modal
  const [portionMultiplier, setPortionMultiplier] = useState(1.0);

  // Calculate total macros
  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFats = meals.reduce((acc, m) => acc + m.fats, 0);

  const handleSwapMeal = (mealId) => {
    // Simulate AI meal swap with alternative Indian option
    const swaps = {
      m1: { name: "High-Protein Paneer Paratha & Curd", rawVsCooked: "75g Paneer + 50g Wheat Flour + 100g Curd", calories: 490, protein: 32, carbs: 45, fats: 18 },
      m2: { name: "Soya Chunks Biryani & Cucumber Raita", rawVsCooked: "50g Dry Soya Chunks + 60g Brown Rice + 100g Curd", calories: 610, protein: 48, carbs: 68, fats: 12 },
      m3: { name: "Sprouted Moong & Boiled Egg Salad", rawVsCooked: "100g Sprouted Moong + 2 Whole Boiled Eggs", calories: 310, protein: 28, carbs: 22, fats: 12 },
      m4: { name: "Grilled Fish Tikka & Jeera Rice", rawVsCooked: "180g Fish Fillet + 50g Brown Rice", calories: 440, protein: 36, carbs: 48, fats: 10 }
    };

    const newMealData = swaps[mealId];
    if (newMealData && onUpdateMeal) {
      onUpdateMeal(mealId, newMealData);
    }
  };

  const handleSavePortion = () => {
    if (editingMeal && onUpdateMeal) {
      const updated = {
        calories: Math.round(editingMeal.calories * portionMultiplier),
        protein: Math.round(editingMeal.protein * portionMultiplier),
        carbs: Math.round(editingMeal.carbs * portionMultiplier),
        fats: Math.round(editingMeal.fats * portionMultiplier)
      };
      onUpdateMeal(editingMeal.id, updated);
      setEditingMeal(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Adaptive Nutrition Plan
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">AI Diet & Meal Schedule</h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Customized for <strong className="text-white">{userProfile.dietPreference}</strong> preferences & <strong className="text-[#C6FF00]">{userProfile.proteinTarget}g protein target</strong>.
          </p>
        </div>

        <button
          onClick={() => handleSwapMeal('m2')}
          className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Regenerate AI Diet Plan
        </button>
      </div>

      {/* Target Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-[#94A3B8] font-bold block mb-1">Calories Target</span>
          <div className="text-xl font-extrabold text-white">{totalCalories} / {userProfile.dailyCalorieTarget} <span className="text-xs text-[#94A3B8]">kcal</span></div>
        </div>
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-[#C6FF00] font-bold block mb-1">Protein Target</span>
          <div className="text-xl font-extrabold text-white">{totalProtein}g / {userProfile.proteinTarget}g</div>
        </div>
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-cyan-400 font-bold block mb-1">Carbohydrates</span>
          <div className="text-xl font-extrabold text-white">{totalCarbs}g / {userProfile.carbsTarget}g</div>
        </div>
        <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4">
          <span className="text-xs text-amber-400 font-bold block mb-1">Fats</span>
          <div className="text-xl font-extrabold text-white">{totalFats}g / {userProfile.fatsTarget}g</div>
        </div>
      </div>

      {/* Disclaimer */}
      <MedicalDisclaimer compact={true} />

      {/* Raw vs Cooked Banner Notice */}
      <div className="p-4 bg-[#191C28] border border-[#2D3245] rounded-2xl flex items-center gap-3 text-xs text-[#94A3B8]">
        <Info className="w-4 h-4 text-[#C6FF00] shrink-0" />
        <span>
          <strong className="text-white">Raw vs. Cooked Note:</strong> All quantities are weighed dry/raw unless specified cooked (e.g. 150g raw chicken breast yields ~115g cooked meat due to water loss). Nutritional values are estimates.
        </span>
      </div>

      {/* Meal List Cards */}
      <div className="space-y-4">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className={`bg-[#12141D] border rounded-3xl p-6 transition duration-200 ${
              meal.isCompleted ? 'border-[#2D3245] opacity-90' : 'border-[#2D3245] hover:border-[#C6FF00]/50'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#2D3245]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onToggleMeal(meal.id)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition cursor-pointer ${
                    meal.isCompleted ? 'bg-[#C6FF00] text-black font-extrabold' : 'border border-[#2D3245] hover:border-[#C6FF00]'
                  }`}
                >
                  {meal.isCompleted && <CheckCircle2 className="w-5 h-5 text-black" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#C6FF00] uppercase tracking-wider">{meal.category}</span>
                    <span className="text-[10px] text-[#94A3B8] bg-[#191C28] px-2 py-0.5 rounded font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {meal.time}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mt-0.5">{meal.name}</h3>
                </div>
              </div>

              {/* Macros Summary & Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-right">
                  <div className="text-base font-extrabold text-white">{meal.calories} kcal</div>
                  <div className="text-xs font-bold text-[#C6FF00]">{meal.protein}g P • {meal.carbs}g C • {meal.fats}g F</div>
                </div>

                <div className="flex items-center gap-2 border-l border-[#2D3245] pl-3">
                  <button
                    onClick={() => handleSwapMeal(meal.id)}
                    title="Swap Meal Option"
                    className="p-2 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#C6FF00]" /> Swap
                  </button>
                  <button
                    onClick={() => { setEditingMeal(meal); setPortionMultiplier(1.0); }}
                    title="Change Portion Size"
                    className="p-2 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Portion
                  </button>
                  <button
                    onClick={() => setActiveMeal(meal)}
                    title="View Preparation Recipe"
                    className="p-2 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <ChefHat className="w-3.5 h-3.5 text-amber-400" /> Recipe
                  </button>
                </div>
              </div>
            </div>

            {/* Meal Details Body */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase block mb-1">Raw vs Cooked Specification</span>
                <p className="text-xs text-white bg-[#191C28] p-3 rounded-xl border border-[#2D3245]">
                  {meal.rawVsCooked}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase block mb-1">Ingredient Breakdown</span>
                <div className="flex flex-wrap gap-2">
                  {meal.ingredients?.map((ing, i) => (
                    <span key={i} className="text-xs bg-[#191C28] text-white border border-[#2D3245] px-2.5 py-1 rounded-lg">
                      {ing.name} ({ing.qty})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Modal */}
      {activeMeal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 max-w-lg w-full relative">
            <button
              onClick={() => setActiveMeal(null)}
              className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-[#C6FF00] uppercase mb-1">
              <ChefHat className="w-4 h-4" /> Preparation Guide
            </div>
            <h3 className="text-xl font-extrabold text-white mb-4">{activeMeal.name}</h3>
            
            <div className="bg-[#191C28] p-4 rounded-2xl border border-[#2D3245] mb-4 space-y-2">
              <div className="text-xs font-bold text-[#94A3B8]">Instructions:</div>
              <p className="text-xs text-white leading-relaxed">{activeMeal.prepInstructions}</p>
            </div>

            <button
              onClick={() => setActiveMeal(null)}
              className="w-full py-2.5 bg-[#C6FF00] text-black font-extrabold text-xs rounded-xl cursor-pointer"
            >
              Close Recipe
            </button>
          </div>
        </div>
      )}

      {/* Edit Portion Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 max-w-md w-full relative space-y-4">
            <button
              onClick={() => setEditingMeal(null)}
              className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-white">Adjust Portion Size</h3>
            <p className="text-xs text-[#94A3B8]">Scaling portion for {editingMeal.name}</p>

            <div className="flex justify-around bg-[#191C28] p-3 rounded-2xl border border-[#2D3245]">
              {[0.75, 1.0, 1.25, 1.5].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setPortionMultiplier(mult)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    portionMultiplier === mult ? 'bg-[#C6FF00] text-black' : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  {mult * 100}%
                </button>
              ))}
            </div>

            <div className="text-center text-xs text-white font-mono bg-[#191C28] p-3 rounded-xl">
              New Estimate: {Math.round(editingMeal.calories * portionMultiplier)} kcal • {Math.round(editingMeal.protein * portionMultiplier)}g Protein
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingMeal(null)}
                className="w-1/2 py-2.5 bg-[#191C28] text-white text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePortion}
                className="w-1/2 py-2.5 bg-[#C6FF00] text-black text-xs font-extrabold rounded-xl"
              >
                Save Portion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

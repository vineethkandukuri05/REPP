import React, { useState } from 'react';
import CalorieRing from '../components/CalorieRing';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  Utensils,
  Dumbbell,
  Camera,
  Bot,
  TrendingUp,
  Droplet,
  Moon,
  Footprints,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  Flame,
  Award,
  Plus
} from 'lucide-react';

export default function DashboardView({
  userProfile,
  meals,
  workoutPlan,
  setActiveTab,
  onUpdateWater,
  onToggleMeal,
  onStartWorkout
}) {
  const [waterLogged, setWaterLogged] = useState(userProfile.waterIntake || 2750);

  const addWater = (amount) => {
    const newTotal = waterLogged + amount;
    setWaterLogged(newTotal);
    if (onUpdateWater) onUpdateWater(newTotal);
  };

  const completedMealsCount = meals.filter(m => m.isCompleted).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/30 text-[#C6FF00] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> AI Coach System Online
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Good morning, {userProfile.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8] max-w-xl">
            You're on day <strong className="text-white">{userProfile.streakDays || 7}</strong> of your <strong className="text-[#C6FF00]">{userProfile.primaryGoal}</strong> program. Your protein adherence is 94% this week.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex flex-wrap gap-2.5 z-10">
          <button
            onClick={() => setActiveTab('scan-meal')}
            className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
          >
            <Camera className="w-4 h-4" /> Scan Food
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className="px-4 py-2.5 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            <Dumbbell className="w-4 h-4 text-[#C6FF00]" /> Today's Gym Split
          </button>
        </div>
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Log a Meal', icon: Utensils, tab: 'diet', color: 'text-amber-400' },
          { label: 'Scan Food', icon: Camera, tab: 'scan-meal', color: 'text-[#C6FF00]' },
          { label: 'Start Workout', icon: Dumbbell, tab: 'workouts', color: 'text-cyan-400' },
          { label: 'Ask REPP AI', icon: Bot, tab: 'chat', color: 'text-purple-400' },
          { label: 'View Diet Plan', icon: Utensils, tab: 'diet', color: 'text-emerald-400' },
          { label: 'View Progress', icon: TrendingUp, tab: 'progress', color: 'text-rose-400' }
        ].map((act, index) => {
          const Icon = act.icon;
          return (
            <button
              key={index}
              onClick={() => setActiveTab(act.tab)}
              className="p-3.5 bg-[#12141D] hover:bg-[#191C28] border border-[#2D3245] hover:border-[#C6FF00]/40 rounded-2xl flex flex-col items-center justify-center text-center gap-2 transition group cursor-pointer"
            >
              <div className={`p-2 rounded-xl bg-[#191C28] ${act.color} group-hover:scale-110 transition`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">{act.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Calorie Ring & Daily Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Calorie Ring (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <CalorieRing
            target={userProfile.dailyCalorieTarget || 2200}
            consumed={userProfile.caloriesConsumed || 1680}
            protein={userProfile.proteinConsumed || 122}
            proteinTarget={userProfile.proteinTarget || 155}
            carbs={userProfile.carbsConsumed || 165}
            carbsTarget={userProfile.carbsTarget || 220}
            fats={userProfile.fatsConsumed || 48}
            fatsTarget={userProfile.fatsTarget || 60}
          />

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Water Tracker Card */}
            <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8]">
                <span>Water Intake</span>
                <Droplet className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
              </div>
              <div className="my-2">
                <div className="text-xl font-extrabold text-white">{waterLogged} <span className="text-xs font-normal text-[#94A3B8]">ml</span></div>
                <div className="text-[10px] text-[#94A3B8]">Goal: {userProfile.waterTarget || 3500} ml</div>
              </div>
              <button
                onClick={() => addWater(250)}
                className="w-full py-1.5 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] rounded-xl text-[11px] font-bold text-cyan-400 flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" /> +250 ml
              </button>
            </div>

            {/* Steps Card */}
            <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8]">
                <span>Daily Steps</span>
                <Footprints className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="my-2">
                <div className="text-xl font-extrabold text-white">8,420</div>
                <div className="text-[10px] text-[#94A3B8]">Goal: 10,000 steps</div>
              </div>
              <div className="w-full bg-[#191C28] h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[84%]"></div>
              </div>
            </div>

            {/* Workout Status */}
            <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8]">
                <span>Workout Split</span>
                <Dumbbell className="w-4 h-4 text-[#C6FF00]" />
              </div>
              <div className="my-2">
                <div className="text-sm font-extrabold text-white">Day 3: Upper Body</div>
                <div className="text-[10px] text-[#C6FF00] font-bold">55 Mins • Intermediate</div>
              </div>
              <button
                onClick={() => setActiveTab('workouts')}
                className="w-full py-1.5 bg-[#C6FF00] text-black rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer"
              >
                Start Gym Session
              </button>
            </div>

            {/* Sleep Card */}
            <div className="bg-[#12141D] border border-[#2D3245] rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8]">
                <span>Sleep Quality</span>
                <Moon className="w-4 h-4 text-purple-400 fill-purple-400/20" />
              </div>
              <div className="my-2">
                <div className="text-xl font-extrabold text-white">7h 45m</div>
                <div className="text-[10px] text-purple-400 font-bold">92% Rest Efficiency</div>
              </div>
              <div className="w-full bg-[#191C28] h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-400 h-full w-[92%]"></div>
              </div>
            </div>
          </div>

          {/* Today's Meals Quick Overview */}
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Today's Nutrition Timeline</h3>
                <p className="text-xs text-[#94A3B8]">{completedMealsCount} of {meals.length} meals completed</p>
              </div>
              <button
                onClick={() => setActiveTab('diet')}
                className="text-xs font-bold text-[#C6FF00] hover:underline flex items-center gap-1"
              >
                Full Diet Plan <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                    meal.isCompleted ? 'bg-[#191C28]/60 border-[#2D3245]' : 'bg-[#191C28] border-[#2D3245] hover:border-[#C6FF00]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleMeal(meal.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                        meal.isCompleted ? 'bg-[#C6FF00] text-black' : 'border border-[#2D3245] hover:border-[#C6FF00]'
                      }`}
                    >
                      {meal.isCompleted && <CheckCircle2 className="w-4 h-4 text-black" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{meal.name}</span>
                        <span className="text-[10px] text-[#94A3B8] bg-[#090A0F] px-2 py-0.5 rounded-md font-mono">{meal.time}</span>
                      </div>
                      <div className="text-[11px] text-[#94A3B8] mt-0.5">{meal.rawVsCooked}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-white">{meal.calories} kcal</div>
                    <div className="text-[10px] font-bold text-[#C6FF00]">{meal.protein}g Protein</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Recommendations & Weekly Goals */}
        <div className="space-y-6">
          {/* AI Intelligence Card */}
          <div className="bg-[#12141D] border border-[#C6FF00]/30 rounded-3xl p-6 relative overflow-hidden lime-glow">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C6FF00]/10 text-[#C6FF00] text-xs font-extrabold border border-[#C6FF00]/30">
                <Sparkles className="w-3.5 h-3.5" /> REPP Recommendation
              </span>
              <span className="text-[10px] text-[#94A3B8] font-mono">Updated 15m ago</span>
            </div>

            <h4 className="text-sm font-bold text-white mb-2">Adjust Evening Snack Protein</h4>
            <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
              "Alex, you have 33g protein remaining today to hit your 155g target. We recommend adding 25g dry soya chunks or 1 scoop whey to your 5:30 PM snack."
            </p>

            <button
              onClick={() => setActiveTab('chat')}
              className="w-full py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4" /> Ask Coach REPP
            </button>
          </div>

          {/* Today's Workout Card */}
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Today's Workout Target</h3>
              <span className="text-xs font-bold text-[#C6FF00] bg-[#C6FF00]/10 px-2 py-0.5 rounded">Gym Split</span>
            </div>

            <div className="bg-[#191C28] p-4 rounded-2xl border border-[#2D3245] space-y-2">
              <div className="text-sm font-extrabold text-white">{workoutPlan.dayName}</div>
              <div className="flex flex-wrap gap-1.5">
                {workoutPlan.targetMuscles.map((m, i) => (
                  <span key={i} className="text-[10px] bg-[#090A0F] text-[#94A3B8] px-2 py-0.5 rounded border border-[#2D3245]">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-[#94A3B8] font-semibold mb-1">Key Exercises:</div>
              {workoutPlan.exercises.slice(0, 3).map((ex, idx) => (
                <div key={idx} className="flex justify-between items-center text-white py-1 border-b border-[#2D3245]/50">
                  <span>{ex.name}</span>
                  <span className="text-[#94A3B8] font-mono">{ex.sets} x {ex.reps} ({ex.targetWeight})</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('workouts')}
              className="w-full py-2.5 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Dumbbell className="w-4 h-4 text-[#C6FF00]" /> Launch Exercise Guide
            </button>
          </div>

          {/* Weekly Consistency Score */}
          <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#94A3B8] uppercase">Weekly Consistency Score</span>
              <Award className="w-4 h-4 text-[#C6FF00]" />
            </div>
            <div className="text-3xl font-black text-white mb-2">
              {userProfile.weeklyConsistencyScore || 92}%
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Based on meal logging, workout completion, and sleep targets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

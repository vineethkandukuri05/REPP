import React, { useState } from 'react';
import ReppLogo from '../components/ReppLogo';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  User,
  Activity,
  Target,
  Utensils,
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function OnboardingView({ userProfile, onCompleteOnboarding, onCancel }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ ...userProfile });

  // Indian food choices toggle list
  const indianFoodOptions = [
    "Roti / Chapati", "Dosa / Idli", "Paneer", "Soya Chunks", "Eggs", "Chicken Breast",
    "Yellow Dal / Rajma", "White / Brown Rice", "Curd / Yogurt", "Oats", "Whey Protein",
    "Fish / Sea Food", "Almonds & Nuts", "Bananas", "Fresh Vegetables"
  ];

  const handleFoodToggle = (item) => {
    const current = formData.availableFoods || [];
    if (current.includes(item)) {
      setFormData({ ...formData, availableFoods: current.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, availableFoods: [...current, item] });
    }
  };

  const handleGoalSelect = (goal) => {
    setFormData({ ...formData, primaryGoal: goal });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCompleteOnboarding(formData);
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F8FAFC] py-8 px-4 flex flex-col items-center justify-center">
      {/* Top Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <ReppLogo size="md" showTagline={true} />
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-[#94A3B8] hover:text-white transition"
        >
          Exit Onboarding
        </button>
      </div>

      {/* Progress Bar Header */}
      <div className="w-full max-w-3xl bg-[#12141D] border border-[#2D3245] rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8] mb-2">
          <span>Step {step} of 5</span>
          <span className="text-[#C6FF00]">
            {step === 1 && "1. Personal Metrics"}
            {step === 2 && "2. Health & Lifestyle"}
            {step === 3 && "3. Fitness Goals"}
            {step === 4 && "4. Food & Nutrition"}
            {step === 5 && "5. Workout Preferences"}
          </span>
        </div>
        <div className="w-full bg-[#191C28] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#C6FF00] h-full transition-all duration-500"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Card */}
      <div className="w-full max-w-3xl bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-10 shadow-2xl relative">
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Personal Information</h2>
                <p className="text-xs text-[#94A3B8]">Tell us about your physical baseline for precise metabolic calculation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Biological Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Fitness Experience Level</label>
                <select
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                >
                  <option value="Beginner">Beginner (&lt; 6 months)</option>
                  <option value="Intermediate">Intermediate (1-3 years)</option>
                  <option value="Advanced">Advanced (3+ years)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-[#2D3245] pt-4">
              <h4 className="text-xs font-bold text-[#E2E8F0] mb-3 uppercase tracking-wider">Optional Body Measurements</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    value={formData.waist}
                    onChange={(e) => setFormData({ ...formData, waist: Number(e.target.value) })}
                    className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    value={formData.chest}
                    onChange={(e) => setFormData({ ...formData, chest: Number(e.target.value) })}
                    className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#94A3B8] mb-1">Arms (cm)</label>
                  <input
                    type="number"
                    value={formData.arms}
                    onChange={(e) => setFormData({ ...formData, arms: Number(e.target.value) })}
                    className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Health & Lifestyle */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Health & Lifestyle</h2>
                <p className="text-xs text-[#94A3B8]">Help REPP adapt workouts for safety and calculate recovery requirements.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Injuries or Physical Limitations</label>
                <input
                  type="text"
                  placeholder="e.g. Lower back stiffness, wrist pain, knee injury"
                  value={formData.injuries ? formData.injuries.join(', ') : ''}
                  onChange={(e) => setFormData({ ...formData, injuries: e.target.value.split(',') })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Daily Activity Level</label>
                  <select
                    value={formData.activityLevel}
                    onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                    className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                  >
                    <option value="Sedentary (Desk Job)">Sedentary (Desk Job)</option>
                    <option value="Lightly Active">Lightly Active (1-2 days walk/exercise)</option>
                    <option value="Moderately Active (3-4 days exercise)">Moderately Active (3-4 days workout)</option>
                    <option value="Very Active (5+ days intense workout)">Very Active (5+ days heavy workout)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Average Sleep Duration</label>
                  <select
                    value={formData.sleepDuration}
                    onChange={(e) => setFormData({ ...formData, sleepDuration: e.target.value })}
                    className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                  >
                    <option value="Less than 6 hours">Less than 6 hours</option>
                    <option value="6 - 7 hours">6 - 7 hours</option>
                    <option value="7.5 hours">7.5 - 8 hours (Optimal)</option>
                    <option value="More than 8 hours">More than 8 hours</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Daily Water Target (ml)</label>
                  <input
                    type="number"
                    value={formData.waterTarget}
                    onChange={(e) => setFormData({ ...formData, waterTarget: Number(e.target.value) })}
                    className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Daily Stress Level</label>
                  <select
                    value={formData.stressLevel}
                    onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
                    className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                  >
                    <option value="Low">Low Stress</option>
                    <option value="Moderate">Moderate Stress</option>
                    <option value="High">High Stress</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Fitness Goals */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Select Your Primary Fitness Goal</h2>
                <p className="text-xs text-[#94A3B8]">REPP will tune calorie deficits, protein ratios, and volume accordingly.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: "Body Recomposition", desc: "Build muscle while losing fat simultaneously.", badge: "Recommended" },
                { title: "Fat Loss", desc: "Maximize calorie deficit while preserving muscle mass." },
                { title: "Muscle Gain", desc: "Controlled calorie surplus for hypertrophy." },
                { title: "Strength Improvement", desc: "Focus on heavy compound lifts and neuromuscular adaptation." },
                { title: "General Fitness", desc: "Cardiovascular health, mobility, and overall stamina." },
                { title: "Healthy Habits & Consistency", desc: "Build sustainable daily workout and nutrition habits." }
              ].map((g, idx) => {
                const isSelected = formData.primaryGoal === g.title;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleGoalSelect(g.title)}
                    className={`p-5 rounded-2xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? 'bg-[#191C28] border-[#C6FF00] lime-border-glow'
                        : 'bg-[#191C28]/60 border-[#2D3245] hover:border-[#94A3B8]'
                    }`}
                  >
                    {g.badge && (
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold bg-[#C6FF00] text-black px-2 py-0.5 rounded-full uppercase">
                        {g.badge}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white mb-1">{g.title}</h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">{g.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Food & Nutrition Preferences */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Food & Dietary Preferences</h2>
                <p className="text-xs text-[#94A3B8]">Select available foods and budget so REPP designs realistic Indian meal plans.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Diet Type</label>
                <select
                  value={formData.dietPreference}
                  onChange={(e) => setFormData({ ...formData, dietPreference: e.target.value })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
                >
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Eggitarian">Eggitarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Daily Budget (₹ INR)</label>
                <input
                  type="number"
                  value={formData.dailyBudget}
                  onChange={(e) => setFormData({ ...formData, dailyBudget: Number(e.target.value) })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Meals Per Day</label>
                <select
                  value={formData.mealsPerDay}
                  onChange={(e) => setFormData({ ...formData, mealsPerDay: Number(e.target.value) })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C6FF00]"
                >
                  <option value={3}>3 Meals</option>
                  <option value={4}>4 Meals (Recommended)</option>
                  <option value={5}>5 Small Meals</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#E2E8F0] mb-2">Select Foods & Staple Ingredients Available to You</label>
              <div className="flex flex-wrap gap-2">
                {indianFoodOptions.map((item, idx) => {
                  const isChecked = formData.availableFoods?.includes(item);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleFoodToggle(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[#C6FF00] text-black font-extrabold'
                          : 'bg-[#191C28] text-[#94A3B8] border border-[#2D3245] hover:text-white'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Workout Preferences & Final Action */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Workout & Equipment Preferences</h2>
                <p className="text-xs text-[#94A3B8]">Choose your workout location and schedule.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Workout Location</label>
                <select
                  value={formData.workoutLocation}
                  onChange={(e) => setFormData({ ...formData, workoutLocation: e.target.value })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                >
                  <option value="Gym Workouts">Gym Workouts (Full Machines & Dumbbells)</option>
                  <option value="Home Workouts">Home Workouts (Dumbbells / Resistance Bands)</option>
                  <option value="Bodyweight Only">Bodyweight / Calisthenics Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">Workout Days / Week</label>
                <select
                  value={formData.workoutDaysPerWeek}
                  onChange={(e) => setFormData({ ...formData, workoutDaysPerWeek: Number(e.target.value) })}
                  className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C6FF00]"
                >
                  <option value={3}>3 Days (Full Body)</option>
                  <option value={4}>4 Days (Upper / Lower Split)</option>
                  <option value={5}>5 Days (Push / Pull / Legs Split)</option>
                  <option value={6}>6 Days (PPL x2 Split)</option>
                </select>
              </div>
            </div>

            {/* Medical Disclaimer Notice */}
            <MedicalDisclaimer />
          </div>
        )}

        {/* Step Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t border-[#2D3245] mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : <div></div>}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-8 py-3.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-black text-sm rounded-xl flex items-center gap-2 cursor-pointer shadow-xl lime-glow"
            >
              <Sparkles className="w-4 h-4" /> Generate My REPP Plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

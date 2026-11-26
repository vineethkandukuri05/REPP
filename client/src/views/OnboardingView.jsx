import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReppLogo from '../components/ReppLogo';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { ChevronLeft } from '../components/ui/icons';

export default function OnboardingView({ onCompleteOnboarding, onCancel }) {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    sex: 'Male',
    age: 25,
    height: 175,
    weight: 70,
    targetWeight: 68,
    experienceLevel: 'Intermediate',
    waist: 80,
    chest: 95,
    arms: 35,

    // Health & Lifestyle
    injuries: [],
    injuriesText: '',
    activityLevel: 'Moderately Active (3-4 days exercise)',
    sleepDuration: '7.5 hours',
    waterTarget: 3000,
    stressLevel: 'Moderate',

    // Fitness Goals
    primaryGoal: 'Body Recomposition',

    // Food & Nutrition
    dietPreference: 'Non-Vegetarian',
    dailyBudget: 450,
    mealsPerDay: 4,
    availableFoods: [
      'Roti / Chapati', 'Paneer', 'Eggs', 'Chicken Breast', 'Yellow Dal / Rajma',
      'White / Brown Rice', 'Curd / Yogurt', 'Oats', 'Fresh Vegetables'
    ],
    foodAllergiesText: '',
    dislikedFoodsText: '',

    // Workout Preferences
    workoutLocation: 'Gym Workouts',
    workoutDaysPerWeek: 4,
    workoutDuration: 60,
  });

  const indianFoodOptions = [
    'Roti / Chapati', 'Dosa / Idli', 'Paneer', 'Soya Chunks', 'Eggs', 'Chicken Breast',
    'Yellow Dal / Rajma', 'White / Brown Rice', 'Curd / Yogurt', 'Oats', 'Whey Protein',
    'Fish / Sea Food', 'Almonds & Nuts', 'Bananas', 'Fresh Vegetables'
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

  // Number inputs keep the raw text while typing (so a field can be cleared without
  // snapping to 0); values are checked here and converted to numbers on submit.
  const NUMBER_RULES = {
    1: [
      { key: 'age', label: 'age', min: 12, max: 100, unit: 'years' },
      { key: 'height', label: 'height', min: 100, max: 250, unit: 'cm' },
      { key: 'weight', label: 'current weight', min: 30, max: 300, unit: 'kg' },
      { key: 'targetWeight', label: 'target weight', min: 30, max: 300, unit: 'kg' },
      { key: 'waist', label: 'waist', min: 40, max: 200, unit: 'cm', optional: true },
      { key: 'chest', label: 'chest', min: 50, max: 200, unit: 'cm', optional: true },
      { key: 'arms', label: 'arm', min: 15, max: 70, unit: 'cm', optional: true }
    ],
    2: [{ key: 'waterTarget', label: 'daily water target', min: 1000, max: 8000, unit: 'ml' }],
    4: [{ key: 'dailyBudget', label: 'daily budget', min: 50, max: 10000, unit: '₹' }]
  };

  const isBlank = (v) => v === '' || v === null || v === undefined;

  const validateStep = (stepToCheck = step) => {
    if (stepToCheck === 1 && !formData.name?.trim()) {
      showToast('Please enter your full name', 'error');
      return false;
    }
    for (const r of NUMBER_RULES[stepToCheck] || []) {
      const raw = formData[r.key];
      if (isBlank(raw)) {
        if (r.optional) continue;
        showToast(`Please enter your ${r.label}`, 'error');
        return false;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < r.min || n > r.max) {
        showToast(`Please enter a valid ${r.label} between ${r.min} and ${r.max} ${r.unit}`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    // Re-check every step, in case an earlier field was cleared after moving on.
    for (const st of [1, 2, 3, 4, 5]) {
      if (!validateStep(st)) {
        setStep(st);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmittingStatus('Calculating metabolic targets (BMR & TDEE)...');

    try {
      const numbers = {};
      for (const rules of Object.values(NUMBER_RULES)) {
        for (const r of rules) {
          if (!isBlank(formData[r.key])) numbers[r.key] = Number(formData[r.key]);
        }
      }
      const payload = {
        ...formData,
        ...numbers,
        injuries: formData.injuriesText ? formData.injuriesText.split(',').map(s => s.trim()).filter(Boolean) : [],
        foodAllergies: formData.foodAllergiesText ? formData.foodAllergiesText.split(',').map(s => s.trim()).filter(Boolean) : [],
        dislikedFoods: formData.dislikedFoodsText ? formData.dislikedFoodsText.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      // Leave out optional measurements that were left blank.
      for (const rules of Object.values(NUMBER_RULES)) {
        for (const r of rules) if (isBlank(formData[r.key])) delete payload[r.key];
      }

      // 1. Complete onboarding in database
      await api.post('/profile/onboarding', payload);

      // 2. Generate initial diet plan
      setSubmittingStatus('Generating initial personalized diet plan...');
      try {
        await api.post('/diet/generate', { days: 1 });
      } catch (err) {
        console.warn('Diet generation note:', err);
      }

      // 3. Generate initial workout plan
      setSubmittingStatus('Generating customized workout split & exercises...');
      try {
        await api.post('/workouts/generate', {});
      } catch (err) {
        console.warn('Workout generation note:', err);
      }

      setSubmittingStatus('Finalizing your fitness profile...');
      await refreshUser();
      showToast('Profile configured! Welcome to your REPP Dashboard.', 'success');

      if (onCompleteOnboarding) {
        onCompleteOnboarding(formData);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.message || 'Failed to complete onboarding. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-page text-ink py-8 px-4 flex flex-col items-center justify-center">
      {/* Top Header */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <ReppLogo size="md" showTagline={true} />
        <button
          onClick={() => {
            if (onCancel) onCancel();
            else navigate('/');
          }}
          className="text-xs font-semibold text-muted hover:text-ink transition cursor-pointer"
        >
          Exit Onboarding
        </button>
      </div>

      {/* Progress Bar Header */}
      <div className="w-full max-w-3xl bg-surface border border-line rounded-sm p-4 mb-6">
        <div className="flex items-center justify-between text-xs font-bold text-muted mb-2">
          <span>Step {step} of 5</span>
          <span className="text-brand">
            {step === 1 && "1. Personal Metrics"}
            {step === 2 && "2. Health & Lifestyle"}
            {step === 3 && "3. Fitness Goals"}
            {step === 4 && "4. Food & Nutrition"}
            {step === 5 && "5. Workout Preferences"}
          </span>
        </div>
        <div className="w-full bg-subtle h-2 rounded-sm overflow-hidden">
          <div
            className="bg-brand h-full transition-colors duration-150"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Card or Loading Screen */}
      <div className="w-full max-w-3xl bg-surface border border-line rounded-sm p-6 sm:p-10 relative">
        {isSubmitting ? (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
            
            <h3 className="text-xl font-bold text-ink">Setting up your plan</h3>
            <p className="text-sm text-muted max-w-md">{submittingStatus}</p>
          </div>
        ) : (
          <>
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-ink">Personal Information</h2>
                    <p className="text-xs text-muted">Tell us about your physical baseline for precise metabolic calculation.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Biological Sex</label>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Current Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.targetWeight}
                      onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Fitness Experience Level</label>
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    >
                      <option value="Beginner">Beginner (&lt; 6 months)</option>
                      <option value="Intermediate">Intermediate (1-3 years)</option>
                      <option value="Advanced">Advanced (3+ years)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-line pt-4">
                  <h4 className="text-xs font-bold text-body mb-3 uppercase tracking-wider">Body Measurements (cm)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Waist (cm)</label>
                      <input
                        type="number"
                        value={formData.waist}
                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                        className="w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Chest (cm)</label>
                      <input
                        type="number"
                        value={formData.chest}
                        onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                        className="w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted mb-1">Arms (cm)</label>
                      <input
                        type="number"
                        value={formData.arms}
                        onChange={(e) => setFormData({ ...formData, arms: e.target.value })}
                        className="w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
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
                  <div>
                    <h2 className="text-xl font-bold text-ink">Health & Lifestyle</h2>
                    <p className="text-xs text-muted">Help REPP adapt workouts for safety and calculate recovery requirements.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Injuries or Physical Limitations</label>
                    <input
                      type="text"
                      placeholder="e.g. Left wrist sensitivity, lower back stiffness, knee pain"
                      value={formData.injuriesText}
                      onChange={(e) => setFormData({ ...formData, injuriesText: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">Daily Activity Level</label>
                      <select
                        value={formData.activityLevel}
                        onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                        className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                      >
                        <option value="Sedentary (Desk Job)">Sedentary (Desk Job)</option>
                        <option value="Lightly Active">Lightly Active (1-2 days walk/exercise)</option>
                        <option value="Moderately Active (3-4 days exercise)">Moderately Active (3-4 days workout)</option>
                        <option value="Very Active (5+ days intense workout)">Very Active (5+ days heavy workout)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">Average Sleep Duration</label>
                      <select
                        value={formData.sleepDuration}
                        onChange={(e) => setFormData({ ...formData, sleepDuration: e.target.value })}
                        className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
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
                      <label className="block text-xs font-bold text-muted mb-1">Daily Water Target (ml)</label>
                      <input
                        type="number"
                        value={formData.waterTarget}
                        onChange={(e) => setFormData({ ...formData, waterTarget: e.target.value })}
                        className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted mb-1">Daily Stress Level</label>
                      <select
                        value={formData.stressLevel}
                        onChange={(e) => setFormData({ ...formData, stressLevel: e.target.value })}
                        className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
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
                  <div>
                    <h2 className="text-xl font-bold text-ink">Select Your Primary Fitness Goal</h2>
                    <p className="text-xs text-muted">REPP will tune calorie deficits, protein ratios, and volume accordingly.</p>
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
                        className={`p-5 rounded-sm border text-left transition relative cursor-pointer ${
                          isSelected
                            ? 'bg-subtle border-brand '
                            : 'bg-subtle border-line hover:border-muted'
                        }`}
                      >
                        {g.badge && (
                          <span className="absolute top-3 right-3 text-[10px] font-bold bg-brand text-on-brand px-2 py-0.5 rounded-sm uppercase">
                            {g.badge}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-ink mb-1">{g.title}</h3>
                        <p className="text-xs text-muted leading-relaxed">{g.desc}</p>
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
                  <div>
                    <h2 className="text-xl font-bold text-ink">Food & Dietary Preferences</h2>
                    <p className="text-xs text-muted">Select available foods and budget so REPP designs realistic Indian meal plans.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Diet Type</label>
                    <select
                      value={formData.dietPreference}
                      onChange={(e) => setFormData({ ...formData, dietPreference: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    >
                      <option value="Non-Vegetarian">Non-Vegetarian</option>
                      <option value="Vegetarian">Vegetarian</option>
                      <option value="Eggitarian">Eggitarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Daily Budget (₹ INR)</label>
                    <input
                      type="number"
                      value={formData.dailyBudget}
                      onChange={(e) => setFormData({ ...formData, dailyBudget: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Meals Per Day</label>
                    <select
                      value={formData.mealsPerDay}
                      onChange={(e) => setFormData({ ...formData, mealsPerDay: Number(e.target.value) })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    >
                      <option value={3}>3 Meals</option>
                      <option value={4}>4 Meals (Recommended)</option>
                      <option value={5}>5 Small Meals</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Food Allergies</label>
                    <input
                      type="text"
                      placeholder="e.g. Shellfish, Peanuts, Lactose"
                      value={formData.foodAllergiesText}
                      onChange={(e) => setFormData({ ...formData, foodAllergiesText: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Disliked Foods</label>
                    <input
                      type="text"
                      placeholder="e.g. Bitter gourd, raw onions"
                      value={formData.dislikedFoodsText}
                      onChange={(e) => setFormData({ ...formData, dislikedFoodsText: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-2.5 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-body mb-2">Select Foods & Staple Ingredients Available to You</label>
                  <div className="flex flex-wrap gap-2">
                    {indianFoodOptions.map((item, idx) => {
                      const isChecked = formData.availableFoods?.includes(item);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFoodToggle(item)}
                          className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-brand text-on-brand font-bold'
                              : 'bg-subtle text-muted border border-line hover:text-ink'
                          }`}
                        >
                          {isChecked && null}
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: Workout Preferences */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-ink">Workout & Equipment Preferences</h2>
                    <p className="text-xs text-muted">Choose your workout location and schedule.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Workout Location</label>
                    <select
                      value={formData.workoutLocation}
                      onChange={(e) => setFormData({ ...formData, workoutLocation: e.target.value })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    >
                      <option value="Gym Workouts">Gym Workouts (Full Machines & Dumbbells)</option>
                      <option value="Home Workouts">Home Workouts (Dumbbells / Resistance Bands)</option>
                      <option value="Bodyweight Only">Bodyweight / Calisthenics Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">Workout Days / Week</label>
                    <select
                      value={formData.workoutDaysPerWeek}
                      onChange={(e) => setFormData({ ...formData, workoutDaysPerWeek: Number(e.target.value) })}
                      className="w-full bg-white border border-line-strong rounded-sm px-4 py-3 text-sm text-ink focus:outline-none focus:border-brand"
                    >
                      <option value={3}>3 Days (Full Body)</option>
                      <option value={4}>4 Days (Upper / Lower Split)</option>
                      <option value={5}>5 Days (Push / Pull / Legs Split)</option>
                      <option value={6}>6 Days (PPL x2 Split)</option>
                    </select>
                  </div>
                </div>

                <MedicalDisclaimer />
              </div>
            )}

            {/* Step Navigation Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-line mt-6">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-5 py-2.5 bg-subtle hover:bg-subtle-hover border border-line text-ink font-bold text-xs rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : <div></div>}

              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm flex items-center gap-2 cursor-pointer"
                >
                  Next Step 
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-8 py-3.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-sm rounded-sm flex items-center gap-2 cursor-pointer"
                >
                   Generate My REPP Plan
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

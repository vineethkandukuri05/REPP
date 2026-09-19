import React from 'react';
import ReppLogo from '../components/ReppLogo';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Utensils,
  Dumbbell,
  Camera,
  Scan,
  Bot,
  Sliders,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Eye,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';

export default function LandingPage({ onStartJourney, onExploreApp }) {
  const features = [
    {
      icon: Utensils,
      title: "AI Diet Planner",
      desc: "Personalized Indian & international meal plans tailored to raw vs cooked specs, budget, allergies, and daily macro targets."
    },
    {
      icon: Dumbbell,
      title: "AI Workout Generator",
      desc: "Adaptive gym & home routines with exercise substitution, rep/set trackers, injury-safe modifications, and PR logs."
    },
    {
      icon: Camera,
      title: "Meal Photo Calorie Scanner",
      desc: "Snap a photo of your food for instant computer vision estimation of ingredients, portions, calories, and macros."
    },
    {
      icon: Scan,
      title: "BodyVision Progress Analysis",
      desc: "Privacy-conscious optical body-fat range estimation, fat distribution tracking, and side-by-side photo comparisons."
    },
    {
      icon: Bot,
      title: "AI Fitness Chat (Ask REPP)",
      desc: "Context-aware conversational fitness coach that remembers your goals, suggests meal swaps, and adjusts missed workouts."
    },
    {
      icon: Sliders,
      title: "Adaptive Weekly Plans",
      desc: "REPP analyzes your weekly energy, missed workouts, and weight trends to auto-tweak next week's calories and split."
    },
    {
      icon: ShoppingBag,
      title: "Smart Grocery Planner",
      desc: "Automated weekly grocery lists categorized by proteins, grains, and produce with realistic INR pricing and budget tracking."
    },
    {
      icon: Activity,
      title: "Natural Language Food Logger",
      desc: "Type '2 rotis, 3 eggs, and 150g chicken' and let REPP parse calories, protein, carbs, and fats instantly."
    }
  ];

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#F8FAFC] font-sans">
      {/* Top Header */}
      <header className="border-b border-[#2D3245]/70 bg-[#090A0F]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <ReppLogo size="md" showTagline={true} />
        
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#94A3B8]">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
          <a href="#privacy" className="hover:text-white transition">Privacy & Safety</a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onExploreApp}
            className="px-4 py-2 text-xs md:text-sm font-bold text-white hover:text-[#C6FF00] transition cursor-pointer"
          >
            Explore Demo
          </button>
          <button
            onClick={onStartJourney}
            className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs md:text-sm rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2"
          >
            <span>Start Your Fitness Journey</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        {/* Background Subtle Lime Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C6FF00]/10 blur-[120px] rounded-full pointer-events-none"></div>

        {/* Badge Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12141D] border border-[#C6FF00]/40 text-[#C6FF00] text-xs font-extrabold mb-8 uppercase tracking-widest shadow-sm">
          <Zap className="w-3.5 h-3.5 fill-[#C6FF00]" />
          <span>Next-Gen Adaptive AI Fitness Coach</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Train Smart. <br className="hidden sm:inline" />
          <span className="text-[#C6FF00]">Live Strong.</span>
        </h1>

        {/* Supporting Text */}
        <p className="text-base sm:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Your adaptive AI fitness coach for personalized workouts, smarter nutrition, optical body-composition analysis, and measurable progress.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button
            onClick={onStartJourney}
            className="w-full sm:w-auto px-8 py-4 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-base rounded-2xl shadow-xl transition transform hover:scale-[1.02] flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>Start Your Fitness Journey</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={onExploreApp}
            className="w-full sm:w-auto px-8 py-4 bg-[#12141D] hover:bg-[#191C28] border border-[#2D3245] text-white font-extrabold text-base rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore REPP Dashboard</span>
          </button>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="relative mx-auto max-w-5xl rounded-3xl border border-[#2D3245] bg-[#12141D] p-4 sm:p-6 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2D3245]/60 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="ml-2 font-mono text-white text-[11px]">app.repp.ai/dashboard</span>
            </div>
            <span className="text-[#C6FF00] font-bold">● AI Coach Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Widget 1 */}
            <div className="bg-[#191C28] border border-[#2D3245] p-5 rounded-2xl">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Today's Nutrition</div>
              <div className="text-2xl font-extrabold text-white">1,680 / 2,200 <span className="text-xs text-[#94A3B8]">kcal</span></div>
              <div className="mt-3 space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-[#94A3B8]">Protein Target</span>
                  <span className="text-[#C6FF00]">122g / 155g (78%)</span>
                </div>
                <div className="w-full bg-[#090A0F] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#C6FF00] h-full w-[78%]"></div>
                </div>
              </div>
            </div>

            {/* Widget 2 */}
            <div className="bg-[#191C28] border border-[#2D3245] p-5 rounded-2xl">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">Today's Workout</div>
              <div className="text-base font-bold text-white mb-1">Upper Body Hypertrophy</div>
              <div className="text-xs text-[#94A3B8] mb-3">4 Sets Incline Dumbbell Press (24kg)</div>
              <span className="inline-block text-[11px] font-extrabold bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30 px-2.5 py-1 rounded-lg">
                PR Milestone Achieved 🏆
              </span>
            </div>

            {/* Widget 3 */}
            <div className="bg-[#191C28] border border-[#2D3245] p-5 rounded-2xl">
              <div className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-2">AI Adaptive Insight</div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed mb-3">
                "Waist reduced by 1.5 cm while preserving arm circumference. Recommended +50g oats for tomorrow's leg day."
              </p>
              <div className="text-[10px] text-[#94A3B8] font-bold">REPP Intelligence System</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#2D3245]/60">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">
            Built for Real Results. <span className="text-[#C6FF00]">Powered by AI.</span>
          </h2>
          <p className="text-[#94A3B8] text-base sm:text-lg max-w-2xl mx-auto">
            Everything you need to plan, track, scan, and optimize your fitness journey in one sleek ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, index) => {
            const Icon = f.icon;
            return (
              <div
                key={index}
                className="bg-[#12141D] border border-[#2D3245] hover:border-[#C6FF00]/50 rounded-2xl p-6 transition duration-300 group hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-[#C6FF00]/10 text-[#C6FF00] flex items-center justify-center mb-5 group-hover:bg-[#C6FF00] group-hover:text-black transition">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How REPP Works */}
      <section id="how-it-works" className="py-20 px-6 max-w-7xl mx-auto border-t border-[#2D3245]/60">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-4">How REPP Works</h2>
          <p className="text-[#94A3B8] text-base sm:text-lg max-w-xl mx-auto">
            Four simple steps to transform your body with adaptive intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: "01", title: "Smart Onboarding", desc: "Share your metrics, food preferences, budget, equipment, and health limitations." },
            { step: "02", title: "Get Your REPP Plan", desc: "Receive customized raw-vs-cooked diet plans and injury-safe workout splits." },
            { step: "03", title: "Daily Vision & Log", desc: "Scan meals with camera, log text inputs, and track progress effortlessly." },
            { step: "04", title: "Adaptive Evolution", desc: "Every 7 days, REPP auto-tweak calories and workouts based on actual results." }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#12141D] border border-[#2D3245] p-6 rounded-2xl relative">
              <span className="text-4xl font-black text-[#C6FF00]/30 mb-3 block">{item.step}</span>
              <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy & Data Protection Section */}
      <section id="privacy" className="py-20 px-6 max-w-5xl mx-auto border-t border-[#2D3245]/60">
        <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <Lock className="w-3.5 h-3.5" /> Privacy & Safety First
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Your Body Photos & Health Data Stay Safe</h3>
              <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                REPP uses client-side encryption for progress photos. Images are analyzed solely for body composition trends and are never shared or sold. You retain 100% control with instant one-click deletion at any time.
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-white pt-2">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#C6FF00]" /> Encrypted Storage</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#C6FF00]" /> Instant Photo Deletion</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#C6FF00]" /> No Clinical Data Misuse</span>
              </div>
            </div>

            <div className="p-6 bg-[#191C28] border border-[#2D3245] rounded-2xl text-center shrink-0 w-full md:w-64">
              <ShieldCheck className="w-12 h-12 text-[#C6FF00] mx-auto mb-3" />
              <div className="text-sm font-bold text-white mb-1">Medical Disclaimer</div>
              <p className="text-[11px] text-[#94A3B8] leading-tight">
                REPP is an AI coach, not a diagnostic medical tool. Consult qualified healthcare professionals for medical advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2D3245] bg-[#090A0F] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <ReppLogo size="md" showTagline={true} />
          <div className="text-xs text-[#94A3B8]">
            © {new Date().getFullYear()} REPP Fitness Inc. Train Smart. Live Strong. All rights reserved.
          </div>
          <button
            onClick={onStartJourney}
            className="px-5 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
          >
            Launch REPP App
          </button>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import ReppLogo from './ReppLogo';
import {
  LayoutDashboard,
  Utensils,
  Dumbbell,
  Camera,
  Scan,
  TrendingUp,
  Bot,
  ShoppingBag,
  Sliders,
  User,
  Home,
  Flame,
  ChevronRight
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, userProfile }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'diet', label: 'My Diet', icon: Utensils },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'scan-meal', label: 'Log & Scan Meal', icon: Camera, badge: 'AI' },
    { id: 'bodyvision', label: 'BodyVision', icon: Scan, badge: 'AI' },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'chat', label: 'Ask REPP', icon: Bot, badge: 'Coach' },
    { id: 'grocery', label: 'Grocery List', icon: ShoppingBag },
    { id: 'adaptive-plan', label: 'Adaptive Plan', icon: Sliders },
    { id: 'profile', label: 'Profile & Privacy', icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0D0E15] border-r border-[#2D3245] h-screen sticky top-0 z-40 select-none shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2D3245]/60 flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('landing')}
            className="text-left group cursor-pointer"
          >
            <ReppLogo size="md" showTagline={true} />
          </button>
        </div>

        {/* Streak Pill */}
        <div className="mx-4 my-3 p-2.5 bg-[#12141D] border border-[#2D3245] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
              <Flame className="w-4 h-4 fill-amber-400" />
            </span>
            <div>
              <div className="text-xs font-bold text-white">{userProfile.streakDays || 7} Day Streak</div>
              <div className="text-[10px] text-[#94A3B8]">Consistent logging</div>
            </div>
          </div>
          <span className="text-xs font-bold text-[#C6FF00] bg-[#C6FF00]/10 px-2 py-0.5 rounded-full border border-[#C6FF00]/20">
            Active
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#C6FF00] text-black shadow-md font-bold'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#191C28]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-[#94A3B8]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-black text-[#C6FF00]'
                        : 'bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Profile Quick View & Landing Switcher */}
        <div className="p-3 border-t border-[#2D3245] bg-[#12141D]/80 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#191C28] transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C6FF00] text-black font-extrabold flex items-center justify-center text-xs shadow">
                AS
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">{userProfile.name}</div>
                <div className="text-[10px] text-[#94A3B8]">{userProfile.primaryGoal}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </button>

          <button
            onClick={() => setActiveTab('landing')}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-[#191C28] rounded-lg transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D0E15]/95 backdrop-blur-md border-t border-[#2D3245] px-2 py-1.5 flex items-center justify-around">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'diet', label: 'Diet', icon: Utensils },
          { id: 'workouts', label: 'Gym', icon: Dumbbell },
          { id: 'scan-meal', label: 'Log Meal', icon: Camera },
          { id: 'bodyvision', label: 'BodyVision', icon: Scan },
          { id: 'chat', label: 'AI Chat', icon: Bot },
          { id: 'profile', label: 'Profile', icon: User }
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                isActive ? 'text-[#C6FF00]' : 'text-[#94A3B8]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#C6FF00]' : 'text-[#94A3B8]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

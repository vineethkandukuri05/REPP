import React, { useState } from 'react';
import { Bell, Flame, Camera, ChevronDown, Sparkles, Check, Info } from 'lucide-react';
import ReppLogo from './ReppLogo';

export default function Header({ userProfile, setActiveTab, activeTabTitle }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'AI Meal Suggestion', desc: 'Evening snack paneer ratio adjusted for optimal 155g protein target.', time: '10m ago', unread: true },
    { id: 2, title: 'Workout Recorded', desc: 'Incline Dumbbell Press PR of 24kg registered.', time: '1h ago', unread: true },
    { id: 3, title: 'Weekly Adaptive Plan', desc: 'Week 4 adaptive nutrition review ready for application.', time: '1d ago', unread: false }
  ]);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="bg-[#090A0F]/80 backdrop-blur-md border-b border-[#2D3245] sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Mobile Branding Logo */}
      <div className="lg:hidden flex items-center gap-2">
        <button onClick={() => setActiveTab('landing')}>
          <ReppLogo size="sm" showTagline={false} />
        </button>
      </div>

      {/* Title & Date Greeting */}
      <div className="hidden sm:block">
        <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>{activeTabTitle || 'Dashboard'}</span>
        </h1>
        <p className="text-xs text-[#94A3B8] font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Scan Action */}
        <button
          onClick={() => setActiveTab('scan-meal')}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Food</span>
        </button>

        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#12141D] border border-[#2D3245] rounded-xl text-xs font-bold text-amber-400">
          <Flame className="w-4 h-4 fill-amber-400" />
          <span>{userProfile.streakDays || 7} Days</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 bg-[#12141D] hover:bg-[#191C28] border border-[#2D3245] rounded-xl text-[#94A3B8] hover:text-white transition relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C6FF00] text-black text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#090A0F]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#12141D] border border-[#2D3245] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D3245]">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C6FF00]" /> Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-[#C6FF00] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2.5 mt-3 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      n.unread ? 'bg-[#191C28] border-[#C6FF00]/40' : 'bg-[#090A0F]/40 border-[#2D3245]'
                    }`}
                  >
                    <div className="flex justify-between font-semibold text-white mb-1">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-[#94A3B8]">{n.time}</span>
                    </div>
                    <p className="text-[#94A3B8] text-[11px] leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Trigger */}
        <button
          onClick={() => setActiveTab('profile')}
          className="flex items-center gap-2 p-1.5 bg-[#12141D] hover:bg-[#191C28] border border-[#2D3245] rounded-xl transition cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-[#C6FF00] text-black font-extrabold flex items-center justify-center text-xs">
            AS
          </div>
          <span className="hidden md:inline text-xs font-bold text-white">{userProfile.name?.split(' ')[0]}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
        </button>
      </div>
    </header>
  );
}

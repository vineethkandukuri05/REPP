import React, { useState } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import {
  User,
  Lock,
  ShieldCheck,
  Download,
  Trash2,
  CheckCircle2,
  Bell,
  Sparkles,
  Sliders,
  Eye,
  Key
} from 'lucide-react';

export default function ProfilePrivacyView({ userProfile, onUpdateProfile }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ ...userProfile });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    if (onUpdateProfile) onUpdateProfile(profileData);
    alert("Profile settings successfully updated!");
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(profileData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `REPP_UserData_${userProfile.name.replace(' ', '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C6FF00] text-black font-extrabold flex items-center justify-center text-xl shadow">
            AS
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">{userProfile.name}</h2>
            <p className="text-xs text-[#94A3B8]">{userProfile.email} • {userProfile.primaryGoal}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'profile' ? 'bg-[#C6FF00] text-black' : 'bg-[#191C28] text-[#94A3B8] border border-[#2D3245]'
            }`}
          >
            Profile & Settings
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy' ? 'bg-[#C6FF00] text-black' : 'bg-[#191C28] text-[#94A3B8] border border-[#2D3245]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Privacy Center
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        /* Profile & Settings Form */
        <form onSubmit={handleSave} className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-extrabold text-white border-b border-[#2D3245] pb-3">Personal & Fitness Parameters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Current Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profileData.weight}
                onChange={(e) => setProfileData({ ...profileData, weight: Number(e.target.value) })}
                className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Daily Calorie Target</label>
              <input
                type="number"
                value={profileData.dailyCalorieTarget}
                onChange={(e) => setProfileData({ ...profileData, dailyCalorieTarget: Number(e.target.value) })}
                className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Protein Target (g)</label>
              <input
                type="number"
                value={profileData.proteinTarget}
                onChange={(e) => setProfileData({ ...profileData, proteinTarget: Number(e.target.value) })}
                className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              />
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Diet Preference</label>
              <select
                value={profileData.dietPreference}
                onChange={(e) => setProfileData({ ...profileData, dietPreference: e.target.value })}
                className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              >
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>
            <div>
              <label className="block text-[#94A3B8] font-bold mb-1">Workout Days / Week</label>
              <input
                type="number"
                value={profileData.workoutDaysPerWeek}
                onChange={(e) => setProfileData({ ...profileData, workoutDaysPerWeek: Number(e.target.value) })}
                className="w-full bg-[#191C28] border border-[#2D3245] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#C6FF00]"
              />
            </div>
          </div>

          <div className="border-t border-[#2D3245] pt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 bg-[#191C28] hover:bg-[#222636] border border-[#2D3245] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[#C6FF00]" /> Export Personal Data
              </button>
              <button
                type="button"
                onClick={() => alert("Account deletion request initiated.")}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#C6FF00] hover:bg-[#B5F500] text-black font-extrabold text-xs rounded-xl shadow cursor-pointer"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      ) : (
        /* Dedicated Privacy Center */
        <div className="bg-[#12141D] border border-[#2D3245] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">REPP Privacy & Data Protection Center</h3>
              <p className="text-xs text-[#94A3B8]">Transparent controls over progress photos, body vision AI, and health parameters.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C6FF00]" /> Photo Storage & Client Encryption
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                All progress photos uploaded to REPP BodyVision are encrypted before storage. Photos are used exclusively for computing optical body-fat estimates and are never made public or indexed by external search engines.
              </p>
            </div>

            <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] space-y-1">
              <div className="font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> AI Estimate Limitations Disclaimer
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                Body-fat percentage output is an AI estimate calculated from optical keypoints. REPP does not perform clinical DEXA scans or diagnose health conditions.
              </p>
            </div>

            <div className="p-4 bg-[#191C28] rounded-2xl border border-[#2D3245] flex items-center justify-between">
              <div>
                <div className="font-bold text-white">Delete All Uploaded Progress Photos</div>
                <div className="text-[10px] text-[#94A3B8]">Permanently wipes all 3 uploaded scans from storage.</div>
              </div>
              <button
                onClick={() => alert("All progress photos deleted.")}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold cursor-pointer"
              >
                Delete Photos
              </button>
            </div>
          </div>
        </div>
      )}

      <MedicalDisclaimer compact={true} />
    </div>
  );
}

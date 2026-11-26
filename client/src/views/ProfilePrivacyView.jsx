import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import UserAvatar from '../components/UserAvatar';
import { notifyMeasurementsChanged } from '../hooks/useMeasurementReminder';
import { printHtml } from '../utils/progressReport';
import { dataExportHtml } from '../utils/dataExportReport';
import { Trash, X } from '../components/ui/icons';

const NUMERIC_FIELDS = ['weight', 'targetWeight', 'dailyCalorieTarget', 'proteinTarget', 'workoutDaysPerWeek'];
const DIET_OPTIONS = ['Non-Vegetarian', 'Vegetarian', 'Eggitarian', 'Vegan'];

function formFromProfile(profile) {
  const p = profile || {};
  return {
    name: p.name ?? '',
    weight: p.weight ?? '',
    targetWeight: p.targetWeight ?? '',
    dailyCalorieTarget: p.dailyCalorieTarget ?? '',
    proteinTarget: p.proteinTarget ?? '',
    dietPreference: p.dietPreference ?? 'Non-Vegetarian',
    workoutDaysPerWeek: p.workoutDaysPerWeek ?? ''
  };
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ProfilePrivacyView() {
  const { user, profile, refreshUser, updateLocalProfile, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(null); // 'json' | 'pdf' | null

  const [scanCount, setScanCount] = useState(null);
  const [deletingPhotos, setDeletingPhotos] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const original = useMemo(() => formFromProfile(profile), [profile]);
  const changed = useMemo(
    () => Object.keys(form).filter(k => String(form[k]) !== String(original[k])),
    [form, original]
  );

  useEffect(() => {
    if (activeTab !== 'privacy') return;
    api.get('/bodyvision/reports')
      .then(res => setScanCount(Array.isArray(res?.reports) ? res.reports.length : 0))
      .catch(() => setScanCount(null));
  }, [activeTab]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (changed.length === 0) {
      showToast('No changes to save.', 'info');
      return;
    }
    const payload = {};
    for (const k of changed) {
      payload[k] = NUMERIC_FIELDS.includes(k) ? Number(form[k]) : form[k];
    }
    setSaving(true);
    try {
      const res = await api.put('/profile', payload);
      if (res?.profile) {
        updateLocalProfile(res.profile);
        setForm(formFromProfile(res.profile));
      }
      await refreshUser();
      const recalculated = changed.includes('weight') && !changed.includes('dailyCalorieTarget');
      if (changed.includes('weight')) notifyMeasurementsChanged();
      showToast(recalculated ? 'Profile saved. Calorie and macro targets recalculated for your new weight.' : 'Profile saved!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (kind) => {
    setExporting(kind);
    try {
      const data = await api.get('/profile/export');
      const date = new Date().toISOString().slice(0, 10);
      if (kind === 'json') {
        downloadJson(data, `REPP_UserData_${date}.json`);
        showToast('Your complete data export (JSON) has been downloaded.', 'success');
      } else {
        printHtml(dataExportHtml(data));
        showToast('Choose "Save as PDF" in the print window to save your data summary.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Failed to export data', 'error');
    } finally {
      setExporting(null);
    }
  };

  const handleDeletePhotos = async () => {
    if (!window.confirm('Permanently delete all your BodyVision progress photos and scan reports? This cannot be undone.')) return;
    setDeletingPhotos(true);
    try {
      await api.delete('/bodyvision/delete-all');
      setScanCount(0);
      showToast('All progress photos and scan reports deleted.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete photos', 'error');
    } finally {
      setDeletingPhotos(false);
    }
  };

  const closeDeleteDialog = () => {
    setShowDelete(false);
    setDeletePassword('');
    setDeleteConfirmText('');
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeletingAccount(true);
    try {
      await api.delete('/profile/delete-account', {
        body: user?.hasPassword === false ? { confirmText: deleteConfirmText } : { password: deletePassword }
      });
      showToast('Your account and all associated data have been permanently deleted.', 'success');
      await logout();
      navigate('/', { replace: true });
    } catch (err) {
      showToast(err.message || 'Failed to delete account', 'error');
      setDeletingAccount(false);
    }
  };

  const inputClass = 'w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-ink focus:outline-none focus:border-brand';
  const dietOptions = DIET_OPTIONS.includes(form.dietPreference) ? DIET_OPTIONS : [form.dietPreference, ...DIET_OPTIONS];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <UserAvatar src={user?.avatarUrl} name={profile?.name} className="w-14 h-14 rounded-sm text-xl" />
          <div>
            <h2 className="text-2xl font-bold text-ink">{profile?.name || 'Your Profile'}</h2>
            <p className="text-xs text-muted">{user?.email}{profile?.primaryGoal ? ` • ${profile.primaryGoal}` : ''}</p>
            {user?.googleLinked && (
              <span className="inline-block mt-1 text-[10px] font-bold text-muted bg-subtle border border-line rounded-sm px-1.5 py-0.5">
                Google account linked{user?.hasPassword ? ' · password login also enabled' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer ${
              activeTab === 'profile' ? 'bg-brand text-on-brand' : 'bg-subtle text-muted border border-line'
            }`}
          >
            Profile & Settings
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy' ? 'bg-brand text-on-brand' : 'bg-subtle text-muted border border-line'
            }`}
          >
             Privacy Center
          </button>
          <button
            onClick={async () => { await logout(); navigate('/login', { replace: true }); }}
            className="px-4 py-2 rounded-sm text-xs font-bold transition cursor-pointer flex items-center gap-1.5 bg-subtle text-muted border border-line hover:text-danger hover:border-danger"
          >
             Log out
          </button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleSave} className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-6">
          <h3 className="text-lg font-bold text-ink border-b border-line pb-3">Personal & Fitness Parameters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <label className="block">
              <span className="block text-muted font-bold mb-1">Full Name</span>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-muted font-bold mb-1">Current Weight (kg)</span>
              <input type="number" step="0.1" min="20" max="400" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-muted font-bold mb-1">Target Weight (kg)</span>
              <input type="number" step="0.1" min="20" max="400" value={form.targetWeight} onChange={(e) => setForm({ ...form, targetWeight: e.target.value })} className={inputClass} />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <label className="block">
              <span className="block text-muted font-bold mb-1">Daily Calorie Target</span>
              <input type="number" min="800" max="6000" value={form.dailyCalorieTarget} onChange={(e) => setForm({ ...form, dailyCalorieTarget: e.target.value })} className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-muted font-bold mb-1">Protein Target (g)</span>
              <input type="number" min="20" max="400" value={form.proteinTarget} onChange={(e) => setForm({ ...form, proteinTarget: e.target.value })} className={inputClass} />
            </label>
            <label className="block">
              <span className="block text-muted font-bold mb-1">Diet Preference</span>
              <select value={form.dietPreference} onChange={(e) => setForm({ ...form, dietPreference: e.target.value })} className={inputClass}>
                {dietOptions.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-muted font-bold mb-1">Workout Days / Week</span>
              <input type="number" min="1" max="7" value={form.workoutDaysPerWeek} onChange={(e) => setForm({ ...form, workoutDaysPerWeek: e.target.value })} className={inputClass} />
            </label>
          </div>

          <p className="text-[11px] text-muted">
            Changing your weight recalculates calorie and macro targets automatically, unless you also set them here.
          </p>

          <div className="border-t border-line pt-6 flex flex-wrap items-center justify-end gap-3">
            {changed.length > 0 && (
              <button
                type="button"
                onClick={() => setForm(original)}
                className="px-4 py-2.5 text-xs font-bold text-muted hover:text-ink cursor-pointer"
              >
                Discard changes
              </button>
            )}
            <button
              type="submit"
              disabled={saving || changed.length === 0}
              className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving && null}
              Save Profile Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-xl font-bold text-ink">REPP Privacy & Data Protection Center</h3>
              <p className="text-xs text-muted">Download, review and delete the data REPP stores about you.</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Export */}
            <div className="p-4 bg-subtle rounded-sm border border-line space-y-3">
              <div>
                <div className="font-bold text-ink flex items-center gap-2">
                   Export Your Data
                </div>
                <p className="text-muted leading-relaxed mt-1">
                  <strong className="text-ink">Readable summary (PDF)</strong>: your profile, measurements, workouts, meals, scans and badges, formatted to read or keep.{' '}
                  <strong className="text-ink">Complete data (JSON)</strong>: every record in your account in a machine-readable format you can import elsewhere. Photos are not included.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting !== null}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-on-brand text-xs font-bold rounded-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  
                  Readable Summary (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  disabled={exporting !== null}
                  className="px-4 py-2 bg-surface hover:bg-subtle-hover border border-line text-ink text-xs font-bold rounded-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  
                  Complete Data (JSON)
                </button>
              </div>
            </div>

            <div className="p-4 bg-subtle rounded-sm border border-line space-y-1">
              <div className="font-bold text-ink flex items-center gap-2">
                 Photo Storage
              </div>
              <p className="text-muted leading-relaxed">
                BodyVision progress photos are stored in a private folder on the REPP server, separate from public files, and can only be viewed while you are logged in to your own account. They are analysed by the AI model running locally on this server and are never published or shared.
              </p>
            </div>

            <div className="p-4 bg-subtle rounded-sm border border-line space-y-1">
              <div className="font-bold text-ink flex items-center gap-2">
                 AI Estimate Limitations
              </div>
              <p className="text-muted leading-relaxed">
                Body-fat percentages are AI visual estimates from your photos. REPP does not perform clinical DEXA scans or diagnose health conditions.
              </p>
            </div>

            {/* Delete photos */}
            <div className="p-4 bg-subtle rounded-sm border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-ink">Delete All Uploaded Progress Photos</div>
                <div className="text-[10px] text-muted">
                  {scanCount === null
                    ? 'Permanently removes your BodyVision photos and scan reports.'
                    : scanCount === 0
                      ? 'You have no stored progress photos.'
                      : `Permanently removes ${scanCount} BodyVision scan${scanCount === 1 ? '' : 's'} and their photos.`}
                </div>
              </div>
              <button
                type="button"
                onClick={handleDeletePhotos}
                disabled={deletingPhotos || scanCount === 0}
                className="px-4 py-2 bg-subtle hover:bg-subtle text-danger border border-danger rounded-sm text-xs font-bold cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingPhotos ? null : <Trash className="w-4 h-4" />}
                Delete Photos
              </button>
            </div>

            {/* Delete account */}
            <div className="p-4 bg-subtle rounded-sm border border-danger flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-danger">Delete Account</div>
                <div className="text-[10px] text-muted">
                  Permanently deletes your account, profile, logs, plans, photos and reports. Export your data first if you want a copy.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="px-4 py-2 bg-subtle hover:bg-subtle text-danger border border-danger rounded-sm text-xs font-bold cursor-pointer flex items-center gap-2"
              >
                <Trash className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      <MedicalDisclaimer compact={true} />

      {/* Delete account dialog */}
      {showDelete && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <form onSubmit={handleDeleteAccount} className="bg-surface border border-danger rounded-sm p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-danger font-bold">
                 Delete your account?
              </div>
              <button type="button" onClick={closeDeleteDialog} className="text-muted hover:text-ink cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              This permanently deletes <strong className="text-ink">{user?.email}</strong> and all of its data, including progress photos. It cannot be undone.
            </p>
            {user?.hasPassword !== false && <label className="block text-xs space-y-1">
              <span className="text-muted font-bold">Your password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={inputClass}
                required
              />
            </label>}
            <label className="block text-xs space-y-1">
              <span className="text-muted font-bold">Type <strong className="text-ink">DELETE</strong> to confirm</span>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={inputClass}
                required
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeDeleteDialog} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={deletingAccount || (user?.hasPassword !== false && !deletePassword) || deleteConfirmText !== 'DELETE'}
                className="px-4 py-2 bg-danger hover:bg-danger text-ink text-xs font-bold rounded-sm cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAccount ? null : <Trash className="w-4 h-4" />}
                Permanently Delete
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

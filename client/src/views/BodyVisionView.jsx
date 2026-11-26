import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import api, { serverFileUrl } from '../api/client';
import { Trash, X } from '../components/ui/icons';
import { SkeletonCard, ErrorState } from '../components/ui/States';

const VIEWS = [
  { key: 'front', title: 'Front View', label: 'Abs & Chest Definition', required: true },
  { key: 'side', title: 'Side Profile', label: 'Abdominal Depth & Posture', required: false },
  { key: 'back', title: 'Back View', label: 'Lats & Upper Back Width', required: false }
];

const photoField = { front: 'frontPhotoPath', side: 'sidePhotoPath', back: 'backPhotoPath' };

function PhotoPicker({ view, file, previewUrl, onSelect, onClear, disabled }) {
  return (
    <div className="bg-subtle border border-line rounded-sm p-3 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-ink">
        <span>{view.title}</span>
        <span className={view.required ? 'text-brand' : 'text-muted'}>
          {view.required ? 'Required' : 'Optional'}
        </span>
      </div>
      <div className="relative border-2 border-dashed border-line hover:border-line-strong rounded-sm h-44 flex items-center justify-center overflow-hidden transition">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
            e.target.value = '';
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          aria-label={`Choose ${view.title} photo`}
        />
        {previewUrl ? (
          <img src={previewUrl} alt={`${view.title} preview`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted text-xs pointer-events-none">
            
            <span>Tap to take or choose photo</span>
          </div>
        )}
      </div>
      {file && (
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="text-[11px] text-muted hover:text-ink flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3 h-3" /> Remove
        </button>
      )}
    </div>
  );
}

export default function BodyVisionView() {
  const { showToast } = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const [showUpload, setShowUpload] = useState(false);
  const [files, setFiles] = useState({ front: null, side: null, back: null });
  const [previews, setPreviews] = useState({ front: null, side: null, back: null });
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoadError('');
      const res = await api.get('/bodyvision/reports');
      setReports(Array.isArray(res?.reports) ? res.reports : []);
    } catch (err) {
      showToast(err.message || 'Failed to load BodyVision reports', 'error');
      setLoadError(err?.message || 'Could not load your scans.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Release any remaining preview object URLs on unmount.
  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);
  useEffect(() => () => {
    Object.values(previewsRef.current).forEach(url => url && URL.revokeObjectURL(url));
  }, []);

  const setPhoto = (key, file) => {
    if (previews[key]) URL.revokeObjectURL(previews[key]);
    setFiles(prev => ({ ...prev, [key]: file }));
    setPreviews(prev => ({ ...prev, [key]: file ? URL.createObjectURL(file) : null }));
  };

  const resetUpload = () => {
    Object.values(previews).forEach(url => url && URL.revokeObjectURL(url));
    setFiles({ front: null, side: null, back: null });
    setPreviews({ front: null, side: null, back: null });
  };

  const handleUpload = async () => {
    if (!files.front) {
      showToast('Please add a front-view photo first.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      showToast('Analyzing photos with REPP Vision AI. This can take a minute or two...', 'info');
      const formData = new FormData();
      VIEWS.forEach(v => files[v.key] && formData.append(v.key, files[v.key]));
      const res = await api.post('/bodyvision/upload', formData);
      if (res?.report) {
        setReports(prev => [res.report, ...prev]);
        setSelectedId(res.report.id);
        showToast(`Scan complete: estimated body fat ${res.report.estimatedBodyFatRange}`, 'success');
        resetUpload();
        setShowUpload(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to analyze photos', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Permanently delete all your progress photos and BodyVision reports? This cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    try {
      await api.delete('/bodyvision/delete-all');
      setReports([]);
      setSelectedId(null);
      showToast('All progress photos and reports deleted.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to delete photos', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeReport = reports.find(r => r.id === selectedId) || reports[0] || null;
  const baselineReport = reports.length > 1 ? reports[reports.length - 1] : null;
  const latestReport = reports[0] || null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">BodyVision</h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Upload progress photos to get an estimated body-fat range and compare scans over time. Photos are stored privately.
          </p>
        </div>

        <button
          onClick={() => setShowUpload(s => !s)}
          disabled={isUploading}
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
        >
          
          <span>{showUpload ? 'Close Upload' : 'Upload New Progress Photos'}</span>
        </button>
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="bg-surface border border-line-strong rounded-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-ink">New Progress Scan</h3>
            <p className="text-xs text-muted mt-1">
              Add a front photo (required) plus optional side and back photos. JPEG, PNG or WebP, up to 8 MB each.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VIEWS.map(v => (
              <PhotoPicker
                key={v.key}
                view={v}
                file={files[v.key]}
                previewUrl={previews[v.key]}
                disabled={isUploading}
                onSelect={(f) => setPhoto(v.key, f)}
                onClear={() => setPhoto(v.key, null)}
              />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] text-muted flex items-center gap-1.5">
              
              Photos are stored privately and only visible when you're logged in.
            </p>
            <button
              onClick={handleUpload}
              disabled={isUploading || !files.front}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              
              <span>{isUploading ? 'Analyzing...' : 'Analyze Photos'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Mandatory Clinical & Privacy Disclaimer Box */}
      <div className="p-5 bg-surface border border-warning rounded-sm space-y-3">
        <div className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wider">
           AI Body Composition Disclaimer & Guidance
        </div>
        <ul className="text-xs text-muted space-y-1.5 list-disc pl-5 leading-relaxed">
          <li><strong className="text-ink">Estimate Only:</strong> Body fat is displayed strictly as a range, not a precise DEXA scan or clinical measurement.</li>
          <li><strong className="text-ink">Variables:</strong> Lighting, posture, camera angle, clothing, and water retention directly affect optical analysis.</li>
          <li><strong className="text-ink">Visceral Fat Limit:</strong> REPP cannot detect internal visceral fat from surface photographs.</li>
          <li><strong className="text-ink">Spot Reduction Myth:</strong> Fat loss occurs systemically; targeted fat reduction cannot be guaranteed.</li>
          <li><strong className="text-ink">Best Practice:</strong> Combine photo trends with scale weight and waist tape measurements for accuracy.</li>
        </ul>
      </div>

      {/* Photography Consistency Guidance */}
      <div className="bg-surface border border-line rounded-sm p-6">
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-3">Guidelines for Consistent Photos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted">
          <div className="p-3 bg-subtle rounded-sm border border-line">
            <span className="font-bold text-ink block mb-1">1. Lighting</span>
            <span>Use natural morning light facing camera. Avoid harsh overhead shadows.</span>
          </div>
          <div className="p-3 bg-subtle rounded-sm border border-line">
            <span className="font-bold text-ink block mb-1">2. Distance & Angle</span>
            <span>Position camera at chest height, exactly 2 meters (6 feet) away.</span>
          </div>
          <div className="p-3 bg-subtle rounded-sm border border-line">
            <span className="font-bold text-ink block mb-1">3. Consistent Attire</span>
            <span>Wear fitted shorts / swimwear for identical anatomical tracking.</span>
          </div>
          <div className="p-3 bg-subtle rounded-sm border border-line">
            <span className="font-bold text-ink block mb-1">4. Neutral Posture</span>
            <span>Stand straight, arms slightly away from sides, relaxed breath out.</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-hidden="true">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-56" />)}
          </div>
          <SkeletonCard lines={4} />
        </div>
      ) : loadError ? (
        <ErrorState title="Couldn't load your scans" message={loadError} onRetry={() => { setLoading(true); fetchReports(); }} />
      ) : !activeReport ? (
        <div className="bg-surface border border-line rounded-sm p-10 text-center space-y-3">
          
          <h3 className="text-lg font-bold text-ink">No scans yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Upload your first progress photos to get a baseline body-fat estimate. Future scans will be compared against it.
          </p>
          {!showUpload && (
            <button
              onClick={() => setShowUpload(true)}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer inline-flex items-center gap-2"
            >
               Upload Photos
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Scan history selector */}
          {reports.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {reports.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition cursor-pointer ${
                    r.id === activeReport.id
                      ? 'bg-brand text-on-brand border-brand'
                      : 'bg-surface text-muted border-line hover:text-ink'
                  }`}
                >
                  {r.date}{idx === 0 ? ' (latest)' : idx === reports.length - 1 ? ' (baseline)' : ''}
                </button>
              ))}
            </div>
          )}

          {/* Photo cards for the selected scan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VIEWS.map(v => {
              const src = serverFileUrl(activeReport[photoField[v.key]]);
              return (
                <div key={v.key} className="bg-surface border border-line rounded-sm p-4 text-center space-y-3">
                  <div className="text-xs font-bold text-ink text-left">{v.title}</div>
                  {src ? (
                    <img src={src} alt={v.title} className="w-full h-56 object-cover rounded-sm border border-line" />
                  ) : (
                    <div className="w-full h-56 rounded-sm border border-dashed border-line flex items-center justify-center text-xs text-muted">
                      Not uploaded
                    </div>
                  )}
                  <span className="text-[11px] text-muted font-medium block">{v.label}</span>
                </div>
              );
            })}
          </div>

          {/* AI Analysis Report Card */}
          <div className="bg-surface border border-line-strong rounded-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-line">
              <div>
                <div className="text-xs font-bold text-brand uppercase tracking-wider">AI Report • {activeReport.date}</div>
                <h3 className="text-2xl font-bold text-ink mt-0.5">Estimated Body Fat Range</h3>
              </div>
              <div className="px-6 py-3 bg-subtle border border-brand rounded-sm text-center">
                <span className="text-2xl font-bold text-brand">{activeReport.estimatedBodyFatRange}</span>
                <span className="text-[10px] text-muted block font-mono">Estimated Range</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold text-ink uppercase tracking-wider">Visible Composition Trends</h4>
                <p className="text-muted leading-relaxed bg-subtle p-4 rounded-sm border border-line">
                  {activeReport.visibleTrends}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-ink uppercase tracking-wider">Fat Distribution Observations</h4>
                <p className="text-muted leading-relaxed bg-subtle p-4 rounded-sm border border-line">
                  {activeReport.fatDistribution}
                </p>
              </div>
            </div>

            {activeReport.comparisonWithPrevious && (
              <p className="text-xs text-muted bg-subtle p-4 rounded-sm border border-line">
                <strong className="text-ink">Compared with previous: </strong>{activeReport.comparisonWithPrevious}
              </p>
            )}
            {activeReport.disclaimer && (
              <p className="text-[11px] text-muted italic">{activeReport.disclaimer}</p>
            )}
          </div>

          {/* Track Your Changes Over Time */}
          <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-ink">Track Your Changes Over Time</h3>
              <p className="text-xs text-muted">
                {baselineReport
                  ? 'Your first scan compared with your latest scan.'
                  : 'Upload another scan later to compare it with this baseline.'}
              </p>
            </div>

            {baselineReport && latestReport && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { r: baselineReport, label: 'Baseline', accent: false },
                  { r: latestReport, label: 'Latest', accent: true }
                ].map(({ r, label, accent }) => (
                  <div
                    key={label}
                    className={`p-4 bg-subtle rounded-sm border space-y-3 ${accent ? 'border-line-strong' : 'border-line'}`}
                  >
                    <div className={`flex justify-between text-xs font-bold ${accent ? 'text-brand' : 'text-muted'}`}>
                      <span>{label}: {r.date}</span>
                      <span className="text-ink">BF Range: {r.estimatedBodyFatRange}</span>
                    </div>
                    {r.frontPhotoPath && (
                      <img src={serverFileUrl(r.frontPhotoPath)} alt={`${label} front`} className="w-full h-48 object-cover rounded-sm border border-line" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Photo Privacy & Management Controls */}
      <div className="p-6 bg-surface border border-line rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          
          <div>
            <div className="text-sm font-bold text-ink">Photo Privacy Controls</div>
            <div className="text-xs text-muted">Your body photos are private to your account. You can wipe all photos anytime.</div>
          </div>
        </div>

        <button
          onClick={handleDeleteAll}
          disabled={isDeleting || reports.length === 0}
          className="px-4 py-2 bg-subtle hover:bg-subtle text-danger border border-danger rounded-sm text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? null : <Trash className="w-4 h-4" />}
          Delete All Uploaded Photos
        </button>
      </div>
    </div>
  );
}

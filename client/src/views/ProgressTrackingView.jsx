import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import MeasurementReminder from '../components/MeasurementReminder';
import { useMeasurementReminder, notifyMeasurementsChanged } from '../hooks/useMeasurementReminder';
import { printProgressReport } from '../utils/progressReport';
import { Plus, X } from '../components/ui/icons';
import { SkeletonPage, ErrorState } from '../components/ui/States';

const TIMEFRAMES = ['7d', '30d', '60d', '90d', '180d'];
const TIMEFRAME_LABELS = { '180d': '6M' };

function signed(value, unit) {
  if (value == null) return 'n/a';
  return `${value > 0 ? '+' : ''}${value} ${unit}`;
}

function TrendChart({ measurements }) {
  const points = measurements.filter(m => m.weight != null);
  if (points.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-xs text-muted gap-2 border border-dashed border-line rounded-sm">
        
        No measurements in this period. Log your weight below to start your trend.
      </div>
    );
  }

  const W = 600;
  const H = 180;
  const pad = { l: 36, r: 36, t: 14, b: 26 };

  const series = (key) => points.filter(p => p[key] != null).map(p => ({ date: p.date, v: p[key] }));
  const weight = series('weight');
  const waist = series('waist');

  const x = (i) => (points.length === 1 ? W / 2 : pad.l + (i * (W - pad.l - pad.r)) / (points.length - 1));
  const scale = (vals) => {
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    return (v) => pad.t + (1 - (v - (min - span * 0.15)) / (span * 1.3)) * (H - pad.t - pad.b);
  };
  const yW = scale(weight.map(p => p.v));
  const yWa = waist.length ? scale(waist.map(p => p.v)) : null;

  const indexOf = (date) => points.findIndex(p => p.date === date);
  const path = (arr, y) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(indexOf(p.date))},${y(p.v)}`).join(' ');

  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-48" role="img" aria-label="Weight and waist trend chart">
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="var(--color-line)" />
      {yWa && waist.length > 1 && <path d={path(waist, yWa)} fill="none" stroke="var(--color-data-carbs)" strokeWidth="2" />}
      {weight.length > 1 && <path d={path(weight, yW)} fill="none" stroke="var(--color-brand)" strokeWidth="2.5" />}
      {weight.map((p, i) => (
        <g key={`w${i}`}>
          <circle cx={x(indexOf(p.date))} cy={yW(p.v)} r="4" fill="var(--color-brand)">
            <title>{`${p.date}: ${p.v} kg`}</title>
          </circle>
        </g>
      ))}
      {yWa && waist.map((p, i) => (
        <circle key={`wa${i}`} cx={x(indexOf(p.date))} cy={yWa(p.v)} r="3" fill="var(--color-data-carbs)">
          <title>{`${p.date}: ${p.v} cm waist`}</title>
        </circle>
      ))}
      {points.map((p, i) =>
        i % labelEvery === 0 || i === points.length - 1 ? (
          <text key={`l${i}`} x={x(i)} y={H - 8} fill="var(--color-muted)" fontSize="10" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif">
            {p.date.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  );
}

export default function ProgressTrackingView() {
  const { showToast } = useToast();
  const { refreshUser } = useAuth();

  const [timeframe, setTimeframe] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [form, setForm] = useState({ weight: '', waist: '', chest: '', arms: '' });
  const [saving, setSaving] = useState(false);

  const [report, setReport] = useState(null);

  const { reminder } = useMeasurementReminder();
  const logFormRef = useRef(null);
  const weightInputRef = useRef(null);

  const goToLogForm = () => {
    logFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => weightInputRef.current?.focus(), 400);
  };
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoadError('');
      setLoading(true);
      const res = await api.get(`/progress/data?timeframe=${timeframe}`);
      setData(res);
    } catch (err) {
      showToast(err.message || 'Failed to load progress data', 'error');
      setLoadError(err?.message || 'Could not load your progress.');
    } finally {
      setLoading(false);
    }
  }, [timeframe, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLog = async (e) => {
    e.preventDefault();
    if (!form.weight) {
      showToast('Enter your weight to log a measurement.', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = { weight: Number(form.weight) };
      ['waist', 'chest', 'arms'].forEach(k => {
        if (form[k]) body[k] = Number(form[k]);
      });
      await api.post('/progress/log', body);
      showToast('Measurement logged! Next weekly check-in in 7 days.', 'success');
      notifyMeasurementsChanged();
      setForm({ weight: '', waist: '', chest: '', arms: '' });
      refreshUser();
      fetchData();
    } catch (err) {
      showToast(err.message || 'Failed to log measurement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/progress/report', { timeframe });
      if (res?.report) setReport(res.report);
    } catch (err) {
      showToast(err.message || 'Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const stats = data
    ? [
        {
          label: 'Scale Weight Change',
          value: signed(data.weight.delta, 'kg'),
          sub: data.weight.start != null && data.weight.delta != null ? `${data.weight.start} kg → ${data.weight.end} kg` : 'Needs 2+ weigh-ins',
          color: 'text-ink'
        },
        {
          label: 'Waist Tape Change',
          value: signed(data.waist.delta, 'cm'),
          sub: data.waist.delta != null ? `${data.waist.start} cm → ${data.waist.end} cm` : 'Needs 2+ waist logs',
          color: 'text-brand'
        },
        {
          label: 'Protein Adherence',
          value: data.nutrition.proteinAdherence != null ? `${data.nutrition.proteinAdherence}%` : 'n/a',
          sub: data.nutrition.avgProtein != null
            ? `${data.nutrition.avgProtein}g avg / ${data.profile.proteinTarget}g target`
            : 'No meals logged',
          color: 'text-ink'
        },
        {
          label: 'Workouts Completed',
          value: String(data.workouts.inPeriod),
          sub: `${data.workouts.allTime} all-time`,
          color: 'text-data-carbs'
        }
      ]
    : [];

  const inputClass = 'w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">Progress</h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Your weight, waist, nutrition and workouts over the period you choose.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase transition cursor-pointer ${
                timeframe === t
                  ? 'bg-brand text-on-brand font-bold'
                  : 'bg-subtle text-muted border border-line'
              }`}
            >
              {TIMEFRAME_LABELS[t] || t}
            </button>
          ))}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            
            Generate My Progress Report
          </button>
        </div>
      </div>

      <MeasurementReminder reminder={reminder} onAction={goToLogForm} actionLabel="Log Now" showWhenNotDue />

      {loading && !data ? (
        <SkeletonPage stats={4} cards={2} label="Loading your progress" />
      ) : loadError && !data ? (
        <ErrorState title="Couldn't load your progress" message={loadError} onRetry={fetchData} />
      ) : data && (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className="bg-surface border border-line rounded-sm p-4">
                <span className="text-xs text-muted font-bold block mb-1">{s.label}</span>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <span className="text-[10px] text-muted font-bold">{s.sub}</span>
              </div>
            ))}
          </div>

          {/* Weight & Waist Chart */}
          <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-ink">Weight & Waist Measurement Trend</h3>
                <p className="text-xs text-muted">{data.period.start} to {data.period.end}</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-ink">
                  <span className="w-3 h-3 rounded-sm bg-brand"></span> Scale Weight (kg)
                </span>
                <span className="flex items-center gap-1.5 text-data-carbs">
                  <span className="w-3 h-3 rounded-sm bg-data-carbs"></span> Waist Tape (cm)
                </span>
              </div>
            </div>
            <TrendChart measurements={data.measurements} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Log measurement */}
            <form
              ref={logFormRef}
              onSubmit={handleLog}
              className={`bg-surface border rounded-sm p-6 space-y-4 scroll-mt-24 ${reminder?.due ? 'border-warning' : 'border-line'}`}
            >
              <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Log Today's Measurements</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'weight', label: 'Weight (kg)', required: true },
                  { key: 'waist', label: 'Waist (cm)' },
                  { key: 'chest', label: 'Chest (cm)' },
                  { key: 'arms', label: 'Arms (cm)' }
                ].map(f => (
                  <label key={f.key} className="space-y-1 text-xs text-muted font-semibold">
                    <span>{f.label}{f.required ? ' *' : ''}</span>
                    <input
                      ref={f.key === 'weight' ? weightInputRef : undefined}
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={form[f.key]}
                      onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      required={f.required}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {saving ? null : <Plus className="w-4 h-4" />}
                Log Measurement
              </button>
            </form>

            {/* Period summary */}
            <div className="bg-surface border border-line rounded-sm p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-ink uppercase tracking-wider">Period Summary</h4>
                <span className="text-xs font-mono text-brand">Last {data.period.days} days</span>
              </div>
              <ul className="text-xs text-muted space-y-2 list-disc pl-4 leading-relaxed">
                {data.highlights.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Report Modal */}
      {report && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-surface border border-brand rounded-sm p-6 max-w-lg w-full relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <span className="text-xs font-bold text-brand uppercase tracking-wider">Progress Report</span>
              <button onClick={() => setReport(null)} className="text-muted hover:text-ink cursor-pointer" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-bold text-ink">{report.profile.name}: {report.period.days}-Day Summary</h3>
              <p className="text-xs text-muted">
                {report.period.start} to {report.period.end}{report.profile.goal ? ` · ${report.profile.goal}` : ''}
              </p>
            </div>
            <div className="p-4 bg-subtle rounded-sm border border-line text-xs space-y-1 font-mono text-ink">
              <div>Weight Delta: {signed(report.weight.delta, 'kg')}</div>
              <div>Waist Delta: {signed(report.waist.delta, 'cm')}</div>
              <div>Protein Adherence: {report.nutrition.proteinAdherence != null ? `${report.nutrition.proteinAdherence}%` : 'n/a'}</div>
              <div>Workouts Completed: {report.workouts.inPeriod}</div>
              {report.bodyVision.latest && <div>BodyVision: {report.bodyVision.latest.range}</div>}
            </div>
            <ul className="text-xs text-muted space-y-1.5 list-disc pl-4 leading-relaxed">
              {report.highlights.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
            <button
              onClick={() => printProgressReport(report)}
              className="w-full py-3 bg-brand text-on-brand font-bold text-xs rounded-sm cursor-pointer flex items-center justify-center gap-2"
            >
               Download PDF Report
            </button>
            <p className="text-[11px] text-muted text-center">
              In the print window, choose <strong className="text-ink">Save as PDF</strong> as the destination.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

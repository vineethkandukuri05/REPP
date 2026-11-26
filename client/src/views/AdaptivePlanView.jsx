import React, { useState, useEffect, useCallback } from 'react';
import MedicalDisclaimer from '../components/MedicalDisclaimer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { DailyBarChart, WeightTrendChart, ProgressBar } from '../components/adaptive/AdaptiveCharts';
import WeeklyFeedbackForm from '../components/adaptive/WeeklyFeedbackForm';
import PlanDetails from '../components/adaptive/PlanDetails';
import { ChevronRight, Trash, X } from '../components/ui/icons';
import { SkeletonPage, SkeletonRows, ErrorState } from '../components/ui/States';

const fmtDate = (iso) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
const signed = (n, unit) => (n == null ? 'n/a' : `${n > 0 ? '+' : ''}${n}${unit ? ` ${unit}` : ''}`);

const FIELDS = [
  { key: 'calories', label: 'Daily calories', unit: 'kcal', min: 1200, max: 4500, step: 25 },
  { key: 'protein', label: 'Daily protein', unit: 'g', min: 50, max: 300, step: 5 },
  { key: 'workoutDays', label: 'Workout days', unit: 'per week', min: 2, max: 6, step: 1 },
  { key: 'cardioMinutes', label: 'Cardio', unit: 'min/week', min: 0, max: 300, step: 10 },
  { key: 'waterMl', label: 'Water', unit: 'ml/day', min: 1500, max: 6000, step: 250 },
  { key: 'sleepHours', label: 'Sleep target', unit: 'h/night', min: 6, max: 10, step: 0.5 }
];

// ---------------------------------------------------------------- small pieces

function SourceBadge({ source }) {
  const map = {
    recorded: ['Recorded', 'bg-subtle text-brand border-line-strong', 'Logged by you in REPP'],
    'self-reported': ['Self-reported', 'bg-subtle text-data-carbs border-data-carbs', 'From your weekly check-in'],
    profile: ['Profile setting', 'bg-subtle text-muted border-line', 'Your usual value from your profile, not measured this week'],
    none: ['No data', 'bg-subtle text-muted border-line', 'Nothing logged for this metric']
  };
  const [label, cls, title] = map[source] || map.none;
  return <span title={title} className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${cls}`}>{label}</span>;
}

/** good: 'down' | 'up' | 'neutral': which direction counts as progress for this metric and goal. */
function Delta({ value, unit, good = 'neutral' }) {
  if (value == null) return <span className="text-muted">n/a</span>;
  const positive = (good === 'down' && value < 0) || (good === 'up' && value > 0);
  const negative = (good === 'down' && value > 0) || (good === 'up' && value < 0);
  const color = positive ? 'text-brand' : negative ? 'text-warning' : 'text-ink';
  return <span className={`inline-flex items-center gap-1 ${color}`}>{signed(value, unit)}</span>;
}

function MetricCard({ label, value, sub, previous, source, bar, barColor }) {
  return (
    <div className="bg-surface border border-line rounded-sm p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted font-bold">{label}</span>
        <SourceBadge source={source} />
      </div>
      <div className="text-xl font-bold text-ink">{value}</div>
      {bar != null && <ProgressBar pct={bar} color={barColor} />}
      <div className="text-[11px] text-muted space-y-0.5">
        {sub && <div>{sub}</div>}
        {previous && <div>Previous week: {previous}</div>}
      </div>
    </div>
  );
}

function ConfirmDialog({ dialog, onCancel }) {
  const [busy, setBusy] = useState(false);
  if (!dialog) return null;
  const run = async () => {
    setBusy(true);
    try { await dialog.onConfirm(); } finally { setBusy(false); }
  };
  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="bg-surface border border-line rounded-sm p-6 max-w-md w-full space-y-4">
        <h3 id="confirm-title" className="text-base font-bold text-ink">{dialog.title}</h3>
        <div className="text-xs text-body leading-relaxed space-y-2">{dialog.body}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink cursor-pointer">Cancel</button>
          <button onClick={run} disabled={busy}
            className={`px-4 py-2 text-xs font-bold rounded-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 ${dialog.danger ? 'bg-danger hover:bg-danger text-ink' : 'bg-brand hover:bg-brand-hover text-on-brand'}`}>
            {busy && null}{dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- view

export default function AdaptivePlanView() {
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [busyRecId, setBusyRecId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [customizing, setCustomizing] = useState(false);
  const [customForm, setCustomForm] = useState({});
  const [savingCustom, setSavingCustom] = useState(false);
  const [dialog, setDialog] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [viewedPlan, setViewedPlan] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoadError('');
      const [ov, fb] = await Promise.all([api.get('/adaptive/overview'), api.get('/adaptive/feedback')]);
      setOverview(ov);
      setFeedback(fb);
    } catch (err) {
      setLoadError(err.message || 'Could not load your weekly analysis.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const draft = overview?.draft || null;
  const accepted = overview?.accepted || null;
  const plan = viewedPlan || draft || accepted;
  const editable = !viewedPlan && plan?.status === 'draft';
  const a = overview?.analysis;

  const replaceDraft = (p) => setOverview(o => ({ ...o, draft: p }));

  // ---------------- actions

  const generate = async (replace = false) => {
    setGenerating(true);
    try {
      const res = await api.post('/adaptive/plans/generate', { replace });
      replaceDraft(res.plan);
      setViewedPlan(null);
      setCustomizing(false);
      setAiError('');
      showToast('New weekly plan generated from your latest data.', 'success');
    } catch (err) {
      if (err.status === 409 && err.data?.needsConfirmation) {
        setDialog({
          title: 'Replace your draft plan?',
          body: <p>You already have a draft plan with your decisions and changes. Generating again will replace it with a fresh plan based on your latest data. Your accepted plan is not affected.</p>,
          confirmLabel: 'Replace Draft',
          onConfirm: async () => { setDialog(null); await generate(true); }
        });
      } else {
        showToast(err.message || 'Could not generate a plan.', 'error');
      }
    } finally {
      setGenerating(false);
    }
  };

  const decide = async (recId, status) => {
    setBusyRecId(recId);
    try {
      const res = await api.patch(`/adaptive/plans/${draft.id}/recommendations/${recId}`, { status });
      replaceDraft(res.plan);
    } catch (err) {
      showToast(err.message || 'Could not update the recommendation.', 'error');
    } finally {
      setBusyRecId(null);
    }
  };

  const startCustomize = () => {
    setCustomForm({ ...draft.plan.values });
    setCustomizing(true);
  };

  const saveCustom = async () => {
    setSavingCustom(true);
    try {
      const customizations = {};
      for (const f of FIELDS) {
        const v = Number(customForm[f.key]);
        if (!Number.isFinite(v) || v < f.min || v > f.max) {
          showToast(`${f.label} must be between ${f.min} and ${f.max} ${f.unit}.`, 'error');
          setSavingCustom(false);
          return;
        }
        customizations[f.key] = v;
      }
      const res = await api.patch(`/adaptive/plans/${draft.id}`, { customizations });
      replaceDraft(res.plan);
      setCustomizing(false);
      showToast('Plan saved with your changes.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not save your changes.', 'error');
    } finally {
      setSavingCustom(false);
    }
  };

  const confirmReset = () => setDialog({
    title: 'Reset this plan?',
    body: <p>This undoes your accept/reject decisions and custom values and restores the plan exactly as it was generated.</p>,
    confirmLabel: 'Reset Plan',
    onConfirm: async () => {
      try {
        const res = await api.post(`/adaptive/plans/${draft.id}/reset`, {});
        replaceDraft(res.plan);
        setCustomizing(false);
        showToast('Plan reset to the original recommendations.', 'success');
      } catch (err) {
        showToast(err.message || 'Could not reset the plan.', 'error');
      }
      setDialog(null);
    }
  });

  const confirmDiscard = () => setDialog({
    title: 'Discard this draft?',
    danger: true,
    body: <p>The draft plan will be removed. Your current accepted plan and targets stay as they are.</p>,
    confirmLabel: 'Discard Draft',
    onConfirm: async () => {
      try {
        await api.delete(`/adaptive/plans/${draft.id}`);
        replaceDraft(null);
        setCustomizing(false);
        showToast('Draft discarded.', 'success');
      } catch (err) {
        showToast(err.message || 'Could not discard the draft.', 'error');
      }
      setDialog(null);
    }
  });

  const confirmAccept = () => {
    const changes = (draft.comparison || []).filter(r => r.changed);
    const pending = draft.recommendations.filter(r => r.status === 'pending').length;
    setDialog({
      title: 'Accept this plan for the week?',
      body: (
        <>
          {changes.length ? (
            <>
              <p>These targets will replace your current ones:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {changes.map(c => <li key={c.field}><strong className="text-ink">{c.metric}</strong>: {c.previousTarget.toLocaleString()} → {c.upcoming.toLocaleString()} {c.unit}</li>)}
              </ul>
            </>
          ) : <p>Your daily targets stay the same; this week's schedule and goals become your active plan.</p>}
          {pending > 0 && <p>{pending} undecided recommendation{pending === 1 ? '' : 's'} will be accepted too.</p>}
          <p className="text-muted">Calories, protein, water and workout days update everywhere in REPP. Your previous plan is kept in history.</p>
        </>
      ),
      confirmLabel: 'Accept Plan',
      onConfirm: async () => {
        try {
          await api.post(`/adaptive/plans/${draft.id}/accept`, { confirm: true });
          await Promise.all([load(), refreshUser()]);
          setCustomizing(false);
          showToast('Plan accepted. Your targets are updated.', 'success');
        } catch (err) {
          showToast(err.message || 'Could not accept the plan.', 'error');
        }
        setDialog(null);
      }
    });
  };

  const requestAi = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post(`/adaptive/plans/${plan.id}/ai-summary`, {});
      if (viewedPlan) setViewedPlan(res.plan);
      else if (plan.status === 'draft') replaceDraft(res.plan);
      else setOverview(o => ({ ...o, accepted: res.plan }));
    } catch (err) {
      setAiError(err.message || 'The AI summary could not be written.');
    } finally {
      setAiLoading(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    try {
      const res = await api.get('/adaptive/plans');
      setHistory(res.plans);
    } catch (err) {
      showToast(err.message || 'Could not load plan history.', 'error');
      setHistory([]);
    }
  };

  const viewPlan = async (id) => {
    try {
      const res = await api.get(`/adaptive/plans/${id}`);
      setViewedPlan(res.plan.status === 'draft' ? null : res.plan);
      setHistoryOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showToast(err.message || 'Could not open that plan.', 'error');
    }
  };

  const saveFeedback = async (data) => {
    try {
      const res = await api.post('/adaptive/feedback', data);
      setFeedback(f => ({ ...f, feedback: res.feedback }));
      const ov = await api.get('/adaptive/overview');
      setOverview(ov);
      showToast(draft ? 'Check-in saved. Regenerate your plan to use it.' : 'Check-in saved. It will be used in your next plan.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not save your check-in.', 'error');
      throw err;
    }
  };

  // ---------------- render helpers

  if (loading) {
    return (
      <SkeletonPage stats={8} cards={4} label="Analysing your last 7 days" />
    );
  }

  if (loadError || !a) {
    return (
      <ErrorState title="Couldn't load your weekly analysis" message={loadError} onRetry={() => { setLoading(true); load(); }} />
    );
  }

  const goalDir = a.goal === 'fat_loss' ? 'down' : a.goal === 'muscle_gain' ? 'up' : 'neutral';
  const waistDir = a.goal === 'muscle_gain' ? 'neutral' : 'down';
  const t = a.profile.targets;
  const cur = a.current;
  const prev = a.previous;
  const latest = a.body.latest;
  const hasMeas = latest != null;
  const pctOf = (v, target) => (v != null && target ? Math.round((v / target) * 100) : null);

  const metrics = [
    { label: 'Weight (7-day change)', value: hasMeas ? <Delta value={a.body.change7d.weight} unit="kg" good={goalDir} /> : 'n/a', sub: hasMeas ? `Latest ${latest.weight} kg on ${fmtDate(latest.date)}` : 'No weigh-ins yet', previous: a.body.changePrev7d.weight != null ? signed(a.body.changePrev7d.weight, 'kg') : null, source: hasMeas ? 'recorded' : 'none' },
    { label: 'Waist change', value: hasMeas ? <Delta value={a.body.change7d.waist} unit="cm" good={waistDir} /> : 'n/a', sub: latest?.waist != null ? `Now ${latest.waist} cm` : 'Not measured', previous: a.body.changePrev7d.waist != null ? signed(a.body.changePrev7d.waist, 'cm') : null, source: latest?.waist != null ? 'recorded' : 'none' },
    { label: 'Chest change', value: hasMeas ? <Delta value={a.body.change7d.chest} unit="cm" /> : 'n/a', sub: latest?.chest != null ? `Now ${latest.chest} cm` : 'Not measured', source: latest?.chest != null ? 'recorded' : 'none' },
    { label: 'Arm change', value: hasMeas ? <Delta value={a.body.change7d.arms} unit="cm" good={a.goal === 'fat_loss' ? 'neutral' : 'up'} /> : 'n/a', sub: latest?.arms != null ? `Now ${latest.arms} cm` : 'Not measured', source: latest?.arms != null ? 'recorded' : 'none' },
    { label: 'Workout completion', value: a.workouts.completionPct != null ? `${a.workouts.completionPct}%` : 'n/a', sub: `${a.workouts.completed} of ${a.workouts.planned} planned`, previous: a.hasPreviousWeekData && a.workouts.previousCompletionPct != null ? `${a.workouts.previousCompletionPct}% (${a.workouts.previousCompleted} done)` : null, source: 'recorded', bar: a.workouts.completionPct, barColor: 'bg-data-carbs' },
    { label: 'Avg daily calories', value: cur.avgCalories != null ? `${cur.avgCalories.toLocaleString()} kcal` : 'n/a', sub: `Target ${t.calories.toLocaleString()} · logged ${cur.daysWithMeals}/7 days`, previous: prev.avgCalories != null ? `${prev.avgCalories.toLocaleString()} kcal` : null, source: cur.daysWithMeals ? 'recorded' : 'none', bar: pctOf(cur.avgCalories, t.calories), barColor: cur.avgCalories > t.calories * 1.1 ? 'bg-warning' : 'bg-surface' },
    { label: 'Avg daily protein', value: cur.avgProtein != null ? `${cur.avgProtein} g` : 'n/a', sub: `Target ${t.protein} g · hit on ${cur.proteinTargetDays} days`, previous: prev.avgProtein != null ? `${prev.avgProtein} g` : null, source: cur.daysWithMeals ? 'recorded' : 'none', bar: pctOf(cur.avgProtein, t.protein) },
    { label: 'Avg sleep', value: a.recovery.sleepHours != null ? `${a.recovery.sleepHours} h` : 'n/a', sub: a.recovery.sleepSource === 'self-reported' ? 'From your weekly check-in' : a.recovery.sleepSource === 'profile' ? 'Your usual sleep (profile); answer the check-in for this week' : 'Not tracked', source: a.recovery.sleepSource || 'none', bar: a.recovery.sleepHours != null ? (a.recovery.sleepHours / 8) * 100 : null, barColor: 'bg-data-sleep' },
    { label: 'Consistency score', value: a.consistency.score != null ? `${a.consistency.score}/100` : 'n/a', sub: 'Workouts 40% · meal logging 25% · protein 20% · water 15%', previous: a.consistency.previousScore != null ? `${a.consistency.previousScore}/100` : null, source: a.consistency.score != null ? 'recorded' : 'none', bar: a.consistency.score }
  ];

  const insightStyle = {
    positive: ['Good', 'text-brand'],
    warning: ['Needs attention', 'text-warning'],
    info: ['Note', 'text-muted']
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-surface border border-line rounded-sm p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink">Your Week in Review</h2>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {fmtDate(a.window.current.start)} – {fmtDate(a.window.current.end)} compared with {fmtDate(a.window.previous.start)} – {fmtDate(a.window.previous.end)} · Goal: <strong className="text-ink">{a.goalLabel}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => generate(false)} disabled={generating}
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2 disabled:opacity-60">
            
            {generating ? 'Building your plan…' : draft ? 'Regenerate Recommendations' : 'Generate New Plan'}
          </button>
          <button onClick={openHistory}
            className="px-4 py-2.5 bg-subtle hover:bg-subtle-hover border border-line text-ink font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-2">
             Previous Plans{overview.historyCount ? ` (${overview.historyCount})` : ''}
          </button>
        </div>
      </div>

      {/* Missing data: ask for it instead of guessing */}
      {a.dataGaps.length > 0 && (
        <div className="p-4 bg-subtle border border-warning rounded-sm space-y-2">
          <div className="text-xs font-bold text-warning flex items-center gap-2"> To make your plan more accurate</div>
          <ul className="space-y-1.5">
            {a.dataGaps.map(g => (
              <li key={g.key} className="text-xs text-body flex items-start gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                <span>{g.message} <strong className="text-ink">{g.action}</strong></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress overview */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-ink">Weekly Progress Overview</h3>
          <span className="text-[11px] text-muted">Every value comes from your own logs. Labels show where each one came from.</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {metrics.map(m => <MetricCard key={m.label} {...m} />)}
        </div>
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-line rounded-sm p-5">
          <DailyBarChart days={cur.daily} valueKey="calories" target={t.calories} unit="kcal" label="Calories per day" color="var(--color-data-calories)" previousAvg={prev.avgCalories} />
        </div>
        <div className="bg-surface border border-line rounded-sm p-5">
          <DailyBarChart days={cur.daily} valueKey="protein" target={t.protein} unit="g" label="Protein per day" color="var(--color-brand)" previousAvg={prev.avgProtein} />
        </div>
        <div className="bg-surface border border-line rounded-sm p-5">
          <WeightTrendChart points={a.body.recent} />
        </div>
        <div className="bg-surface border border-line rounded-sm p-5 space-y-3">
          <DailyBarChart days={cur.daily} valueKey="water" target={t.water} unit="ml" label="Water per day" color="var(--color-data-water)" previousAvg={prev.avgWater} />
          <div className="flex gap-1.5" aria-label="Workouts this week">
            {cur.daily.map(d => (
              <div key={d.date} title={d.workout || 'No workout'} className={`flex-1 rounded-sm py-1.5 text-center text-[10px] font-bold ${d.workout ? 'bg-subtle text-data-carbs border border-data-carbs' : 'bg-subtle text-muted border border-line'}`}>
                {new Date(`${d.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' })}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-muted">Highlighted days = workout logged ({a.workouts.completed}/{a.workouts.planned})</div>
        </div>
      </section>

      {/* Insights */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-ink">Progress Insights</h3>
        {overview.insights.length === 0 ? (
          <div className="bg-surface border border-line rounded-sm p-5 text-xs text-muted">Not enough data for insights yet. Log meals, workouts and a weigh-in this week.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.insights.map((ins, i) => {
              const [toneLabel, color] = insightStyle[ins.tone];
              return (
                <div key={i} className="bg-surface border border-line rounded-sm p-4">
                  <div className="text-xs space-y-1">
                    <div className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{toneLabel}</div>
                    <div className="font-bold text-ink">{ins.title}</div>
                    <div className="text-muted leading-relaxed">{ins.detail}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Weekly check-in */}
      <section className="bg-surface border border-line rounded-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-ink flex items-center gap-2"> Weekly Check-in</h3>
          <span className="text-[11px] text-muted">Self-reported · used to adjust your next plan</span>
        </div>
        <WeeklyFeedbackForm
          key={feedback?.feedback?.id || 'new'}
          existing={feedback?.feedback}
          weekLabel={`${fmtDate(feedback?.weekStart)} – ${fmtDate(feedback?.weekEnd)}`}
          onSubmit={saveFeedback}
        />
      </section>

      {/* Plan */}
      <section className="space-y-4">
        {viewedPlan && (
          <div className="p-3 bg-subtle border border-data-carbs rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-data-carbs">
            <span>Viewing your {viewedPlan.status} plan for {fmtDate(viewedPlan.weekStart)} – {fmtDate(viewedPlan.weekEnd)} (read-only).</span>
            <button onClick={() => setViewedPlan(null)} className="px-3 py-1.5 bg-subtle border border-line rounded-sm font-bold text-ink cursor-pointer">Back to current plan</button>
          </div>
        )}

        {!plan ? (
          <div className="bg-surface border border-line rounded-sm p-8 sm:p-10 text-center space-y-3">
            
            <h3 className="text-lg font-bold text-ink">No plan for this week yet</h3>
            <p className="text-xs text-muted max-w-md mx-auto">Generate a plan built from the analysis above. Nothing changes until you review and accept it.</p>
            <button onClick={() => generate(false)} disabled={generating}
              className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm cursor-pointer inline-flex items-center gap-2 disabled:opacity-60">
               Generate New Plan
            </button>
          </div>
        ) : (
          <>
            {/* Status + controls */}
            <div className={`p-4 rounded-sm border flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${plan.status === 'draft' ? 'bg-subtle border-line-strong' : 'bg-subtle border-brand'}`}>
              <div className="text-xs">
                <div className="font-bold text-ink">
                  {plan.status === 'draft' ? 'Draft plan: review, then accept' : plan.status === 'accepted' ? 'Active plan' : `Past plan (${plan.status})`}
                </div>
                <div className="text-muted">
                  {plan.status === 'draft'
                    ? `Generated ${new Date(plan.createdAt).toLocaleString()} · your targets don't change until you accept`
                    : `Accepted ${plan.acceptedAt ? new Date(plan.acceptedAt).toLocaleDateString() : ''}`}
                  {plan.status === 'accepted' && draft && !viewedPlan ? ' · you also have a draft below' : ''}
                </div>
              </div>
              {editable && (
                <div className="flex flex-wrap gap-2">
                  <button onClick={customizing ? () => setCustomizing(false) : startCustomize} className="px-3 py-2 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-xs font-bold text-ink flex items-center gap-1.5 cursor-pointer">
                     {customizing ? 'Close Customize' : 'Customize Plan'}
                  </button>
                  <button onClick={confirmReset} className="px-3 py-2 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-xs font-bold text-ink flex items-center gap-1.5 cursor-pointer">
                     Reset Plan
                  </button>
                  <button onClick={confirmDiscard} className="px-3 py-2 bg-subtle hover:bg-subtle border border-line hover:border-danger rounded-sm text-xs font-bold text-muted hover:text-danger flex items-center gap-1.5 cursor-pointer">
                    <Trash className="w-3.5 h-3.5" /> Discard
                  </button>
                  <button onClick={confirmAccept} className="px-4 py-2 bg-brand hover:bg-brand-hover text-on-brand rounded-sm text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                     Accept Plan
                  </button>
                </div>
              )}
            </div>

            {/* Customize editor */}
            {editable && customizing && (
              <div className="bg-surface border border-line rounded-sm p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-ink">Customize this week's targets</h4>
                  <p className="text-[11px] text-muted">Your values override the recommendations. The schedule and meals update when you save.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {FIELDS.map(f => (
                    <label key={f.key} className="space-y-1 text-xs block">
                      <span className="font-bold text-muted">{f.label} <span className="font-normal">({f.unit})</span></span>
                      <input type="number" min={f.min} max={f.max} step={f.step} value={customForm[f.key] ?? ''}
                        onChange={(e) => setCustomForm(c => ({ ...c, [f.key]: e.target.value }))}
                        className="w-full bg-white border border-line-strong rounded-sm px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand" />
                      {draft.customizations?.[f.key] != null && <span className="text-[10px] text-brand">Custom value</span>}
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setCustomizing(false)} className="px-4 py-2 text-xs font-bold text-muted hover:text-ink cursor-pointer">Cancel</button>
                  <button onClick={saveCustom} disabled={savingCustom} className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm flex items-center gap-2 cursor-pointer disabled:opacity-60">
                     Save Plan
                  </button>
                </div>
              </div>
            )}

            <PlanDetails
              plan={plan}
              editable={editable}
              busyRecId={busyRecId}
              onDecide={decide}
              onRequestAi={requestAi}
              aiLoading={aiLoading}
              aiError={aiError}
            />
          </>
        )}
      </section>

      <MedicalDisclaimer compact={true} />

      {/* History */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="history-title">
          <div className="bg-surface border border-line rounded-sm p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="history-title" className="text-base font-bold text-ink">Previous Plans</h3>
              <button onClick={() => setHistoryOpen(false)} className="text-muted hover:text-ink cursor-pointer" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            {history == null ? (
              <SkeletonRows rows={3} />
            ) : history.length === 0 ? (
              <p className="text-xs text-muted">No plans yet. Accepted plans are kept here week by week.</p>
            ) : (
              <div className="space-y-2">
                {history.map(h => (
                  <button key={h.id} onClick={() => viewPlan(h.id)} className="w-full text-left p-3 bg-subtle hover:bg-subtle-hover border border-line rounded-sm flex items-center justify-between gap-3 cursor-pointer">
                    <div className="text-xs min-w-0">
                      <div className="font-bold text-ink">{fmtDate(h.weekStart)} – {fmtDate(h.weekEnd)}</div>
                      <div className="text-muted">
                        {h.values ? `${h.values.calories.toLocaleString()} kcal · ${h.values.protein} g protein · ${h.values.workoutDays} days` : ''}
                        {` · ${h.recommendations.accepted} accepted, ${h.recommendations.rejected} rejected`}
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm shrink-0 ${h.status === 'accepted' ? 'bg-subtle text-brand' : h.status === 'draft' ? 'bg-subtle text-brand' : 'bg-line text-muted'}`}>{h.status === 'accepted' ? 'active' : h.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog dialog={dialog} onCancel={() => setDialog(null)} />
    </div>
  );
}

import React, { useState } from 'react';
import { Check, ChevronDown, X } from '../../components/ui/icons';

const CATEGORY = {
  nutrition: { label: 'Nutrition', color: 'text-muted' },
  workout: { label: 'Workout', color: 'text-muted' },
  recovery: { label: 'Recovery', color: 'text-muted' },
  hydration: { label: 'Hydration', color: 'text-muted' },
  tracking: { label: 'Tracking', color: 'text-muted' }
};
const PRIORITY = {
  high: 'bg-subtle text-danger border-danger',
  medium: 'bg-subtle text-warning border-warning',
  low: 'bg-subtle text-muted border-line'
};
const UNITS = { calories: 'kcal', protein: 'g', workoutDays: 'days', cardioMinutes: 'min/wk', waterMl: 'ml', sleepHours: 'h' };
const fmtNum = (n) => (typeof n === 'number' ? n.toLocaleString() : n ?? 'n/a');
const fmtDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

// ---------------------------------------------------------------- AI note

function AiCoachNote({ plan, onRequestAi, aiLoading, aiError }) {
  return (
    <div className="bg-surface border border-line rounded-sm p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-ink flex items-center gap-2"> AI Coach Note</h4>
        <span className="text-[10px] text-muted bg-subtle border border-line px-2 py-0.5 rounded-sm">
          {plan.aiSummary ? `AI-written by ${plan.aiSummaryModel} · based only on the numbers below` : 'Optional · written by your local AI model'}
        </span>
      </div>
      {plan.aiSummary ? (
        <div className="space-y-2 text-xs text-body leading-relaxed">
          <p>{plan.aiSummary.summary}</p>
          {plan.aiSummary.focus?.length > 0 && (
            <ul className="list-disc pl-5 space-y-1">{plan.aiSummary.focus.map((f, i) => <li key={i}>{f}</li>)}</ul>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Your plan below is fully calculated from your data. The AI can add a short written summary; it does not change any numbers.
        </p>
      )}
      {aiError && <p className="text-xs text-warning">{aiError}</p>}
      <button
        onClick={onRequestAi}
        disabled={aiLoading}
        className="px-4 py-2 bg-subtle hover:bg-subtle-hover border border-line rounded-sm text-xs font-bold text-ink flex items-center gap-2 cursor-pointer disabled:opacity-60"
      >
        
        {aiLoading ? 'Writing summary (about a minute)…' : plan.aiSummary ? 'Rewrite AI summary' : 'Write AI summary'}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- recommendations

function RecommendationCard({ rec, editable, busy, onDecide }) {
  const [open, setOpen] = useState(rec.priority === 'high');
  const cat = CATEGORY[rec.category] || CATEGORY.tracking;
  const statusStyle = rec.status === 'accepted' ? 'border-brand' : rec.status === 'rejected' ? 'border-line opacity-60' : 'border-line';

  return (
    <div className={`bg-surface border rounded-sm transition ${statusStyle}`}>
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${PRIORITY[rec.priority]}`}>{rec.priority}</span>
            <span className="text-[10px] uppercase font-bold text-muted">{cat.label}</span>
            {rec.status !== 'pending' && (
              <span className={`text-[10px] uppercase font-bold ${rec.status === 'accepted' ? 'text-brand' : 'text-muted'}`}>· {rec.status}</span>
            )}
          </div>
          <button onClick={() => setOpen(o => !o)} className="text-left w-full flex items-start justify-between gap-2 cursor-pointer" aria-expanded={open}>
            <span className={`text-sm font-bold ${rec.status === 'rejected' ? 'text-muted line-through' : 'text-ink'}`}>{rec.title}</span>
            <ChevronDown className={`w-4 h-4 text-muted shrink-0 mt-0.5 transition ${open ? '' : ''}`} />
          </button>
          {rec.change && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-subtle border border-line rounded-sm px-2 py-1">
              <span className="text-muted">{fmtNum(rec.change.from)}</span>
              
              <span className="text-ink font-bold">{fmtNum(rec.change.to)}</span>
              <span className="text-muted">{UNITS[rec.change.field]}</span>
            </div>
          )}
          {open && (
            <div className="text-xs leading-relaxed space-y-1.5 pt-1">
              <p className="text-body">{rec.detail}</p>
              <p className="text-muted"><strong className="text-ink">Why: </strong>{rec.reason}</p>
            </div>
          )}
        </div>
        {editable && (
          <div className="flex flex-col sm:flex-row gap-1.5 shrink-0">
            <button
              onClick={() => onDecide(rec.id, rec.status === 'accepted' ? 'pending' : 'accepted')}
              disabled={busy}
              aria-pressed={rec.status === 'accepted'}
              title="Accept this recommendation"
              className={`w-8 h-8 rounded-sm border flex items-center justify-center cursor-pointer transition disabled:opacity-50 ${rec.status === 'accepted' ? 'bg-brand border-brand text-on-brand' : 'bg-subtle border-line text-muted hover:text-brand hover:border-brand'}`}
            >
              {busy ? null : <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onDecide(rec.id, rec.status === 'rejected' ? 'pending' : 'rejected')}
              disabled={busy}
              aria-pressed={rec.status === 'rejected'}
              title="Reject this recommendation"
              className={`w-8 h-8 rounded-sm border flex items-center justify-center cursor-pointer transition disabled:opacity-50 ${rec.status === 'rejected' ? 'bg-subtle border-danger text-ink' : 'bg-subtle border-line text-muted hover:text-danger hover:border-danger'}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- comparison

function ComparisonTable({ rows }) {
  return (
    <div className="bg-surface border border-line rounded-sm p-5 space-y-3">
      <h4 className="text-sm font-bold text-ink">Last Week vs Upcoming Week</h4>
      <div className="sm:hidden space-y-2">
        {rows.map(r => (
          <div key={r.field} className={`p-3 rounded-sm border text-xs space-y-1 ${r.changed ? 'border-line-strong bg-subtle' : 'border-line bg-subtle'}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-bold text-ink">{r.metric}</span>
              <span className="font-mono whitespace-nowrap">
                <span className="text-muted">{fmtNum(r.previousTarget)}</span>
                
                <span className={`font-bold ${r.changed ? 'text-brand' : 'text-ink'}`}>{fmtNum(r.upcoming)}</span>
                <span className="text-muted"> {r.unit}</span>
              </span>
            </div>
            <div className="text-muted">Last week actual: {r.previousActual}</div>
            <div className="text-muted leading-relaxed">{r.reason}</div>
          </div>
        ))}
      </div>
      <div className="hidden sm:block overflow-x-auto -mx-1">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="text-[10px] uppercase text-muted text-left">
              <th className="py-2 px-2 font-bold">Metric</th>
              <th className="py-2 px-2 font-bold">Last week target</th>
              <th className="py-2 px-2 font-bold">Last week actual</th>
              <th className="py-2 px-2 font-bold">Upcoming</th>
              <th className="py-2 px-2 font-bold">Why</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.field} className={`border-t border-line align-top ${r.changed ? 'bg-subtle' : ''}`}>
                <td className="py-2.5 px-2 font-bold text-ink whitespace-nowrap">{r.metric}</td>
                <td className="py-2.5 px-2 font-mono text-muted whitespace-nowrap">{fmtNum(r.previousTarget)} {r.unit}</td>
                <td className="py-2.5 px-2 text-muted">{r.previousActual}</td>
                <td className={`py-2.5 px-2 font-mono font-bold whitespace-nowrap ${r.changed ? 'text-brand' : 'text-ink'}`}>
                  {fmtNum(r.upcoming)} {r.unit}{r.changed && <span className="ml-1 text-[10px] uppercase">changed</span>}
                </td>
                <td className="py-2.5 px-2 text-muted leading-relaxed">{r.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- plan tabs

function NutritionTab({ n }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[['Calories', `${fmtNum(n.calories)} kcal`], ['Protein', `${n.protein} g`], ['Carbs', `${n.carbs} g`], ['Fats', `${n.fats} g`], ['Water', `${(n.waterMl / 1000).toFixed(2)} L`]].map(([l, v]) => (
          <div key={l} className="bg-subtle rounded-sm p-3 text-center">
            <div className="text-[10px] uppercase font-bold text-muted">{l}</div>
            <div className="text-sm font-bold text-ink mt-0.5">{v}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h5 className="text-xs font-bold text-ink uppercase tracking-wider">Example day ({n.dietPreference}{n.budgetMode ? ', budget-friendly' : ''})</h5>
          <span className="text-[11px] text-muted font-mono">≈ {fmtNum(n.sampleDayTotals.calories)} kcal · {n.sampleDayTotals.protein} g protein · ₹{n.sampleDayTotals.costInr}</span>
        </div>
        {n.sampleDay.map((m, i) => (
          <div key={i} className="p-3 bg-subtle rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold text-brand">{m.label}</div>
              <div className="font-bold text-ink">{m.name}</div>
              <div className="text-muted">{m.portion}{m.alternatives?.length ? ` · or: ${m.alternatives.join(', ')}` : ''}</div>
            </div>
            <div className="font-mono text-muted shrink-0">{m.calories} kcal · {m.protein} g · ₹{m.costInr}</div>
          </div>
        ))}
        {n.proteinTopUp && <p className="text-xs text-warning">{n.proteinTopUp}</p>}
        <p className="text-[11px] text-muted">Portions are approximate. Your Diet Planner tab still generates your detailed daily meals.</p>
      </div>
      {n.proteinSources?.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold text-ink uppercase tracking-wider">Affordable protein sources for you</h5>
          <div className="flex flex-wrap gap-2">
            {n.proteinSources.map(s => (
              <span key={s.name} className="text-[11px] bg-subtle border border-line rounded-sm px-2 py-1 text-body">{s.name}: {s.protein} <span className="text-muted">({s.costNote})</span></span>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        <h5 className="text-xs font-bold text-ink uppercase tracking-wider">Food substitutions</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {n.substitutions.map((s, i) => (
            <div key={i} className="p-3 bg-subtle rounded-sm text-xs">
              <div className="text-ink"><span className="text-muted">Instead of</span> {s.instead}  <strong>{s.use}</strong></div>
              <div className="text-muted mt-0.5">{s.why}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkoutTab({ w }) {
  const [openDay, setOpenDay] = useState(w.schedule.findIndex(d => d.type === 'training'));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="bg-subtle border border-line rounded-sm px-2 py-1 text-ink"><strong>{w.daysPerWeek}</strong> training days · {w.splitName}</span>
        <span className="bg-subtle border border-line rounded-sm px-2 py-1 text-ink"><strong>{w.cardioMinutesPerWeek}</strong> min cardio · {w.cardioType}</span>
        {w.deload && <span className="bg-subtle border border-warning rounded-sm px-2 py-1 text-warning">Lighter week: one fewer set per exercise</span>}
      </div>
      <div className="space-y-2">
        {w.schedule.map((d, i) => {
          const open = openDay === i;
          const expandable = d.exercises.length > 0;
          return (
            <div key={d.date} className="bg-subtle rounded-sm border border-line">
              <button onClick={() => expandable && setOpenDay(open ? -1 : i)} aria-expanded={expandable ? open : undefined}
                className={`w-full p-3 flex items-center justify-between gap-3 text-left ${expandable ? 'cursor-pointer' : 'cursor-default'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase font-bold text-muted">{fmtDate(d.date)}</div>
                    <div className="text-sm font-bold text-ink truncate">{d.title}{d.note && <span className="ml-2 text-[10px] text-warning font-bold uppercase">{d.note}</span>}</div>
                    <div className="text-[11px] text-muted truncate">{d.focus}{d.cardio && d.type === 'training' ? ` · +${d.cardio.minutes} min cardio` : ''}</div>
                  </div>
                </div>
                {expandable && <ChevronDown className={`w-4 h-4 text-muted shrink-0 transition ${open ? '' : ''}`} />}
              </button>
              {open && expandable && (
                <div className="px-3 pb-3">
                  <ul className="sm:hidden space-y-1.5">
                    {d.exercises.map(e => (
                      <li key={e.name} className="border-t border-line pt-1.5 text-xs">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-bold text-ink">{e.name}</span>
                          <span className="font-mono text-brand whitespace-nowrap">{e.sets} × {e.reps}</span>
                        </div>
                        <div className="text-muted">{e.muscles} · rest {e.rest}</div>
                      </li>
                    ))}
                  </ul>
                  <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-xs min-w-[460px]">
                    <thead><tr className="text-[10px] uppercase text-muted text-left"><th className="py-1.5 font-bold">Exercise</th><th className="py-1.5 font-bold">Target muscles</th><th className="py-1.5 font-bold">Sets × reps</th><th className="py-1.5 font-bold">Rest</th></tr></thead>
                    <tbody>
                      {d.exercises.map(e => (
                        <tr key={e.name} className="border-t border-line">
                          <td className="py-2 font-bold text-ink">{e.name}</td>
                          <td className="py-2 text-muted">{e.muscles}</td>
                          <td className="py-2 font-mono text-brand">{e.sets} × {e.reps}</td>
                          <td className="py-2 text-muted">{e.rest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {d.cardio && <p className="text-[11px] text-data-carbs mt-2">Then {d.cardio.minutes} min {d.cardio.type.toLowerCase()} ({d.cardio.note.toLowerCase()}).</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecoveryTab({ r }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
      <div className="bg-subtle rounded-sm p-4 space-y-2">
        <div className="flex items-center gap-2 font-bold text-ink"> Sleep: {r.sleepTargetHours} h/night</div>
        <ul className="list-disc pl-5 space-y-1 text-body">{r.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
      <div className="bg-subtle rounded-sm p-4 space-y-2">
        <div className="flex items-center gap-2 font-bold text-ink"> Rest-day activities</div>
        <ul className="list-disc pl-5 space-y-1 text-body">{r.restDayActivities.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
      <div className="bg-subtle rounded-sm p-4 space-y-2">
        <div className="flex items-center gap-2 font-bold text-ink"> Recovery</div>
        <ul className="list-disc pl-5 space-y-1 text-body">{r.suggestions.map((t, i) => <li key={i}>{t}</li>)}</ul>
      </div>
    </div>
  );
}

function GoalsTab({ goals }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {goals.map(g => (
        <div key={g.label} className="bg-subtle rounded-sm p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-brand"> {g.label}</div>
          <div className="text-sm font-bold text-ink">{g.target}</div>
          <div className="text-muted">{g.why}</div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { key: 'workouts', label: 'Workouts' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'goals', label: 'Weekly Goals' }
];

export default function PlanDetails({ plan, editable, busyRecId, onDecide, onRequestAi, aiLoading, aiError }) {
  const [tab, setTab] = useState('workouts');
  const p = plan.plan;
  const pending = plan.recommendations.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <AiCoachNote plan={plan} onRequestAi={onRequestAi} aiLoading={aiLoading} aiError={aiError} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-bold text-ink">Recommendations</h3>
          {editable && plan.recommendations.length > 0 && (
            <span className="text-[11px] text-muted">Tick to accept, cross to reject. {pending ? `${pending} undecided (accepted if you accept the whole plan).` : 'All decided.'}</span>
          )}
        </div>
        {plan.recommendations.length === 0 ? (
          <div className="bg-surface border border-line rounded-sm p-5 text-xs text-muted">No changes recommended: your current targets suit your recent progress. Keep going.</div>
        ) : (
          <div className="space-y-2">
            {plan.recommendations.map(r => (
              <RecommendationCard key={r.id} rec={r} editable={editable} busy={busyRecId === r.id} onDecide={onDecide} />
            ))}
          </div>
        )}
      </section>

      {plan.comparison?.length > 0 && <ComparisonTable rows={plan.comparison} />}

      <section className="bg-surface border border-line rounded-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-ink">Plan for {fmtDate(p.weekStart)} – {fmtDate(p.weekEnd)}</h3>
          <div className="flex bg-page p-1 rounded-sm border border-line overflow-x-auto" role="tablist">
            {TABS.map(t => {
              return (
                <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-sm transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${tab === t.key ? 'bg-brand text-on-brand' : 'text-muted hover:text-ink'}`}>
                   {t.label}
                </button>
              );
            })}
          </div>
        </div>
        {tab === 'workouts' && <WorkoutTab w={p.workouts} />}
        {tab === 'nutrition' && <NutritionTab n={p.nutrition} />}
        {tab === 'recovery' && <RecoveryTab r={p.recovery} />}
        {tab === 'goals' && <GoalsTab goals={p.goals} />}
      </section>
    </div>
  );
}

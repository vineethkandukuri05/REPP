import React from 'react';

/** Milestones as a plain table-style list: name, what it takes, status. */
export default function GamificationBadges({ badges }) {
  const unlocked = badges.filter(b => b.unlocked).length;
  return (
    <section className="bg-surface border border-line rounded-sm p-6" aria-labelledby="milestones-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="milestones-heading" className="text-lg font-bold text-ink">Milestones</h3>
        <span className="text-sm text-muted">{unlocked} of {badges.length} reached</span>
      </div>

      {badges.length === 0 ? (
        <p className="mt-3 text-sm text-body">No milestones yet. Keep logging meals and workouts.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {badges.map((badge) => (
            <li key={badge.id} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className={`text-sm font-bold ${badge.unlocked ? 'text-ink' : 'text-muted'}`}>{badge.title}</div>
                <div className="text-sm text-muted">{badge.desc}</div>
              </div>
              <span className={`shrink-0 text-xs font-bold ${badge.unlocked ? 'text-brand' : 'text-muted'}`}>
                {badge.unlocked ? 'Reached' : 'Not yet'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

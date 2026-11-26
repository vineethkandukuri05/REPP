/**
 * Loading, empty and error states shared by every page that fetches data.
 * Skeletons are static grey blocks shaped like the final layout (no animation).
 */
import React from 'react';

export function SkeletonBlock({ className = 'h-4 w-full' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/** Card-shaped skeleton: a title line and a few text lines. */
export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`bg-surface border border-line rounded-sm p-6 space-y-3 ${className}`} aria-hidden="true">
      <SkeletonBlock className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Page-level skeleton: a heading row, a stat row and content cards. */
export function SkeletonPage({ stats = 4, cards = 2, label = 'Loading' }) {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="bg-surface border border-line rounded-sm p-6 space-y-3" aria-hidden="true">
        <SkeletonBlock className="h-7 w-1/3" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>
      {stats > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="bg-surface border border-line rounded-sm p-4 space-y-2">
              <SkeletonBlock className="h-3 w-1/2" />
              <SkeletonBlock className="h-6 w-2/3" />
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: cards }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
      </div>
    </div>
  );
}

/** Table/list skeleton rows. */
export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="divide-y divide-line border border-line rounded-sm bg-surface" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 p-4">
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, children, action = null }) {
  return (
    <div className="bg-surface border border-line rounded-sm p-8 space-y-3">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {children && <div className="text-sm text-body max-w-prose">{children}</div>}
      {action}
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="bg-surface border border-danger rounded-sm p-6 space-y-3" role="alert">
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {message && <p className="text-sm text-body">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="px-6 py-3 border border-ink text-ink text-sm font-bold rounded-sm hover:bg-subtle cursor-pointer">
          Try again
        </button>
      )}
    </div>
  );
}

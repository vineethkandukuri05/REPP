import React from 'react';

// Catches rendering errors in a page so one broken view doesn't blank the whole app.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Navigating to another page clears the error.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="bg-surface border border-danger rounded-sm p-8 sm:p-10 text-center space-y-4 max-w-xl mx-auto mt-8">
        
        <h2 className="text-lg font-bold text-ink">This page ran into a problem</h2>
        <p className="text-xs text-muted leading-relaxed">
          Something went wrong while showing this page. Your data is safe. Try reloading, or use the menu to open another page.
        </p>
        <p className="text-[11px] font-mono text-danger break-words">{String(this.state.error?.message || this.state.error)}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-on-brand font-bold text-xs rounded-sm transition cursor-pointer inline-flex items-center gap-2"
        >
           Reload Page
        </button>
      </div>
    );
  }
}

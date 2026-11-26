import React, { useEffect, useRef, useState } from 'react';
import api from '../api/client';

const GSI_SRC = 'https://accounts.google.com/gsi/client';
let gsiPromise = null;

/** Loads Google Identity Services once per page. */
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GSI_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error('Google sign-in failed to load')));
      s.onerror = () => {
        gsiPromise = null;
        reject(new Error('Could not load Google sign-in. Check your internet connection.'));
      };
      document.head.appendChild(s);
    });
  }
  return gsiPromise;
}


/**
 * "Continue with Google" using Google's official rendered button (Google Identity Services).
 * Google returns a signed ID token; it's sent to our server, which verifies it and starts the
 * normal REPP session. The client ID comes from the server (/api/auth/config); no secret is used.
 */
export default function GoogleSignInButton({ onCredential, busy = false, text = 'continue_with' }) {
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [status, setStatus] = useState('loading'); // loading | ready | disabled | error
  const [error, setError] = useState('');
  const [clientId, setClientId] = useState(null);

  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    api.get('/auth/config')
      .then(cfg => {
        if (cancelled) return;
        if (!cfg?.googleEnabled || !cfg.googleClientId) { setStatus('disabled'); return; }
        setClientId(cfg.googleClientId);
      })
      .catch(() => !cancelled && setStatus('disabled'));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let observer;

    const render = (google) => {
      const el = containerRef.current;
      if (!el) return;
      const width = Math.max(200, Math.min(400, Math.floor(el.parentElement?.clientWidth || el.clientWidth || 320)));
      el.innerHTML = '';
      google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        logo_alignment: 'left',
        width
      });
    };

    loadGsi()
      .then(google => {
        if (cancelled) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential) callbackRef.current?.(response.credential);
            else setError('Google sign-in was cancelled or failed. Please try again.');
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_button: true
        });
        render(google);
        setStatus('ready');
        // Re-render at the new width when the layout changes (e.g. phone rotation).
        let last = containerRef.current?.parentElement?.clientWidth;
        observer = new ResizeObserver(() => {
          const w = containerRef.current?.parentElement?.clientWidth;
          if (w && Math.abs(w - last) > 24) { last = w; render(google); }
        });
        if (containerRef.current?.parentElement) observer.observe(containerRef.current.parentElement);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [clientId, text]);

  if (status === 'disabled') {
    return (
      <div className="space-y-1.5">
        <button type="button" disabled
          className="w-full py-3 rounded-sm bg-page border border-line text-muted text-sm font-bold flex items-center justify-center gap-2.5 opacity-60 cursor-not-allowed">
          Continue with Google
        </button>
        <p className="text-xs text-center text-muted">Google sign-in isn't set up on this server yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative min-h-[44px] flex justify-center">
        {status === 'loading' && (
          <div className="absolute inset-0 rounded-sm bg-page border border-line flex items-center justify-center gap-2 text-xs text-muted">
            Loading Google sign-in…
          </div>
        )}
        <div ref={containerRef} className={`${busy ? 'pointer-events-none opacity-50' : ''} flex justify-center w-full`} />
        {busy && (
          <div className="absolute inset-0 rounded-sm bg-surface border border-line flex items-center justify-center gap-2 text-sm text-ink font-bold">
            Signing you in…
          </div>
        )}
      </div>
      {(status === 'error' || error) && <p className="text-[11px] text-center text-danger">{error}</p>}
    </div>
  );
}

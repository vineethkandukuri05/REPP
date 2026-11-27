import React, { useState } from 'react';
import api from '../api/client';

const inputClass = 'w-full px-3 py-3 bg-white border border-line-strong rounded-sm text-ink text-base placeholder-muted focus:outline-none focus:border-brand';
const primaryBtn = 'w-full px-6 py-3 bg-brand hover:bg-brand-hover disabled:opacity-60 text-on-brand font-bold text-base rounded-sm cursor-pointer';
const linkBtn = 'text-sm text-brand underline underline-offset-4 hover:text-brand-hover cursor-pointer disabled:opacity-60';

/**
 * Two steps: send a 6-digit code to the email, then enter the code with a new password.
 * onDone(email) is called after the password changes; onCancel returns to the login form.
 */
export default function ForgotPasswordPanel({ initialEmail = '', onDone, onCancel }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const sendCode = async (e) => {
    e?.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setNotice(res.message);
      setStep('code');
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { email, code: code.trim(), newPassword: password });
      onDone(email);
    } catch (err) {
      setError(err.message || 'Could not change the password. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-ink">Reset your password</h2>
      <p className="mt-2 text-sm text-body">
        {step === 'email'
          ? 'Enter the email you signed up with. We will send you a 6-digit code.'
          : `Enter the code sent to ${email} and choose a new password.`}
      </p>

      {error && (
        <div className="mt-5 p-3 bg-surface border border-danger text-danger text-sm rounded-sm" role="alert">{error}</div>
      )}
      {notice && step === 'code' && !error && (
        <div className="mt-5 p-3 bg-subtle border border-line-strong text-body text-sm rounded-sm" role="status">{notice}</div>
      )}

      {step === 'email' ? (
        <form onSubmit={sendCode} className="mt-6 space-y-5">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-bold text-ink mb-2">Email address</label>
            <input id="reset-email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
          </div>
          <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Sending code…' : 'Send code'}</button>
        </form>
      ) : (
        <form onSubmit={changePassword} className="mt-6 space-y-5">
          <div>
            <label htmlFor="reset-code" className="block text-sm font-bold text-ink mb-2">6-digit code</label>
            <input id="reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" required maxLength={6}
              pattern="\d{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456" className={`${inputClass} tracking-[0.3em]`} />
          </div>
          <div>
            <label htmlFor="reset-password" className="block text-sm font-bold text-ink mb-2">New password</label>
            <input id="reset-password" type="password" required minLength={6} autoComplete="new-password" value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            <p className="mt-1 text-xs text-muted">At least 6 characters.</p>
          </div>
          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-bold text-ink mb-2">Confirm new password</label>
            <input id="reset-confirm" type="password" required minLength={6} autoComplete="new-password" value={confirm}
              onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Changing password…' : 'Change password'}</button>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button type="button" onClick={sendCode} disabled={busy} className={linkBtn}>Send a new code</button>
            <button type="button" onClick={() => { setStep('email'); setError(''); setCode(''); }} className={linkBtn}>Use a different email</button>
          </div>
        </form>
      )}

      <button type="button" onClick={onCancel} className={`${linkBtn} mt-6 block`}>Back to log in</button>
    </div>
  );
}

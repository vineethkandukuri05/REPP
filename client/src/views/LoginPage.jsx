import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';
import GoogleSignInButton from '../components/GoogleSignInButton';
import ForgotPasswordPanel from '../components/ForgotPasswordPanel';

export default function LoginPage() {
  const location = useLocation();
  // "Create your own account" from the demo banner opens the sign-up tab.
  const [isLogin, setIsLogin] = useState(!location.state?.signup);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgot, setForgot] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register, loginWithGoogle, loginAsDemo } = useAuth();
  const [demoBusy, setDemoBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
        showToast('Signed in.', 'success');
        navigate(from, { replace: true });
      } else {
        if (!name.trim()) {
          setErrorMessage('Please enter your full name');
          setLoading(false);
          return;
        }
        await register({ email, password, name });
        showToast('Account created. Next, set up your profile.', 'success');
        navigate('/onboarding', { replace: true });
      }
    } catch (err) {
      const msg = err.message || (isLogin ? 'Login failed' : 'Registration failed');
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setErrorMessage('');
    setDemoBusy(true);
    try {
      await loginAsDemo();
      showToast('Signed in to the demo account.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.message || 'The demo account is not available right now.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setDemoBusy(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    setErrorMessage('');
    setGoogleBusy(true);
    try {
      const data = await loginWithGoogle(credential);
      const onboarded = data?.profile?.isOnboarded;
      showToast(data?.isNewUser ? 'Account created with Google. Next, set up your profile.' : 'Signed in with Google.', 'success');
      navigate(onboarded ? from : '/onboarding', { replace: true });
    } catch (err) {
      const msg = err.message || 'Google sign-in failed. Please try again.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setGoogleBusy(false);
    }
  };

  const inputClass = 'w-full px-3 py-3 bg-white border border-line-strong rounded-sm text-ink text-base placeholder-muted focus:outline-none focus:border-brand';
  const tabClass = (active) =>
    `flex-1 py-3 text-sm font-bold border-b-2 cursor-pointer ${active ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink'}`;

  return (
    <div className="min-h-screen flex flex-col bg-page text-body">
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-[1140px] mx-auto px-6 py-14 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <h1 className="text-3xl md:text-4xl font-bold text-ink">{isLogin ? 'Log in to REPP' : 'Create your REPP account'}</h1>
            <p className="mt-4 text-base text-body">
              {isLogin
                ? 'Sign in to see your diet plan, workouts and progress.'
                : 'After signing up you will answer a few questions so REPP can set your targets and build your first plan.'}
            </p>

            <div className="mt-8 border border-line-strong bg-subtle rounded-sm p-5">
              <h2 className="text-base font-bold text-ink">Just looking around?</h2>
              <p className="mt-2 text-sm text-body">
                Open a demo account with three months of logged meals, workouts and body measurements. No sign-up needed.
              </p>
              <button
                type="button"
                onClick={handleDemo}
                disabled={demoBusy}
                className="mt-4 px-5 py-2.5 border border-brand text-brand hover:bg-brand hover:text-on-brand disabled:opacity-60 font-bold text-sm rounded-sm cursor-pointer"
              >
                {demoBusy ? 'Opening demo…' : 'Try the demo'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <div className="bg-surface border border-line rounded-sm p-6 sm:p-8">
              {forgot ? (
                <ForgotPasswordPanel
                  initialEmail={email}
                  onCancel={() => setForgot(false)}
                  onDone={(resetEmail) => {
                    setForgot(false);
                    setIsLogin(true);
                    setEmail(resetEmail);
                    setPassword('');
                    setErrorMessage('');
                    setSuccessMessage('Password changed. Log in with your new password.');
                    showToast('Password changed.', 'success');
                  }}
                />
              ) : (<>
              <div className="flex border-b border-line mb-6" role="tablist" aria-label="Log in or sign up">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isLogin}
                  onClick={() => { setIsLogin(true); setErrorMessage(''); }}
                  className={tabClass(isLogin)}
                >
                  Log in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isLogin}
                  onClick={() => { setIsLogin(false); setErrorMessage(''); }}
                  className={tabClass(!isLogin)}
                >
                  Sign up
                </button>
              </div>

              {successMessage && !errorMessage && (
                <div className="mb-5 p-3 bg-subtle border border-line-strong text-ink text-sm rounded-sm" role="status">
                  {successMessage}
                </div>
              )}

              {errorMessage && (
                <div className="mb-5 p-3 bg-surface border border-danger text-danger text-sm rounded-sm" role="alert">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
                {!isLogin && (
                  <div>
                    <label htmlFor="auth-name" className="block text-sm font-bold text-ink mb-2">Full name</label>
                    <input
                      id="auth-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={inputClass}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="auth-email" className="block text-sm font-bold text-ink mb-2">Email address</label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label htmlFor="auth-password" className="block text-sm font-bold text-ink">Password</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => { setForgot(true); setErrorMessage(''); setSuccessMessage(''); }}
                        className="text-sm text-brand underline underline-offset-4 hover:text-brand-hover cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                  {!isLogin && <p className="mt-1 text-xs text-muted">At least 6 characters.</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-brand hover:bg-brand-hover disabled:opacity-60 text-on-brand font-bold text-base rounded-sm cursor-pointer"
                >
                  {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Log in' : 'Create account')}
                </button>

                {!isLogin && (
                  <p className="text-xs text-muted">
                    By creating an account you agree to the <Link to="/terms" className="underline underline-offset-2 hover:text-ink">Terms of Service</Link> and <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
                  </p>
                )}
              </form>

              <div className="my-6 flex items-center gap-3" role="separator" aria-label="or">
                <div className="flex-1 h-px bg-line" />
                <span className="text-xs text-muted">or</span>
                <div className="flex-1 h-px bg-line" />
              </div>
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                busy={googleBusy}
                text={isLogin ? 'continue_with' : 'signup_with'}
              />
              </>)}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

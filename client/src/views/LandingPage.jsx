import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

/** A real screenshot of the signed-in app (files live in client/public/screenshots). */
function Screenshot({ src, alt }) {
  return (
    <figure className="w-full bg-brand p-2 md:p-3 rounded-sm">
      <img src={src} alt={alt} loading="lazy" className="block w-full h-auto rounded-sm bg-surface" />
    </figure>
  );
}

const FEATURE_ROWS = [
  {
    title: 'Diet plans built around Indian food and your budget',
    body: 'REPP calculates your calorie and protein targets from your height, weight, activity and goal, then builds daily meal plans from foods you eat, within a daily budget you set. Allergies and dislikes are excluded.',
    shot: { src: `${import.meta.env.BASE_URL}screenshots/diet-planner.png`, alt: 'Diet Planner page with a day of meals' }
  },
  {
    title: 'Workouts that respect your equipment and injuries',
    body: 'Training splits are generated for the gym, home or bodyweight only. Exercises that load an injured knee, back or shoulder are swapped for safer alternatives, and you can substitute any exercise in one click.',
    shot: { src: `${import.meta.env.BASE_URL}screenshots/workouts.png`, alt: 'Workouts page showing today’s session' }
  },
  {
    title: 'Log meals by photo or by description',
    body: 'Photograph a plate or type what you ate, for example "2 roti, dal and 3 eggs". REPP estimates calories, protein, carbs and fats and shows how the meal fits the rest of your day before you save it.',
    shot: { src: `${import.meta.env.BASE_URL}screenshots/log-meal.png`, alt: 'Log & Scan Meal page after a photo scan' }
  },
  {
    title: 'A weekly plan that adjusts to your results',
    body: 'Each week REPP reviews your logged weight, waist, meals, workouts and check-in answers. Calorie targets only change when several weeks of weigh-ins show a clear trend, and every change comes with the reason.',
    shot: { src: `${import.meta.env.BASE_URL}screenshots/adaptive-plan.png`, alt: 'Adaptive Plan page with recommendations' }
  }
];

const MORE_FEATURES = [
  'Progress tracking with weekly, monthly and six-month reports you can save as PDF.',
  'BodyVision: optional progress photos with an AI estimate of body-fat range, stored privately.',
  'Ask REPP: a chat coach that answers using your own targets, meals and workouts.',
  'A weekly reminder to log your measurements, so trends stay accurate.'
];

const STEPS = [
  { title: 'Answer the onboarding questions', body: 'Body measurements, activity, goal, diet preference, budget, equipment and any injuries. It takes about five minutes.' },
  { title: 'Receive your targets and plans', body: 'REPP sets daily calorie, protein and water targets and generates a diet plan and a workout split.' },
  { title: 'Log what you do each day', body: 'Tick off planned meals or log your own, record workouts, and weigh in once a week.' },
  { title: 'Review the weekly plan', body: 'Accept or reject each recommendation. Nothing changes until you approve it.' }
];

export default function LandingPage({ onStartJourney, onExploreApp }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (onStartJourney) return onStartJourney();
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  // Secondary hero action for visitors: scroll down to see what REPP offers before signing up.
  const handleExplore = () => {
    if (onExploreApp) return onExploreApp();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-page text-body">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="border-b border-line">
          <div className="max-w-[1140px] mx-auto px-6 py-14 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <p className="text-sm font-bold text-brand">Fitness and nutrition coaching</p>
              <h1 className="mt-3 text-3xl md:text-4xl font-bold text-ink">
                Diet and training plans that adjust to the results you log.
              </h1>
              <p className="mt-5 text-base text-body max-w-xl">
                REPP sets your calorie and protein targets, plans your meals and workouts, and reviews your progress every week.
                Each change it suggests is explained, and you decide whether to accept it.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleStart}
                  className="px-6 py-3 bg-brand hover:bg-brand-hover text-on-brand text-base font-bold rounded-sm cursor-pointer"
                >
                  {user ? 'Open dashboard' : 'Create an account'}
                </button>
                {!user && (
                  <button
                    onClick={handleExplore}
                    className="px-6 py-3 border border-ink text-ink hover:bg-subtle text-base font-bold rounded-sm cursor-pointer"
                  >
                    See what REPP does
                  </button>
                )}
              </div>
              {!user && (
                <p className="mt-4 text-xs text-muted">
                  By creating an account you agree to the <Link to="/terms" className="underline underline-offset-2 hover:text-ink">Terms of Service</Link> and <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy Policy</Link>.
                </p>
              )}
            </div>
            <div className="lg:col-span-6">
              <Screenshot src={`${import.meta.env.BASE_URL}screenshots/dashboard.png`} alt="REPP dashboard with calories, macros and today’s workout" />
            </div>
          </div>
        </section>

        {/* Features: alternating text and screenshot rows */}
        <section id="features" className="border-b border-line scroll-mt-4">
          <div className="max-w-[1140px] mx-auto px-6 py-14 md:py-24">
            <h2 className="text-3xl font-bold text-ink">What REPP does</h2>
            <p className="mt-3 text-base text-body max-w-2xl">
              Four parts work together: nutrition, training, daily logging and a weekly review.
            </p>

            <div className="mt-12 space-y-16 md:space-y-24">
              {FEATURE_ROWS.map((row, i) => (
                <div key={row.title} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className={`lg:col-span-5 ${i % 2 === 1 ? 'lg:order-2 lg:col-start-8' : ''}`}>
                    <h3 className="text-xl font-bold text-ink">{row.title}</h3>
                    <p className="mt-3 text-base text-body">{row.body}</p>
                  </div>
                  <div className={`lg:col-span-7 ${i % 2 === 1 ? 'lg:order-1 lg:col-start-1' : ''}`}>
                    <Screenshot {...row.shot} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 md:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-line pt-10">
              <h3 className="lg:col-span-4 text-xl font-bold text-ink">Also included</h3>
              <ul className="lg:col-span-8 list-disc pl-5 space-y-2 text-base text-body">
                {MORE_FEATURES.map(f => <li key={f}>{f}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-b border-line scroll-mt-4">
          <div className="max-w-[1140px] mx-auto px-6 py-14 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <h2 className="text-3xl font-bold text-ink">How it works</h2>
              <p className="mt-3 text-base text-body">From sign-up to your first weekly review.</p>
            </div>
            <ol className="lg:col-span-8 border-t border-line">
              {STEPS.map((s, i) => (
                <li key={s.title} className="grid grid-cols-12 gap-4 py-6 border-b border-line">
                  <span className="col-span-2 sm:col-span-1 text-lg font-bold text-muted">{i + 1}.</span>
                  <div className="col-span-10 sm:col-span-11">
                    <h3 className="text-lg font-bold text-ink">{s.title}</h3>
                    <p className="mt-1 text-base text-body">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Privacy and safety */}
        <section id="privacy" className="border-b border-line scroll-mt-4">
          <div className="max-w-[1140px] mx-auto px-6 py-14 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <h2 className="text-3xl font-bold text-ink">Privacy and safety</h2>
            </div>
            <div className="lg:col-span-8 space-y-6 text-base text-body">
              <p>
                Progress photos are stored in a private folder on REPP&rsquo;s server and can only be viewed while you are signed in to your own account.
                They are analysed by the AI model running on that server and are not shared or sold.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Delete all progress photos, or your whole account, at any time from Profile and Privacy.</li>
                <li>Download a complete copy of your data as JSON, or a readable summary as PDF.</li>
                <li>Sign in with email and password, or with your Google account.</li>
              </ul>
              <div className="border border-line rounded-sm p-5 bg-surface">
                <h3 className="text-base font-bold text-ink">Medical disclaimer</h3>
                <p className="mt-1 text-sm text-body">
                  REPP gives general fitness and nutrition guidance. It is not a medical service and does not diagnose or treat conditions.
                  Speak to a doctor before making major changes to your diet or exercise.
                </p>
              </div>
              <p className="text-sm">
                Read the <Link to="/privacy" className="text-brand underline underline-offset-4">Privacy Policy</Link> and <Link to="/terms" className="text-brand underline underline-offset-4">Terms of Service</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* TODO: Testimonials. Add real, attributable customer quotes here once you have permission to publish them. */}

        {/* Call to action */}
        <section>
          <div className="max-w-[1140px] mx-auto px-6 py-14 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8">
              <h2 className="text-3xl font-bold text-ink">Set up your plan</h2>
              <p className="mt-3 text-base text-body">Create an account, answer the onboarding questions, and your first diet and workout plan is ready.</p>
            </div>
            <div className="lg:col-span-4 lg:text-right">
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-brand hover:bg-brand-hover text-on-brand text-base font-bold rounded-sm cursor-pointer"
              >
                {user ? 'Open dashboard' : 'Create an account'}
              </button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

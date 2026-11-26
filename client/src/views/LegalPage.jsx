/**
 * Terms of Service and Privacy Policy pages.
 * The structure and headings are in place; the legal wording is deliberately NOT written here.
 * Every section is a clearly marked placeholder for the site owner (or their lawyer) to fill in.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const DOCUMENTS = {
  terms: {
    title: 'Terms of Service',
    intro: 'These terms govern your use of REPP. Please read them carefully before creating an account.',
    sections: [
      { id: 'acceptance', heading: 'Acceptance of these terms', hint: 'Who the agreement is between, and how a user accepts it (for example by creating an account).' },
      { id: 'eligibility', heading: 'Eligibility', hint: 'Minimum age and any regions where the service is or is not offered.' },
      { id: 'accounts', heading: 'Your account', hint: 'Account responsibilities, password security, accurate information, and sign-in with Google.' },
      { id: 'service', heading: 'What REPP provides', hint: 'Description of the service: workout and diet plans, meal logging, progress tracking, AI coaching and photo analysis.' },
      { id: 'health', heading: 'Health and medical disclaimer', hint: 'That REPP is not medical advice, and users should consult a qualified professional before changing diet or exercise.' },
      { id: 'ai', heading: 'AI-generated content', hint: 'Limits of AI estimates (calories from photos, body-fat ranges, coaching replies) and the user’s responsibility to check them.' },
      { id: 'acceptable-use', heading: 'Acceptable use', hint: 'What users must not do (misuse, uploading others’ photos, attempting to break the service).' },
      { id: 'content', heading: 'Your content', hint: 'Ownership of data and photos users upload, and the licence REPP needs to provide the service.' },
      { id: 'fees', heading: 'Fees and payment', hint: 'Only if the service is paid. REPP currently has no pricing; remove this section if it stays free.' },
      { id: 'termination', heading: 'Suspension and termination', hint: 'How users can delete their account, and when REPP may suspend access.' },
      { id: 'liability', heading: 'Limitation of liability', hint: 'Liability limits and warranty disclaimers, as advised by your lawyer.' },
      { id: 'changes', heading: 'Changes to these terms', hint: 'How users are notified of changes.' },
      { id: 'law', heading: 'Governing law', hint: 'Which country’s or state’s law applies, and where disputes are resolved.' },
      { id: 'contact', heading: 'Contact', hint: 'A contact email or postal address for questions about these terms.' }
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains what personal data REPP collects, why, and the choices you have.',
    sections: [
      { id: 'controller', heading: 'Who we are', hint: 'The legal entity responsible for the data (data controller) and contact details.' },
      { id: 'data', heading: 'Data we collect', hint: 'Account data (name, email, Google profile picture), body measurements, health and lifestyle answers, meal logs and photos, workout logs, progress photos, coach conversations.' },
      { id: 'use', heading: 'How we use your data', hint: 'Creating plans, calculating targets, analysing photos with the AI model, reminders and progress reports.' },
      { id: 'basis', heading: 'Legal basis for processing', hint: 'For example consent and contract performance; health data may need explicit consent depending on your jurisdiction.' },
      { id: 'ai', heading: 'AI processing', hint: 'Where data is processed: chat questions, typed meals, meal photos and plan requests are sent to Anthropic’s Claude API to generate answers; BodyVision body photos are analysed only by the AI model on REPP’s own server.' },
      { id: 'sharing', heading: 'Sharing and third parties', hint: 'Service providers (hosting, Google sign-in and Anthropic for AI answers) and that data is not sold.' },
      { id: 'retention', heading: 'How long we keep data', hint: 'Retention periods, and that deleting your account removes your data and photos.' },
      { id: 'rights', heading: 'Your rights', hint: 'Access, export (REPP offers JSON and PDF export), correction, deletion, and how to make a request.' },
      { id: 'security', heading: 'Security', hint: 'Measures in place, such as private photo storage and encrypted connections.' },
      { id: 'children', heading: 'Children', hint: 'Minimum age and handling of data from minors.' },
      { id: 'cookies', heading: 'Cookies', hint: 'REPP uses a sign-in session cookie. Describe it and any others you add.' },
      { id: 'changes', heading: 'Changes to this policy', hint: 'How users are notified of changes.' },
      { id: 'contact', heading: 'Contact', hint: 'A contact email for privacy requests.' }
    ]
  }
};

export default function LegalPage({ kind }) {
  const doc = DOCUMENTS[kind];

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <SiteHeader />
      <main className="flex-1">
        <div className="max-w-[1140px] mx-auto px-6 py-14 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-10">
          <aside className="md:col-span-3">
            <nav aria-label="On this page" className="md:sticky md:top-8">
              <h2 className="text-sm font-bold text-ink mb-3">On this page</h2>
              <ol className="space-y-2 text-sm list-decimal pl-5">
                {doc.sections.map(s => (
                  <li key={s.id}><a href={`#${s.id}`} className="text-body hover:text-ink hover:underline underline-offset-4">{s.heading}</a></li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="md:col-span-9 max-w-3xl">
            <h1 className="text-4xl font-bold text-ink">{doc.title}</h1>
            <p className="mt-3 text-sm text-muted">Last updated: [DATE TO BE ADDED]</p>

            <div className="mt-8 border border-warning rounded-sm p-5 bg-surface" role="note">
              <p className="text-sm font-bold text-ink">Placeholder document</p>
              <p className="mt-1 text-sm text-body">
                The legal text for this page has not been written yet. Each section below describes what it should cover.
                Replace every placeholder with wording reviewed by a qualified lawyer before launch.
              </p>
            </div>

            <p className="mt-8 text-base text-body">{doc.intro}</p>

            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mt-10 scroll-mt-8">
                <h2 className="text-2xl font-bold text-ink">{i + 1}. {s.heading}</h2>
                <p className="mt-3 text-base text-body">
                  <strong className="text-ink">[TO BE COMPLETED]</strong> Covers: {s.hint}
                </p>
              </section>
            ))}

            <p className="mt-14 text-sm text-muted">
              See also: {kind === 'terms'
                ? <Link to="/privacy" className="text-brand underline underline-offset-4">Privacy Policy</Link>
                : <Link to="/terms" className="text-brand underline underline-offset-4">Terms of Service</Link>}
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

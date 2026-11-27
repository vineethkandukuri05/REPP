/**
 * Terms of Service and Privacy Policy pages.
 * Plain-language documents for REPP as a free personal portfolio project. Each section body is a list of
 * paragraphs; a nested array renders as a bulleted list.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '../components/SiteChrome';

const LAST_UPDATED = '27 November 2026';
const CONTACT_URL = 'https://github.com/vineethkandukuri05/REPP/issues';

const DOCUMENTS = {
  terms: {
    title: 'Terms of Service',
    intro: 'These terms explain the rules for using REPP. By creating an account or using the demo account, you agree to them. If you do not agree, please do not use REPP.',
    sections: [
      {
        id: 'acceptance', heading: 'About REPP and these terms', body: [
          'REPP is a free fitness and nutrition web app built and run by an individual developer as a personal portfolio project. It is not run by a company and is offered to show the developer’s work.',
          'These terms are an agreement between you and the developer of REPP (“we”, “us”). You accept them when you create an account, sign in with Google, or open the demo account.'
        ]
      },
      {
        id: 'eligibility', heading: 'Who can use REPP', body: [
          'You must be at least 18 years old to create an account, because REPP asks for body measurements and health-related information.',
          'REPP is available worldwide, but it is designed mainly around Indian foods and is provided in English.'
        ]
      },
      {
        id: 'accounts', heading: 'Your account', body: [
          [
            'Give accurate information, especially body measurements, as your plans and targets are calculated from it.',
            'Keep your password private. You are responsible for activity on your account.',
            'If you sign in with Google, Google confirms your identity and we receive your name, email address and profile picture.',
            'You can delete your account at any time from Profile & Privacy.'
          ],
          'The demo account is shared by everyone who clicks “Try the demo”. Anything you log there can be seen by other visitors and is reset every day. Do not enter personal information in the demo account; create your own account instead.'
        ]
      },
      {
        id: 'service', heading: 'What REPP provides', body: [
          'REPP calculates daily calorie and protein targets, generates diet and workout plans, lets you log meals by text or photo, tracks workouts, water, body measurements and progress photos, produces progress reports, and offers an AI coach called Ask REPP.',
          'Because REPP is a free personal project, features may change, be unavailable at times, or be removed without notice. We do not promise that the service will always be available or error-free.'
        ]
      },
      {
        id: 'health', heading: 'Health and medical disclaimer', body: [
          'REPP gives general fitness and nutrition information only. It is not medical advice and is not a substitute for a doctor, dietitian or physiotherapist. It does not diagnose, treat or prevent any condition.',
          'Speak to a qualified professional before starting a new diet or exercise programme, especially if you are pregnant, have a medical condition or injury, take medication, or have a history of eating disorders. Stop exercising and seek medical help if you feel pain, dizziness or shortness of breath.',
          'You use REPP’s plans and suggestions at your own risk.'
        ]
      },
      {
        id: 'ai', heading: 'AI-generated content', body: [
          'Coach replies, meal and photo calorie estimates, body-fat ranges from BodyVision, and generated plans are produced by an AI model. AI can be wrong, incomplete or out of date.',
          'Treat every AI result as an estimate. Check portion sizes and nutrition values yourself, and do not rely on REPP for decisions about your health.'
        ]
      },
      {
        id: 'acceptable-use', heading: 'Acceptable use', body: [
          'When using REPP, you agree not to:',
          [
            'upload photos of other people, or any photo you do not have the right to use;',
            'upload illegal, sexual, violent or offensive content;',
            'try to access other users’ data, attack, overload or break the service, or get around its limits;',
            'use automated tools to send large numbers of requests, including to the AI features;',
            'use REPP to harm yourself or others.'
          ]
        ]
      },
      {
        id: 'content', heading: 'Your content', body: [
          'You keep ownership of the information and photos you add to REPP. You allow us to store and process them only to run the service for you, for example to create plans, show your history and generate AI answers.',
          'You can download your data as JSON or a PDF summary, and delete it, from Profile & Privacy.'
        ]
      },
      {
        id: 'fees', heading: 'Fees', body: [
          'REPP is free. There are no subscriptions, payments or in-app purchases.'
        ]
      },
      {
        id: 'termination', heading: 'Suspension and termination', body: [
          'You can stop using REPP and delete your account at any time. We may suspend or remove an account that breaks these terms, and we may shut down REPP entirely, in which case stored data will be deleted.'
        ]
      },
      {
        id: 'liability', heading: 'Limitation of liability', body: [
          'REPP is provided “as is”, without warranties of any kind. To the fullest extent allowed by law, we are not liable for any injury, health problem, loss of data or other loss arising from your use of REPP or from relying on its content.',
          'Nothing in these terms limits any rights you have that cannot be excluded under applicable law.'
        ]
      },
      {
        id: 'changes', heading: 'Changes to these terms', body: [
          'We may update these terms. The date at the top of this page shows when they last changed. Continuing to use REPP after a change means you accept the updated terms.'
        ]
      },
      {
        id: 'law', heading: 'Governing law', body: [
          'These terms are governed by the laws of India.'
        ]
      },
      {
        id: 'contact', heading: 'Contact', body: [
          <>For questions about these terms, open an issue on the project’s GitHub page: <a href={CONTACT_URL} className="text-brand underline underline-offset-4" target="_blank" rel="noreferrer">github.com/vineethkandukuri05/REPP/issues</a>.</>
        ]
      }
    ]
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'This policy explains what information REPP collects, why it is needed, who processes it, and the choices you have.',
    sections: [
      {
        id: 'controller', heading: 'Who we are', body: [
          'REPP is a free personal portfolio project run by an individual developer, who is responsible for the data described here.'
        ]
      },
      {
        id: 'data', heading: 'Information we collect', body: [
          [
            'Account details: name, email address, and a securely hashed password, or your Google name, email and profile picture if you sign in with Google.',
            'Profile and onboarding answers: age, sex, height, weight, target weight, body measurements, activity level, goals, experience, diet preference, foods you eat, allergies, injuries, budget and available equipment.',
            'Logs you add: meals (typed or photographed), water, workouts and sets, weekly check-in answers and body measurements.',
            'Photos: meal photos and BodyVision progress photos you choose to upload.',
            'Conversations with the Ask REPP coach.'
          ],
          'We do not collect your location, contacts or payment details, and we do not use advertising or analytics trackers.'
        ]
      },
      {
        id: 'use', heading: 'How we use your information', body: [
          'Your information is used only to provide REPP to you: calculating your targets, creating diet and workout plans, estimating nutrition from meals and photos, estimating body-fat ranges, answering coach questions with your own numbers, sending measurement reminders inside the app, and producing progress reports.',
          'We do not sell your data, use it for advertising, or share it with anyone except the service providers listed below.'
        ]
      },
      {
        id: 'basis', heading: 'Your consent', body: [
          'Some of this information, such as body measurements, injuries and body photos, is health-related. By entering it and uploading photos, you consent to it being processed as described in this policy. You can withdraw consent at any time by deleting the information or your account.'
        ]
      },
      {
        id: 'ai', heading: 'AI processing', body: [
          'To generate answers, REPP sends the relevant information to Anthropic’s Claude API: your coach questions with a summary of your profile and today’s logs, typed meal descriptions, meal photos, BodyVision progress photos, and the details needed to build plans. Anthropic processes this to return a response under its commercial terms and does not use API data to train its models.',
          'When REPP is run on a private computer with a local AI model, the same requests are handled on that computer instead.'
        ]
      },
      {
        id: 'sharing', heading: 'Service providers', body: [
          'REPP relies on these providers to run:',
          [
            'Vercel: runs REPP’s server.',
            'A managed PostgreSQL database provider: stores your account and logs.',
            'GitHub Pages: serves the website itself (it does not receive your account data).',
            'Anthropic: generates AI answers, as described above.',
            'Google: only if you choose “Continue with Google”, to confirm your identity.'
          ],
          'These providers may process data in countries outside India.'
        ]
      },
      {
        id: 'retention', heading: 'How long we keep data', body: [
          'Your data is kept until you delete it or delete your account. Deleting your account removes your profile, logs, conversations and photos.',
          'On the hosted version, uploaded photos are kept in temporary server storage and may be removed automatically after a short time, even if you do not delete them.',
          'Everything entered in the shared demo account is erased when it resets each day.'
        ]
      },
      {
        id: 'rights', heading: 'Your choices and rights', body: [
          'From Profile & Privacy you can:',
          [
            'download all your data as JSON, or a readable PDF summary;',
            'update your profile details;',
            'delete all progress photos;',
            'delete your account and all its data.'
          ],
          'For any other request, use the contact link below.'
        ]
      },
      {
        id: 'security', heading: 'Security', body: [
          'Connections to REPP use HTTPS. Passwords are stored only as secure hashes. Progress photos are not publicly accessible and can only be opened while signed in to the account that uploaded them. No system is perfectly secure, so please do not upload anything you would not want to risk being exposed.'
        ]
      },
      {
        id: 'children', heading: 'Children', body: [
          'REPP is not intended for anyone under 18. If you believe a child has created an account, contact us and we will delete it.'
        ]
      },
      {
        id: 'cookies', heading: 'Cookies and browser storage', body: [
          'REPP uses one sign-in cookie and stores a sign-in token in your browser’s local storage so that you stay logged in for up to 7 days. Logging out removes them. REPP uses no advertising or tracking cookies. Google sign-in may set its own cookies when you use it.'
        ]
      },
      {
        id: 'changes', heading: 'Changes to this policy', body: [
          'We may update this policy. The date at the top of this page shows when it last changed.'
        ]
      },
      {
        id: 'contact', heading: 'Contact', body: [
          <>For privacy questions or requests, open an issue on the project’s GitHub page: <a href={CONTACT_URL} className="text-brand underline underline-offset-4" target="_blank" rel="noreferrer">github.com/vineethkandukuri05/REPP/issues</a>. Please do not include personal health details in a public issue.</>
        ]
      }
    ]
  }
};

function SectionBody({ body }) {
  return body.map((part, i) =>
    Array.isArray(part) ? (
      <ul key={i} className="mt-3 list-disc pl-5 space-y-2 text-base text-body">
        {part.map((item, j) => <li key={j}>{item}</li>)}
      </ul>
    ) : (
      <p key={i} className="mt-3 text-base text-body">{part}</p>
    )
  );
}

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
            <p className="mt-3 text-sm text-muted">Last updated: {LAST_UPDATED}</p>

            <p className="mt-8 text-base text-body">{doc.intro}</p>

            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="mt-10 scroll-mt-8">
                <h2 className="text-2xl font-bold text-ink">{i + 1}. {s.heading}</h2>
                <SectionBody body={s.body} />
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

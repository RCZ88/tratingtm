import type { Metadata } from 'next';
import Link from 'next/link';

const UPDATED_AT = '2026-02-08';
const CONTACT_EMAIL = 'firstname.lastname@tunasmuda.sch.id';

export const metadata: Metadata = {
  title: 'Community Guidelines | TM Ratings',
  description: 'Guidelines for respectful, constructive feedback on TM Ratings.',
};

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Community Guidelines</h1>
          <p className="mt-2 text-slate-600">
            These guidelines help keep TM Ratings respectful, fair, and helpful for everyone.
          </p>
          <p className="mt-4 text-xs text-slate-500">Last updated: {UPDATED_AT}</p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Purpose</h2>
            <p className="mt-2 text-sm text-slate-600">
              TM Ratings is for constructive feedback. Share experiences that can help
              teachers improve and help students make informed choices.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Be Specific & Respectful</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              <li>Focus on teaching methods, clarity, and support.</li>
              <li>Avoid personal attacks, insults, or rumors.</li>
              <li>Offer examples that are fair and relevant.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No Sensitive Information</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              <li>Do not share phone numbers, addresses, or private messages.</li>
              <li>Do not share health, family, or disciplinary details.</li>
              <li>Protect classmates and staff from unwanted exposure.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No Discrimination</h2>
            <p className="mt-2 text-sm text-slate-600">
              Hate speech or discrimination based on race, religion, gender, disability, or
              nationality is not allowed.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Safety & Reporting</h2>
            <p className="mt-2 text-sm text-slate-600">
              If you see harmful content, report it or contact our team. We prioritize safety
              and will review reports as quickly as possible.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Moderation Transparency</h2>
            <p className="mt-2 text-sm text-slate-600">
              Moderators may remove content that violates these guidelines. Repeated violations
              can lead to restrictions.
            </p>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Need to report something?</h2>
            <p className="mt-2 text-sm text-emerald-900">
              Email us at{' '}
              <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>{' '}
              with a link or screenshot of the content.
            </p>
          </section>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <Link href="/legal/privacy" className="hover:text-emerald-700">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-emerald-700">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

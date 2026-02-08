import type { Metadata } from 'next';
import Link from 'next/link';

const UPDATED_AT = '2026-02-08';
const CONTACT_EMAIL = 'firstname.lastname@tunasmuda.sch.id';

export const metadata: Metadata = {
  title: 'Privacy Policy | TM Ratings',
  description:
    'Learn how TM Ratings collects, uses, and protects data for the TunasMuda School community.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="mt-2 text-slate-600">
            This policy explains how TM Ratings handles information to keep our school
            community safe, fair, and informed.
          </p>
          <p className="mt-4 text-xs text-slate-500">Last updated: {UPDATED_AT}</p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Overview</h2>
            <p className="mt-2 text-sm text-slate-600">
              TM Ratings is a feedback platform for the TunasMuda School community. Our
              goal is to help students share constructive feedback while protecting privacy
              and promoting respectful dialogue.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Data We Collect</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              <li>Ratings and comments submitted about teachers.</li>
              <li>Anonymous identifiers used to reduce abuse and maintain integrity.</li>
              <li>Optional suggestions submitted through the Suggestions page.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">How We Use Data</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              <li>Operate and improve the platform.</li>
              <li>Moderate content and investigate abuse or harmful behavior.</li>
              <li>Provide aggregated insights, not personal profiling.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">What We Don’t Collect</h2>
            <p className="mt-2 text-sm text-slate-600">
              We do not require students to submit names, student IDs, or other sensitive
              identifiers to post ratings or suggestions.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Cookies & Sessions</h2>
            <p className="mt-2 text-sm text-slate-600">
              We use minimal session cookies to keep the platform secure and reduce abuse.
              These cookies are not used for advertising.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Data Retention</h2>
            <p className="mt-2 text-sm text-slate-600">
              We retain ratings and comments for as long as they help the community and to
              support moderation. Data may be removed upon verified requests.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Access & Requests</h2>
            <p className="mt-2 text-sm text-slate-600">
              If you believe content should be removed or corrected, please contact us at{' '}
              <a className="font-medium text-emerald-700 hover:text-emerald-800" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Security</h2>
            <p className="mt-2 text-sm text-slate-600">
              We use reasonable safeguards to protect data, but no system can guarantee
              absolute security. Please report any concerns promptly.
            </p>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Need help?</h2>
            <p className="mt-2 text-sm text-emerald-900">
              Email us at{' '}
              <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>{' '}
              for privacy questions or removal requests.
            </p>
          </section>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <Link href="/legal/terms" className="hover:text-emerald-700">
              Terms of Service
            </Link>
            <Link href="/legal/guidelines" className="hover:text-emerald-700">
              Community Guidelines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

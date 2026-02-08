import type { Metadata } from 'next';
import Link from 'next/link';

const UPDATED_AT = '2026-02-08';
const CONTACT_EMAIL = 'firstname.lastname@tunasmuda.sch.id';

export const metadata: Metadata = {
  title: 'Terms of Service | TM Ratings',
  description: 'Terms of Service for the TM Ratings platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="mt-2 text-slate-600">
            By using TM Ratings, you agree to the terms below. These terms are meant to
            protect our school community and keep feedback constructive.
          </p>
          <p className="mt-4 text-xs text-slate-500">Last updated: {UPDATED_AT}</p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Acceptance of Terms</h2>
            <p className="mt-2 text-sm text-slate-600">
              Accessing or using TM Ratings means you understand and agree to these terms.
              If you do not agree, please do not use the platform.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Eligibility</h2>
            <p className="mt-2 text-sm text-slate-600">
              TM Ratings is intended for the TunasMuda School community. Use is limited to
              students, staff, and authorized community members.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">User Responsibilities</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              <li>Provide fair and honest feedback based on direct experience.</li>
              <li>Be respectful and avoid personal attacks.</li>
              <li>Do not post private or sensitive information.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Prohibited Use</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-600">
              <li>Harassment, hate speech, or discrimination.</li>
              <li>Doxxing, threats, or sharing personal data.</li>
              <li>Spam, impersonation, or manipulation of ratings.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Content Moderation</h2>
            <p className="mt-2 text-sm text-slate-600">
              We may review, edit, or remove content that violates these terms or our
              Community Guidelines. Repeated violations can result in restrictions.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">No Professional Advice</h2>
            <p className="mt-2 text-sm text-slate-600">
              TM Ratings provides community feedback only. It is not a substitute for
              formal academic, counseling, or professional services.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Limitation of Liability</h2>
            <p className="mt-2 text-sm text-slate-600">
              To the extent permitted by law, TM Ratings is provided “as is” and without
              warranties. We are not liable for indirect or consequential damages.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Governing Law</h2>
            <p className="mt-2 text-sm text-slate-600">
              These terms are governed by the laws of Indonesia.
            </p>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-900">Contact</h2>
            <p className="mt-2 text-sm text-emerald-900">
              Questions about these terms? Email{' '}
              <a className="font-semibold underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>.
            </p>
          </section>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <Link href="/legal/privacy" className="hover:text-emerald-700">
              Privacy Policy
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

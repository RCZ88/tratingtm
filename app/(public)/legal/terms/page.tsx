import type { Metadata } from 'next';
import Link from 'next/link';

const UPDATED_AT = '2026-02-08';

export const metadata: Metadata = {
  title: 'Terms of Service | TM Ratings',
  description: 'Terms of Service for the TM Ratings platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Terms of Service</h1>
          <p className="mt-2 text-muted-foreground">
            By using TM Ratings, you agree to the terms below. These terms are meant to
            protect our school community and keep feedback constructive.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Last updated: {UPDATED_AT}</p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Acceptance of Terms</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Accessing or using TM Ratings means you understand and agree to these terms.
              If you do not agree, please do not use the platform.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Eligibility</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              TM Ratings is intended for the TunasMuda School community. Use is limited to
              students, staff, and authorized community members.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">User Responsibilities</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Provide fair and honest feedback based on direct experience.</li>
              <li>Be respectful and avoid personal attacks.</li>
              <li>Do not post private or sensitive information.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Prohibited Use</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Harassment, hate speech, or discrimination.</li>
              <li>Doxxing, threats, or sharing personal data.</li>
              <li>Spam, impersonation, or manipulation of ratings.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Content Moderation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We may review, edit, or remove content that violates these terms or our
              Community Guidelines. Repeated violations can result in restrictions.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">No Professional Advice</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              TM Ratings provides community feedback only. It is not a substitute for
              formal academic, counseling, or professional services.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Limitation of Liability</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              To the extent permitted by law, TM Ratings is provided �as is� and without
              warranties. We are not liable for indirect or consequential damages.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Governing Law</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These terms are governed by the laws of Indonesia.
            </p>
          </section>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-emerald-700 dark:text-emerald-200">
              Privacy Policy
            </Link>
            <Link href="/legal/guidelines" className="hover:text-emerald-700 dark:text-emerald-200">
              Community Guidelines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}






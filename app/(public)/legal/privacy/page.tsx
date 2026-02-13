import type { Metadata } from 'next';
import Link from 'next/link';

const UPDATED_AT = '2026-02-08';

export const metadata: Metadata = {
  title: 'Privacy Policy | TM Ratings',
  description:
    'Learn how TM Ratings collects, uses, and protects data for the TunasMuda School community.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Privacy Policy</h1>
          <p className="mt-2 text-muted-foreground">
            This policy explains how TM Ratings handles information to keep our school
            community safe, fair, and informed.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Last updated: {UPDATED_AT}</p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Overview</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              TM Ratings is a feedback platform for the TunasMuda School community. Our
              goal is to help students share constructive feedback while protecting privacy
              and promoting respectful dialogue.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Data We Collect</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Ratings and comments submitted about teachers.</li>
              <li>Anonymous identifiers used to reduce abuse and maintain integrity.</li>
              <li>Optional suggestions submitted through the Suggestions page.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">How We Use Data</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Operate and improve the platform.</li>
              <li>Moderate content and investigate abuse or harmful behavior.</li>
              <li>Provide aggregated insights, not personal profiling.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">What We Don't Collect</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We do not require students to submit names, student IDs, or other sensitive
              identifiers to post ratings or suggestions.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Cookies & Sessions</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We use minimal session cookies to keep the platform secure and reduce abuse.
              These cookies are not used for advertising.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Data Retention</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We retain ratings and comments for as long as they help the community and to
              support moderation. Data may be removed upon verified requests.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Security</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We use reasonable safeguards to protect data, but no system can guarantee
              absolute security. Please report any concerns promptly.
            </p>
          </section>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/legal/terms" className="hover:text-emerald-700 dark:text-emerald-200">
              Terms of Service
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






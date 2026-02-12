import type { Metadata } from 'next';
import Link from 'next/link';

const UPDATED_AT = '2026-02-08';

export const metadata: Metadata = {
  title: 'Community Guidelines | TM Ratings',
  description: 'Guidelines for respectful, constructive feedback on TM Ratings.',
};

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-muted py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-200">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">Community Guidelines</h1>
          <p className="mt-2 text-muted-foreground">
            These guidelines help keep TM Ratings respectful, fair, and helpful for everyone.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Last updated: {UPDATED_AT}</p>
        </header>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Purpose</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              TM Ratings is for constructive feedback. Share experiences that can help
              teachers improve and help students make informed choices.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Be Specific & Respectful</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Focus on teaching methods, clarity, and support.</li>
              <li>Avoid personal attacks, insults, or rumors.</li>
              <li>Offer examples that are fair and relevant.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">No Sensitive Information</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
              <li>Do not share phone numbers, addresses, or private messages.</li>
              <li>Do not share health, family, or disciplinary details.</li>
              <li>Protect classmates and staff from unwanted exposure.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">No Discrimination</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Hate speech or discrimination based on race, religion, gender, disability, or
              nationality is not allowed.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Safety & Reporting</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              If you see harmful content, report it or contact our team. We prioritize safety
              and will review reports as quickly as possible.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">Moderation Transparency</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Moderators may remove content that violates these guidelines. Repeated violations
              can lead to restrictions.
            </p>
          </section>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Link href="/legal/privacy" className="hover:text-emerald-700 dark:text-emerald-200">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-emerald-700 dark:text-emerald-200">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}






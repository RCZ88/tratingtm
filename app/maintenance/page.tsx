import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function MaintenancePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('app_settings')
    .select('maintenance_message, maintenance_enabled')
    .eq('id', 'global')
    .maybeSingle();

  const message = data?.maintenance_message || 'We are applying updates. Please check back soon.';

  if (!data?.maintenance_enabled) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-border bg-card p-10 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-500">Maintenance</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">We will be right back.</h1>
          <p className="mt-4 text-base text-muted-foreground">{message}</p>
        </div>
      </div>
    </main>
  );
}

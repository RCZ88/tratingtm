'use client';

import * as React from 'react';

function getNextReset(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = (8 - day) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const dd = String(days).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${dd}:${hh}:${mm}:${ss}`;
}

export function WeeklyResetCountdown() {
  const [nextReset, setNextReset] = React.useState<Date>(() => getNextReset());
  const [remaining, setRemaining] = React.useState<string>(() => formatCountdown(nextReset.getTime() - Date.now()));

  React.useEffect(() => {
    const tick = () => {
      const target = nextReset.getTime();
      const now = Date.now();
      if (now >= target) {
        const updated = getNextReset();
        setNextReset(updated);
        setRemaining(formatCountdown(updated.getTime() - now));
        return;
      }
      setRemaining(formatCountdown(target - now));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextReset]);

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
            Next weekly reset
          </p>
          <p className="text-sm text-emerald-900">Countdown to Monday reset</p>
        </div>
        <div className="rounded-full bg-card px-4 py-2 text-base font-semibold text-emerald-700 dark:text-emerald-200 shadow">
          {remaining}
        </div>
      </div>
    </div>
  );
}





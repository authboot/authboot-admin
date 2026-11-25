// ============================================================
// AuthBoot dashboard — trend gap filling
// ============================================================
// authboot-server only returns buckets that have at least one login, so a
// quiet week/half-year arrives as one or two isolated points. These helpers
// expand the response into a continuous window, zero-filling the gaps.

import { format, subDays, subMonths } from 'date-fns';
import type { MonthlyLoginTrend, TrendPoint } from '../api/types';

const DAY_FORMAT = 'yyyy-MM-dd';
const MONTH_FORMAT = 'yyyy-MM';

// The window ends at the later of "now" and the newest bucket, so a server
// running ahead of the browser's timezone never has its latest point cut off.
function latestKey(keys: Iterable<string>, nowKey: string): string {
  let latest = nowKey;
  for (const key of keys) {
    if (key > latest) latest = key;
  }
  return latest;
}

/** Continuous daily series ending today, oldest first (date is YYYY-MM-DD). */
export function fillDailyTrend(
  points: TrendPoint[],
  days = 7,
  now: Date = new Date()
): TrendPoint[] {
  const counts = new Map<string, number>();
  for (const point of points) {
    const key = point.date.slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + point.count);
  }

  const [year, month, day] = latestKey(counts.keys(), format(now, DAY_FORMAT))
    .split('-')
    .map(Number);
  const end = new Date(year, month - 1, day);

  return Array.from({ length: days }, (_, index) => {
    const date = format(subDays(end, days - 1 - index), DAY_FORMAT);
    return { date, count: counts.get(date) ?? 0 };
  });
}

/** Continuous monthly series ending this month, oldest first (month is YYYY-MM). */
export function fillMonthlyLoginTrend(
  points: MonthlyLoginTrend[],
  months = 6,
  now: Date = new Date()
): MonthlyLoginTrend[] {
  const totals = new Map<string, { success: number; failed: number }>();
  for (const point of points) {
    const key = point.month.slice(0, 7);
    const current = totals.get(key) ?? { success: 0, failed: 0 };
    totals.set(key, {
      success: current.success + point.success,
      failed: current.failed + point.failed
    });
  }

  const [year, month] = latestKey(totals.keys(), format(now, MONTH_FORMAT)).split('-').map(Number);
  const end = new Date(year, month - 1, 1);

  return Array.from({ length: months }, (_, index) => {
    const key = format(subMonths(end, months - 1 - index), MONTH_FORMAT);
    const total = totals.get(key);
    return { month: key, success: total?.success ?? 0, failed: total?.failed ?? 0 };
  });
}

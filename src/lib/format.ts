import { formatDateTime, formatRelative as formatRelativeTime } from '@/lib/preferences';

export { formatDateTime, formatRelativeTime };

/**
 * Date label in the admin's timezone and preferred format. This is the
 * project-wide helper, so existing call sites pick up the preference store
 * without changes. Intl options override individual parts; passing `hour` or
 * `minute` switches to a date + time label in the preferred clock format.
 */
export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  const { hour, minute, ...rest } = opts;
  const wantsTime = hour !== undefined || minute !== undefined;
  return formatDateTime(date, wantsTime ? 'datetime' : 'date', rest);
}

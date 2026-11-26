// ============================================================
// Admin display preferences — timezone, date/time format, theme, language
// ============================================================
// Stored per admin on the server (GET/PUT /api/v1/admin/me/settings, a flat
// string map). This module owns the keys, their defaults and a tiny external
// store so that BOTH plain functions (`formatDate` in `@/lib/format`) and
// React components (via `useSyncExternalStore`) see the same effective
// timezone / format without threading props everywhere.

import type { Locale } from '@/lib/i18n/locale.config';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/locale.config';
import { DEFAULT_THEME, THEMES } from '@/components/themes/theme.config';

export const DATE_FORMATS = [
  { value: 'mdy', label: 'Nov 25, 2026', example: 'MMM D, YYYY' },
  { value: 'dmy', label: '25 Nov 2026', example: 'D MMM YYYY' },
  { value: 'ymd', label: '2026-11-25', example: 'YYYY-MM-DD' },
  { value: 'long', label: 'November 25, 2026', example: 'MMMM D, YYYY' }
] as const;
export type DateFormat = (typeof DATE_FORMATS)[number]['value'];

export const TIME_FORMATS = [
  { value: '12h', label: '12-hour (3:45 PM)' },
  { value: '24h', label: '24-hour (15:45)' }
] as const;
export type TimeFormat = (typeof TIME_FORMATS)[number]['value'];

export const THEME_MODES = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
] as const;
export type ThemeMode = (typeof THEME_MODES)[number]['value'];

/** Keys as stored in the backend settings map. */
export const PREFERENCE_KEYS = {
  timezone: 'timezone',
  dateFormat: 'date_format',
  timeFormat: 'time_format',
  theme: 'theme',
  themeMode: 'theme_mode',
  locale: 'locale'
} as const;

export type AdminPreferences = {
  /** IANA zone, e.g. "Asia/Shanghai". */
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  /** Color theme id from theme.config. */
  theme: string;
  themeMode: ThemeMode;
  locale: Locale;
};

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function defaultPreferences(): AdminPreferences {
  return {
    timezone: browserTimezone(),
    dateFormat: 'mdy',
    timeFormat: '12h',
    theme: DEFAULT_THEME,
    themeMode: 'system',
    locale: DEFAULT_LOCALE
  };
}

function isDateFormat(v: string | undefined): v is DateFormat {
  return DATE_FORMATS.some((f) => f.value === v);
}
function isTimeFormat(v: string | undefined): v is TimeFormat {
  return TIME_FORMATS.some((f) => f.value === v);
}
function isThemeMode(v: string | undefined): v is ThemeMode {
  return THEME_MODES.some((m) => m.value === v);
}
export function isValidTimezone(tz: string | undefined): tz is string {
  if (!tz) return false;
  try {
    return Boolean(new Intl.DateTimeFormat('en-US', { timeZone: tz }).resolvedOptions().timeZone);
  } catch {
    return false;
  }
}

/** Parse the backend map, falling back per field so a bad value never breaks the UI. */
export function parsePreferences(raw: Record<string, string> | undefined): AdminPreferences {
  const d = defaultPreferences();
  if (!raw) return d;
  const tz = raw[PREFERENCE_KEYS.timezone];
  const dateFormat = raw[PREFERENCE_KEYS.dateFormat];
  const timeFormat = raw[PREFERENCE_KEYS.timeFormat];
  const theme = raw[PREFERENCE_KEYS.theme];
  const themeMode = raw[PREFERENCE_KEYS.themeMode];
  const locale = raw[PREFERENCE_KEYS.locale];
  return {
    timezone: isValidTimezone(tz) ? tz : d.timezone,
    dateFormat: isDateFormat(dateFormat) ? dateFormat : d.dateFormat,
    timeFormat: isTimeFormat(timeFormat) ? timeFormat : d.timeFormat,
    theme: theme && THEMES.some((t) => t.value === theme) ? theme : d.theme,
    themeMode: isThemeMode(themeMode) ? themeMode : d.themeMode,
    locale: isLocale(locale) ? locale : d.locale
  };
}

/** Serialize for PUT, merged over the existing map so unknown keys survive. */
export function serializePreferences(
  prefs: AdminPreferences,
  existing: Record<string, string> = {}
): Record<string, string> {
  return {
    ...existing,
    [PREFERENCE_KEYS.timezone]: prefs.timezone,
    [PREFERENCE_KEYS.dateFormat]: prefs.dateFormat,
    [PREFERENCE_KEYS.timeFormat]: prefs.timeFormat,
    [PREFERENCE_KEYS.theme]: prefs.theme,
    [PREFERENCE_KEYS.themeMode]: prefs.themeMode,
    [PREFERENCE_KEYS.locale]: prefs.locale
  };
}

// ------------------------------------------------------------
// External store: the effective preferences used for formatting
// ------------------------------------------------------------
// PreferencesProvider writes here once the admin's settings load; `formatDate`
// and `useDateTime` read from it. Starts from browser defaults so pages render
// sensibly before the request completes.

let current: AdminPreferences = defaultPreferences();
const listeners = new Set<() => void>();

export function getPreferences(): AdminPreferences {
  return current;
}

export function setPreferences(next: AdminPreferences): void {
  current = next;
  listeners.forEach((listener) => listener());
}

export function subscribePreferences(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ------------------------------------------------------------
// Formatting
// ------------------------------------------------------------

export type DateTimeStyle = 'date' | 'time' | 'datetime' | 'datetime-seconds';

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function dateParts(format: DateFormat): Intl.DateTimeFormatOptions {
  switch (format) {
    case 'ymd':
      return { year: 'numeric', month: '2-digit', day: '2-digit' };
    case 'dmy':
    case 'mdy':
      return { year: 'numeric', month: 'short', day: 'numeric' };
    case 'long':
      return { year: 'numeric', month: 'long', day: 'numeric' };
  }
}

function timeParts(format: TimeFormat, seconds: boolean): Intl.DateTimeFormatOptions {
  return {
    hour: format === '24h' ? '2-digit' : 'numeric',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
    hour12: format === '12h'
  };
}

/**
 * Format a date in the admin's timezone, locale and chosen formats.
 * `extra` overrides individual Intl options (e.g. `{ weekday: 'short' }`).
 */
export function formatDateTime(
  value: DateInput,
  style: DateTimeStyle = 'datetime',
  extra: Intl.DateTimeFormatOptions = {},
  prefs: AdminPreferences = current
): string {
  const d = toDate(value);
  if (!d) return '';
  const options: Intl.DateTimeFormatOptions = { timeZone: prefs.timezone };
  if (style !== 'time') Object.assign(options, dateParts(prefs.dateFormat));
  if (style !== 'date')
    Object.assign(options, timeParts(prefs.timeFormat, style === 'datetime-seconds'));
  Object.assign(options, extra);
  try {
    // 'ymd' wants 2026-11-25; en-CA is the one common locale that emits that
    // order with numeric parts, regardless of the UI language.
    const locale = style !== 'time' && prefs.dateFormat === 'ymd' ? 'en-CA' : localeFor(prefs);
    return new Intl.DateTimeFormat(locale, options).format(d);
  } catch {
    return '';
  }
}

/** Date-only formats: dmy wants "25 Nov 2026", which en-GB produces; mdy/long use the UI locale. */
function localeFor(prefs: AdminPreferences): string {
  if (prefs.dateFormat === 'dmy') return 'en-GB';
  return prefs.locale;
}

/** Short relative label ("3 min ago", "in 2 days"); falls back to a date past ~30 days. */
export function formatRelative(value: DateInput, prefs: AdminPreferences = current): string {
  const d = toDate(value);
  if (!d) return '';
  const diff = (d.getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(prefs.locale, { numeric: 'auto' });
  if (abs < 60) return rtf.format(Math.round(diff), 'second');
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 30 * 86400) return rtf.format(Math.round(diff / 86400), 'day');
  return formatDateTime(d, 'date', {}, prefs);
}

/** UTC offset label for a zone, e.g. "UTC+08:00". */
export function timezoneOffsetLabel(tz: string, at: Date = new Date()): string {
  try {
    const part = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value;
    return part ? part.replace('GMT', 'UTC') : '';
  } catch {
    return '';
  }
}

/** All IANA zones the runtime knows, with the browser's own zone first. */
export function listTimezones(): string[] {
  const own = browserTimezone();
  let zones: string[] = [];
  try {
    zones = Intl.supportedValuesOf('timeZone');
  } catch {
    zones = ['UTC', own];
  }
  return [own, ...zones.filter((z) => z !== own)];
}

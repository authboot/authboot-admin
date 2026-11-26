'use client';

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useThemeConfig } from '@/components/themes/active-theme';
import { useLocale } from '@/components/i18n/active-locale';
import { preferencesQueryOptions } from '@/features/account/api/queries';
import {
  formatDateTime,
  formatRelative,
  getPreferences,
  parsePreferences,
  setPreferences,
  subscribePreferences,
  type AdminPreferences,
  type DateTimeStyle
} from '@/lib/preferences';

/**
 * Loads the signed-in admin's preferences once and applies them app-wide:
 * timezone/date/time formats go into the preference store that `formatDate`
 * reads; color theme, light/dark mode and language are pushed into their
 * existing providers. Mount inside the authenticated dashboard tree.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useQuery(preferencesQueryOptions());
  const { setActiveTheme } = useThemeConfig();
  const { setTheme } = useTheme();
  const { setLocale } = useLocale();

  // Apply to the store as soon as the data object changes. useMemo runs during
  // render, so children rendering in the same pass already see the loaded
  // preferences; the effect below handles the providers that need commit-time.
  const prefs = useMemo(() => {
    if (!data) return null;
    const parsed = parsePreferences(data.settings);
    setPreferences(parsed);
    return parsed;
  }, [data]);

  useEffect(() => {
    if (!prefs) return;
    setActiveTheme(prefs.theme);
    setTheme(prefs.themeMode);
    setLocale(prefs.locale);
  }, [prefs, setActiveTheme, setTheme, setLocale]);

  // Hold the first render until preferences are known. Components that call
  // the plain `formatDate` helper (table cells, column defs) do not subscribe
  // to the store, so letting them mount before the load would leave them on
  // browser defaults until something else re-rendered them. The request is a
  // same-origin GET of a tiny JSON map; the gate is only for the initial load,
  // not for refetches, and an error falls through to the defaults.
  if (isPending && !data) {
    return <div className='bg-background min-h-svh' aria-busy='true' />;
  }

  return <>{children}</>;
}

const serverSnapshot = getPreferences();

/** The effective preferences; re-renders when they change. */
export function usePreferences(): AdminPreferences {
  return useSyncExternalStore(subscribePreferences, getPreferences, () => serverSnapshot);
}

/**
 * Formatters bound to the admin's timezone and formats. Prefer this in
 * components over `formatDate` so the view re-renders when preferences change.
 */
export function useDateTime() {
  const prefs = usePreferences();
  return useMemo(
    () => ({
      prefs,
      /** Date only, e.g. "Nov 25, 2026". */
      date: (v: Date | string | number | null | undefined, extra?: Intl.DateTimeFormatOptions) =>
        formatDateTime(v, 'date', extra, prefs),
      /** Time only, e.g. "3:45 PM" / "15:45". */
      time: (v: Date | string | number | null | undefined, extra?: Intl.DateTimeFormatOptions) =>
        formatDateTime(v, 'time', extra, prefs),
      /** Date and time. */
      dateTime: (
        v: Date | string | number | null | undefined,
        extra?: Intl.DateTimeFormatOptions
      ) => formatDateTime(v, 'datetime', extra, prefs),
      /** Any style. */
      format: (
        v: Date | string | number | null | undefined,
        style: DateTimeStyle,
        extra?: Intl.DateTimeFormatOptions
      ) => formatDateTime(v, style, extra, prefs),
      /** "3 min ago", falling back to a date after ~30 days. */
      relative: (v: Date | string | number | null | undefined) => formatRelative(v, prefs)
    }),
    [prefs]
  );
}

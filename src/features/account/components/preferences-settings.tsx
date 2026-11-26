'use client';

import { useMemo } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { Icons } from '@/components/icons';
import { useAppForm } from '@/lib/form';
import { LOCALES } from '@/lib/i18n/locale.config';
import { THEMES } from '@/components/themes/theme.config';
import {
  DATE_FORMATS,
  THEME_MODES,
  TIME_FORMATS,
  formatDateTime,
  listTimezones,
  parsePreferences,
  serializePreferences,
  timezoneOffsetLabel,
  type AdminPreferences
} from '@/lib/preferences';
import { preferencesQueryOptions } from '../api/queries';
import { updateMySettingsMutation } from '../api/mutations';

const FORM_ID = 'admin-preferences-form';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

function isSame(a: AdminPreferences, b: AdminPreferences): boolean {
  return (
    a.timezone === b.timezone &&
    a.dateFormat === b.dateFormat &&
    a.timeFormat === b.timeFormat &&
    a.theme === b.theme &&
    a.themeMode === b.themeMode &&
    a.locale === b.locale
  );
}

// A fixed instant keeps the preview stable across renders (and SSR/CSR) while
// still showing the effect of each format; the offset label uses it too so DST
// zones read consistently.
const PREVIEW_AT = new Date('2026-11-25T15:45:00Z');

/** Live example of the current draft, so the admin sees the effect before saving. */
function PreferencePreview({ prefs }: { prefs: AdminPreferences }) {
  const now = PREVIEW_AT;
  return (
    <div className='bg-muted/40 rounded-lg border p-3 text-sm'>
      <p className='text-muted-foreground mb-2 text-xs font-medium'>How dates will look</p>
      <dl className='grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1'>
        <dt className='text-muted-foreground'>Date</dt>
        <dd>{formatDateTime(now, 'date', {}, prefs)}</dd>
        <dt className='text-muted-foreground'>Time</dt>
        <dd>{formatDateTime(now, 'time', {}, prefs)}</dd>
        <dt className='text-muted-foreground'>Date and time</dt>
        <dd>{formatDateTime(now, 'datetime', {}, prefs)}</dd>
        <dt className='text-muted-foreground'>Timezone</dt>
        <dd>
          {prefs.timezone}{' '}
          <span className='text-muted-foreground'>
            ({timezoneOffsetLabel(prefs.timezone, now)})
          </span>
        </dd>
      </dl>
    </div>
  );
}

/**
 * The signed-in admin's display preferences. Saved on the server
 * (/api/v1/admin/me/settings) and applied app-wide by PreferencesProvider:
 * every date in the dashboard is rendered in the chosen timezone and format.
 */
export function PreferencesSettings() {
  const { data } = useSuspenseQuery(preferencesQueryOptions());
  const saved = parsePreferences(data.settings);
  const mutation = useMutation(updateMySettingsMutation);

  const timezoneOptions = useMemo(
    () =>
      listTimezones().map((tz) => ({
        value: tz,
        label: `${tz.replaceAll('_', ' ')} (${timezoneOffsetLabel(tz)})`
      })),
    []
  );

  const form = useAppForm({
    defaultValues: saved,
    onSubmit: async ({ value, formApi }) => {
      try {
        // Merge over the stored map so keys this form does not own survive.
        await mutation.mutateAsync(serializePreferences(value, data.settings));
        formApi.reset(value);
        toast.success('Preferences saved');
      } catch (error) {
        toast.error(errorMessage(error));
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.settings className='size-5' />
          Preferences
        </CardTitle>
        <CardDescription>
          Timezone, date and time formats, appearance and language for your account. Applies
          everywhere you are signed in.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-6 md:grid-cols-2'>
        <form
          id={FORM_ID}
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='timezone'
              children={(field) => (
                <field.ComboboxField
                  label='Timezone'
                  options={timezoneOptions}
                  searchPlaceholder='Search timezones'
                  description='All dates and times are shown in this zone.'
                />
              )}
            />
            <form.AppField
              name='dateFormat'
              children={(field) => (
                <field.SelectField
                  label='Date format'
                  options={DATE_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
                />
              )}
            />
            <form.AppField
              name='timeFormat'
              children={(field) => (
                <field.SelectField
                  label='Time format'
                  options={TIME_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
                />
              )}
            />
            <form.AppField
              name='theme'
              children={(field) => (
                <field.SelectField
                  label='Theme'
                  options={THEMES.map((t) => ({ value: t.value, label: t.name }))}
                />
              )}
            />
            <form.AppField
              name='themeMode'
              children={(field) => (
                <field.SelectField
                  label='Appearance'
                  options={THEME_MODES.map((m) => ({ value: m.value, label: m.label }))}
                />
              )}
            />
            <form.AppField
              name='locale'
              children={(field) => (
                <field.SelectField
                  label='Language'
                  options={LOCALES.map((l) => ({ value: l.value, label: l.name }))}
                />
              )}
            />
          </FieldGroup>
        </form>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => <PreferencePreview prefs={values} />}
        </form.Subscribe>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const dirty = !isSame(values, saved);
            return (
              <>
                <Button
                  type='button'
                  variant='ghost'
                  disabled={!dirty}
                  onClick={() => form.reset()}
                >
                  Discard changes
                </Button>
                <LoadingButton
                  type='submit'
                  form={FORM_ID}
                  loading={mutation.isPending}
                  loadingLabel='Saving…'
                  disabled={!dirty}
                >
                  Save preferences
                </LoadingButton>
              </>
            );
          }}
        </form.Subscribe>
      </CardFooter>
    </Card>
  );
}

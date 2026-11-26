'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { LoadingButton } from '@/components/ui/loading-button';
import { Switch } from '@/components/ui/switch';
import { Icons } from '@/components/icons';
import { StatusBadge } from '@/components/status-badge';
import { useAppForm } from '@/lib/form';
import {
  DEFAULT_MAINTENANCE_NOTICE,
  MAINTENANCE_MESSAGE_MAX,
  MAINTENANCE_TITLE_MAX,
  maintenanceNoticeSchema,
  type MaintenanceNotice
} from '../schemas/workspace-policies';
import { organizationSettingsQueryOptions } from '../api/queries';
import { updateOrganizationSettingsMutation } from '../api/mutations';
import type { OrganizationMaintenance } from '../api/types';

type MaintenanceSettingsProps = {
  orgId: number;
  organizationName: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

/** Unix seconds → `datetime-local` value in the browser's zone, or '' for 0. */
function toLocalInput(unix: number): string {
  if (!unix) return '';
  return format(new Date(unix * 1000), "yyyy-MM-dd'T'HH:mm");
}

/** `datetime-local` value → unix seconds, 0 for empty/invalid. */
function fromLocalInput(value: string): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
}

function toApi(notice: MaintenanceNotice): Partial<OrganizationMaintenance> {
  return {
    title: notice.title,
    message: notice.message,
    expected_end: fromLocalInput(notice.expectedEnd)
  };
}

/** The saved notice as the form sees it; an untouched workspace shows the default. */
function noticeOf(m: OrganizationMaintenance): MaintenanceNotice {
  if (!m.title && !m.message) return DEFAULT_MAINTENANCE_NOTICE;
  return { title: m.title, message: m.message, expectedEnd: toLocalInput(m.expected_end) };
}

const NOTICE_FORM_ID = 'maintenance-notice-form';

// What changes for users while the workspace is in maintenance.
const MAINTENANCE_EFFECTS = [
  'Sign-in, sign-up and password reset are paused for this workspace.',
  'Users see the maintenance notice instead of the sign-in form.',
  'Workspace admins can still sign in to this dashboard.'
];

function formatExpectedEnd(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : formatDateTime(date);
}

function isSameNotice(a: MaintenanceNotice, b: MaintenanceNotice): boolean {
  return a.title === b.title && a.message === b.message && a.expectedEnd === b.expectedEnd;
}

/** The notice as users see it in place of the sign-in form. */
function NoticePreview({
  organizationName,
  notice
}: {
  organizationName: string;
  notice: MaintenanceNotice;
}) {
  const expectedEnd = formatExpectedEnd(notice.expectedEnd);

  return (
    <div className='bg-muted/40 rounded-lg border p-3'>
      <p className='text-muted-foreground mb-2 text-xs font-medium'>
        What users see on the sign-in page
      </p>
      <div className='bg-background flex flex-col items-center gap-2 rounded-md border px-4 py-6 text-center'>
        <div className='flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'>
          <Icons.maintenance className='size-5' />
        </div>
        <p className='text-sm font-semibold break-words'>{notice.title.trim() || 'Notice title'}</p>
        <p className='text-muted-foreground text-xs break-words whitespace-pre-line'>
          {notice.message.trim() || 'Your message to users appears here.'}
        </p>
        {expectedEnd && <p className='text-xs font-medium'>Expected back by {expectedEnd}</p>}
        <p className='text-muted-foreground mt-2 text-[11px]'>{organizationName}</p>
      </div>
    </div>
  );
}

/**
 * Maintenance mode for a workspace: the on/off switch (confirmed before it
 * takes users offline) and the notice shown while it is on. Both live in the
 * organization's settings on the server; while on, the backend rejects user
 * sign-in, sign-up and password reset for this workspace.
 */
export function MaintenanceSettings({ orgId, organizationName }: MaintenanceSettingsProps) {
  const { data } = useSuspenseQuery(organizationSettingsQueryOptions(orgId));
  const settings = data.settings;
  const maintenance = settings.maintenance;
  const enabled = maintenance.enabled;
  const startedAt = maintenance.started_at ? new Date(maintenance.started_at * 1000) : null;
  // The last saved notice — what users would see if maintenance were turned on.
  const savedNotice = noticeOf(maintenance);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const mutation = useMutation(updateOrganizationSettingsMutation);

  // PUT replaces the whole settings object, so only the maintenance block changes.
  function save(next: Partial<OrganizationMaintenance>) {
    return mutation.mutateAsync({
      id: orgId,
      settings: { ...settings, maintenance: { ...maintenance, ...next } }
    });
  }

  const form = useAppForm({
    defaultValues: savedNotice,
    validators: { onChange: maintenanceNoticeSchema },
    onSubmit: async ({ value, formApi }) => {
      const notice = maintenanceNoticeSchema.parse(value);
      try {
        await save(toApi(notice));
        formApi.reset(notice);
        toast.success('Maintenance notice saved');
      } catch (error) {
        toast.error(errorMessage(error));
      }
    }
  });

  async function handleToggle(next: boolean) {
    // Taking users offline is confirmed first; bringing them back is not.
    if (next) {
      setConfirmOpen(true);
      return;
    }
    try {
      await save({ enabled: false });
      toast.success('Maintenance mode is off');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleConfirm() {
    setConfirmOpen(false);
    try {
      // Turning on also persists the notice shown in the confirmation, so a
      // never-saved default notice is what users actually see.
      await save({ enabled: true, ...toApi(savedNotice) });
      toast.success('Maintenance mode is on');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className='space-y-4'>
      <Card className={enabled ? 'border-amber-300 dark:border-amber-800' : undefined}>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.maintenance className='size-5' />
            Maintenance mode
          </CardTitle>
          <CardDescription>
            Take {organizationName} offline for its users while you make changes, and bring it back
            when you are done.
          </CardDescription>
          <CardAction>
            <StatusBadge
              status={enabled ? 'maintenance' : 'live'}
              tone={enabled ? 'warning' : 'success'}
              label={enabled ? 'Under maintenance' : 'Live'}
            />
          </CardAction>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between gap-4 rounded-lg border p-3'>
            <div className='min-w-0'>
              <p className='text-sm font-medium'>
                {enabled ? 'Maintenance mode is on' : 'Maintenance mode is off'}
              </p>
              <p className='text-muted-foreground text-xs'>
                {enabled
                  ? `Users have seen the notice since ${startedAt ? formatDateTime(startedAt, 'time') : 'it was turned on'}.`
                  : 'Users can sign in and sign up as usual.'}
              </p>
            </div>
            <Switch
              checked={enabled}
              disabled={mutation.isPending}
              aria-label={`Turn maintenance mode ${enabled ? 'off' : 'on'}`}
              onCheckedChange={(next) => void handleToggle(next)}
            />
          </div>

          <div>
            <p className='text-sm font-medium'>While maintenance mode is on</p>
            <ul className='text-muted-foreground mt-2 space-y-1.5 text-sm'>
              {MAINTENANCE_EFFECTS.map((effect) => (
                <li key={effect} className='flex items-start gap-2'>
                  <Icons.check className='mt-0.5 size-4 shrink-0' />
                  {effect}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.notification className='size-5' />
            Maintenance notice
          </CardTitle>
          <CardDescription>
            Tell users what is happening and when to come back. You can prepare it before turning
            maintenance mode on.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6 md:grid-cols-2'>
          <form
            id={NOTICE_FORM_ID}
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField
                name='title'
                children={(field) => (
                  <field.TextField
                    label='Title'
                    required
                    maxLength={MAINTENANCE_TITLE_MAX}
                    placeholder="We'll be back soon"
                  />
                )}
              />
              <form.AppField
                name='message'
                children={(field) => (
                  <field.TextareaField
                    label='Message'
                    required
                    rows={5}
                    maxLength={MAINTENANCE_MESSAGE_MAX}
                    showCount
                    placeholder='What is happening, and what should users do?'
                  />
                )}
              />
              <form.AppField
                name='expectedEnd'
                children={(field) => (
                  <field.TextField
                    label='Expected end'
                    type='datetime-local'
                    description='Optional. Shown as "Expected back by…". Maintenance does not end automatically.'
                  />
                )}
              />
            </FieldGroup>
          </form>

          <form.Subscribe selector={(state) => state.values}>
            {(values) => <NoticePreview organizationName={organizationName} notice={values} />}
          </form.Subscribe>
        </CardContent>
        <CardFooter className='justify-end gap-2'>
          <form.Subscribe selector={(state) => state.values}>
            {(values) => {
              const isDirty = !isSameNotice(values, savedNotice);
              return (
                <>
                  <Button
                    type='button'
                    variant='ghost'
                    disabled={!isDirty}
                    onClick={() => form.reset()}
                  >
                    Discard changes
                  </Button>
                  <LoadingButton
                    type='submit'
                    form={NOTICE_FORM_ID}
                    loading={mutation.isPending}
                    loadingLabel='Saving…'
                    disabled={!isDirty}
                  >
                    Save notice
                  </LoadingButton>
                </>
              );
            }}
          </form.Subscribe>
        </CardFooter>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Put {organizationName} into maintenance?</AlertDialogTitle>
            <AlertDialogDescription>
              Users will not be able to sign in or sign up until you turn maintenance mode off. They
              will see the saved notice: &ldquo;{savedNotice.title}&rdquo;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirm()}>
              Turn on maintenance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

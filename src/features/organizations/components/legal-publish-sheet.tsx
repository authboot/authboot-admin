'use client';

import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Icons } from '@/components/icons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useAppForm } from '@/lib/form';
import type { LegalPublishInput } from '../constants/legal-documents';

const publishSchema = z
  .object({
    url: z
      .string()
      .trim()
      .refine((value) => /^https?:\/\/[^\s]+$/i.test(value), {
        message: 'Enter a valid URL starting with http:// or https://'
      }),
    changelog: z.string().trim().min(1, { message: 'Describe what changed in this version' }),
    publishNow: z.boolean(),
    scheduledAt: z.string()
  })
  .superRefine((value, ctx) => {
    if (value.publishNow) return;
    if (!value.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'Pick the date and time this version becomes effective'
      });
      return;
    }
    if (new Date(value.scheduledAt).getTime() <= Date.now()) {
      ctx.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'Scheduled time must be in the future'
      });
    }
  });

/**
 * "Publish new version" form. Published versions are immutable, so this sheet
 * only ever appends — there is no edit mode. The snapshot is fetched from the
 * URL server-side at publish time (guarded, 10s timeout, 256KB cap), so the
 * publisher never pastes content by hand.
 */
export function LegalPublishSheet({
  title,
  submitting = false,
  onClose,
  onPublish
}: {
  title: string;
  submitting?: boolean;
  onClose: () => void;
  onPublish: (input: LegalPublishInput) => void;
}) {
  const form = useAppForm({
    defaultValues: {
      url: '',
      changelog: '',
      publishNow: true,
      scheduledAt: ''
    },
    validators: { onSubmit: publishSchema },
    onSubmit: async ({ value }) => {
      onPublish({
        url: value.url.trim(),
        changelog: value.changelog.trim(),
        effectiveAt: value.publishNow
          ? new Date().toISOString()
          : new Date(value.scheduledAt).toISOString()
      });
      onClose();
    }
  });

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Publish new {title} version</SheetTitle>
          <SheetDescription>
            Published versions cannot be edited. This creates the next version and keeps the
            previous one in the history.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='legal-publish-form'
            className='space-y-4 p-4'
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField
                name='url'
                children={(field) => (
                  <field.TextField
                    label='Document URL'
                    type='url'
                    required
                    placeholder='https://example.com/terms'
                    autoComplete='off'
                  />
                )}
              />

              <form.AppField
                name='changelog'
                children={(field) => (
                  <field.TextareaField
                    label='Change summary'
                    required
                    description='Shown in the version history; keep it short and factual.'
                    placeholder='Added data transfer clauses…'
                    rows={3}
                  />
                )}
              />

              <form.AppField
                name='publishNow'
                children={(field) => (
                  <field.SwitchField
                    label='Publish immediately'
                    description='Turn off to pick a future effective time.'
                  />
                )}
              />

              <form.Subscribe selector={(state) => state.values.publishNow}>
                {(publishNow) =>
                  publishNow ? null : (
                    <form.AppField
                      name='scheduledAt'
                      children={(field) => (
                        <field.TextField label='Effective from' type='datetime-local' required />
                      )}
                    />
                  )
                }
              </form.Subscribe>

              <p className='text-muted-foreground flex items-start gap-2 text-xs'>
                <Icons.info className='mt-0.5 size-3.5 shrink-0' />
                <span>
                  The server fetches the URL at publish time and archives the exact bytes with a
                  SHA-256 hash as compliance evidence. Make sure the URL is publicly reachable.
                </span>
              </p>
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton form='legal-publish-form' loading={submitting}>
              Publish version
            </form.SubmitButton>
          </form.AppForm>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

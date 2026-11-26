'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useAuth } from '@/components/auth/auth-provider';
import { useAppForm } from '@/lib/form';
import { inviteAdminMutation } from '../api/mutations';

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

type InviteValues = z.infer<typeof inviteSchema>;

type InviteAdminSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Invite an admin by email. The backend creates a pending invitation and
 * emails a token; the invitee joins as `admin` and can be changed afterwards.
 */
export function InviteAdminSheet({ open, onOpenChange }: InviteAdminSheetProps) {
  const { activeOrganizationId } = useAuth();
  const mutation = useMutation(inviteAdminMutation);
  const form = useAppForm({
    defaultValues: { email: '' } as InviteValues,
    validators: { onSubmit: inviteSchema },
    onSubmit: async ({ value }) => {
      if (!activeOrganizationId) {
        toast.error('Select a workspace first');
        return;
      }
      try {
        await mutation.mutateAsync({ orgId: activeOrganizationId, email: value.email.trim() });
        toast.success(`Invitation sent to ${value.email}`);
        form.reset();
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Request failed');
      }
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Invite admin</SheetTitle>
          <SheetDescription>
            Send an email invitation to join this workspace&apos;s admin console.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form
            id='invite-admin-form'
            className='space-y-4 p-4'
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField
                name='email'
                children={(field) => (
                  <field.TextField
                    label='Email'
                    required
                    type='email'
                    placeholder='jane@example.com'
                  />
                )}
              />

              <div className='bg-muted/50 flex items-start gap-3 rounded-lg border p-3'>
                <Icons.shieldCheck className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Role: Admin</p>
                  <p className='text-muted-foreground text-xs'>
                    The invitee joins as an admin. You can change the role from the roster after
                    they accept. Invitations expire automatically; use &ldquo;Resend&rdquo; to issue
                    a fresh one.
                  </p>
                </div>
              </div>
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button
            type='button'
            variant='outline'
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <form.AppForm>
            <form.SubmitButton form='invite-admin-form'>Send invitation</form.SubmitButton>
          </form.AppForm>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function InviteAdminButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size='sm' onClick={() => setOpen(true)}>
        <Icons.userPlus className='size-4' />
        Invite admin
      </Button>
      <InviteAdminSheet open={open} onOpenChange={setOpen} />
    </>
  );
}

'use client';

import { useState } from 'react';
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
import { useAppForm } from '@/lib/form';

const inviteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address')
});

type InviteValues = z.infer<typeof inviteSchema>;

type InviteAdminSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Static invite flow — no membership API is wired up yet. */
export function InviteAdminSheet({ open, onOpenChange }: InviteAdminSheetProps) {
  const form = useAppForm({
    defaultValues: { name: '', email: '' } as InviteValues,
    validators: { onSubmit: inviteSchema },
    onSubmit: async ({ value }) => {
      // Simulate the request so the loading state is visible in demos.
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(`Invitation sent to ${value.email} (demo)`);
      form.reset();
      onOpenChange(false);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Invite admin</SheetTitle>
          <SheetDescription>
            Workspace membership is admin-only, so the invitee receives full admin access.
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
                name='name'
                children={(field) => (
                  <field.TextField label='Full name' required placeholder='Jane Doe' />
                )}
              />
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
                    This workspace does not have granular roles yet. Every member can manage
                    settings, members, and integrations.
                  </p>
                </div>
              </div>
            </FieldGroup>
          </form>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
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

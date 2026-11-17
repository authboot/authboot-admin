'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { Icons } from '@/components/icons';
import { useAppForm } from '@/lib/form';
import { requestPasswordReset } from '@/lib/auth-client';
import { AuthShell } from './auth-shell';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' })
});

export default function ForgotPasswordView() {
  // Once the request succeeds we swap the form for a confirmation panel.
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useAppForm({
    defaultValues: { email: '' },
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      const email = value.email.trim();
      const result = await requestPasswordReset(email);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setSentTo(email);
      toast.success('Reset email sent');
    }
  });

  return (
    <AuthShell
      topRight={
        <Link href='/auth/sign-in' className={buttonVariants({ variant: 'ghost' })}>
          Sign In
        </Link>
      }
      title='Reset your password'
      description="Enter the email linked to your account and we'll send a reset link or verification code"
      footer={
        <p className='text-muted-foreground px-8 text-center text-sm'>
          Remembered it?{' '}
          <Link href='/auth/sign-in' className='underline underline-offset-4 hover:text-primary'>
            Back to sign in
          </Link>
        </p>
      }
    >
      {sentTo ? (
        <div className='w-full space-y-5'>
          <div className='flex flex-col items-center gap-3 text-center'>
            <div className='bg-muted flex size-12 items-center justify-center rounded-full'>
              <Icons.mail className='size-5' />
            </div>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Check your inbox</p>
              <p className='text-muted-foreground text-sm'>
                If an account exists for{' '}
                <span className='text-foreground font-medium'>{sentTo}</span>, a reset email is on
                its way.
              </p>
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <Link
              href='/auth/sign-in'
              className={buttonVariants({ variant: 'default', className: 'w-full' })}
            >
              Back to sign in
            </Link>
            <Button
              type='button'
              variant='ghost'
              className='w-full'
              onClick={() => {
                setSentTo(null);
                form.reset();
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      ) : (
        <form
          className='grid w-full gap-4'
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.AppField
              name='email'
              children={(field) => (
                <field.TextField
                  label='Email'
                  type='email'
                  placeholder='name@example.com'
                  autoComplete='email'
                  autoFocus
                  required
                />
              )}
            />
          </FieldGroup>

          <form.AppForm>
            <form.SubmitButton className='w-full'>Send reset link</form.SubmitButton>
          </form.AppForm>
        </form>
      )}
    </AuthShell>
  );
}

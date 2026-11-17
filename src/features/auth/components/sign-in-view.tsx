'use client';

import { buttonVariants } from '@/components/ui/button';
import { login } from '@/lib/auth-client';
import { useAuth } from '@/components/auth/auth-provider';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';
import { LoadingButton } from '@/components/ui/loading-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthShell } from './auth-shell';

export default function SignInViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const redirectUrl = searchParams.get('redirect_url') || '/dashboard/overview';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isPending) return;
    setError(null);
    setIsPending(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.message);
        return;
      }
      // AuthProvider lives in the root layout and survives client navigation,
      // so reload the session here — otherwise the sidebar keeps the
      // pre-login (empty) user + organization state until a hard refresh.
      await refresh();
      router.push(redirectUrl);
      router.refresh();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AuthShell
      topRight={
        <Link href='/auth/sign-up' className={buttonVariants({ variant: 'ghost' })}>
          Sign Up
        </Link>
      }
      title='Welcome back'
      description='Sign in to your AuthBoot account to continue'
      footer={
        <p className='text-muted-foreground px-8 text-center text-sm'>
          Don&apos;t have an account?{' '}
          <Link href='/auth/sign-up' className='underline underline-offset-4 hover:text-primary'>
            Sign up
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className='grid w-full gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='email'>Email</Label>
          <Input
            id='email'
            type='email'
            placeholder='name@example.com'
            autoComplete='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className='grid gap-2'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='password'>Password</Label>
            <Link
              href='/auth/forgot-password'
              className='text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline'
            >
              Forgot password?
            </Link>
          </div>
          <InputGroup>
            <InputGroupInput
              id='password'
              type={showPassword ? 'text' : 'password'}
              placeholder='••••••••'
              autoComplete='current-password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                type='button'
                size='icon-xs'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                title={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? (
                  <Icons.eyeOff className='size-4' />
                ) : (
                  <Icons.eye className='size-4' />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {error && (
          <Alert variant='destructive'>
            <Icons.info className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <LoadingButton type='submit' className='w-full' loading={isPending}>
          Sign In
        </LoadingButton>
      </form>
    </AuthShell>
  );
}

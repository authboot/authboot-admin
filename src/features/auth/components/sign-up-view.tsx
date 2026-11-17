import { buttonVariants } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { AuthShell } from './auth-shell';

export default function SignUpViewPage() {
  return (
    <AuthShell
      topRight={
        <Link href='/auth/sign-in' className={buttonVariants({ variant: 'ghost' })}>
          Sign In
        </Link>
      }
      title='Create an account'
      description='Join the AuthBoot platform'
      footer={
        <p className='text-muted-foreground text-sm'>
          Already have an account?{' '}
          <Link href='/auth/sign-in' className='underline underline-offset-4 hover:text-primary'>
            Sign in
          </Link>
        </p>
      }
    >
      <Alert className='w-full'>
        <Icons.lock className='h-4 w-4' />
        <AlertDescription>
          <div className='mb-1 text-sm font-semibold'>Invitation required</div>
          <div className='text-muted-foreground text-sm'>
            Platform accounts are created by invitation. If you received an invitation link, open it
            to complete your registration.
          </div>
        </AlertDescription>
      </Alert>
    </AuthShell>
  );
}

import type { ReactNode } from 'react';
import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';

// Keep the header and back link in place while the profile loads.
export default function UserDetailLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer
      pageTitle='User details'
      pageDescription='Profile, contact information, addresses, security and admin notes for this user.'
      pageHeaderAction={
        <Link
          href='/dashboard/users'
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <Icons.chevronLeft className='size-4' />
          Back to users
        </Link>
      }
    >
      {children}
    </PageContainer>
  );
}

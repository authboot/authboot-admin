'use client';

import { Skeleton } from '@/components/ui/skeleton';
import UserLoginHistory from './user-login-history';
import UserSessionList from './user-session-list';

/**
 * Admin view of one user's security posture: live sessions and sign-in
 * history from authboot-server. (The backend has no per-user audit log
 * endpoint yet, so none is shown.)
 */
export function UserSecurity({ userId }: { userId: string }) {
  return (
    <div className='space-y-6'>
      <UserSessionList userId={userId} />
      <UserLoginHistory userId={userId} />
    </div>
  );
}

export function UserSecuritySkeleton() {
  return (
    <div className='space-y-6'>
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className='bg-card rounded-xl p-4 ring-1 ring-foreground/10'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='mt-2 h-4 w-64 max-w-full' />
          <Skeleton className='mt-4 h-40 w-full rounded-lg' />
        </div>
      ))}
    </div>
  );
}

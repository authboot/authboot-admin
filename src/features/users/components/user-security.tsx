'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { accountSecurityQueryOptions } from '@/features/security/api/queries';
import { AuditLogTableContent } from '@/features/security/components/security-tables';
import UserLoginHistory from './user-login-history';
import UserSessionList from './user-session-list';

/**
 * Admin view of one user's security posture. Sessions and login history are
 * live data from authboot-server; the security log is still a static preview
 * until the backend exposes per-user audit records.
 */
export function UserSecurity({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(accountSecurityQueryOptions(userId));

  return (
    <div className='space-y-6'>
      <UserSessionList userId={userId} />
      <UserLoginHistory userId={userId} />
      <AuditLogTableContent scope='user' rows={data.auditLogs} />
    </div>
  );
}

export function UserSecuritySkeleton() {
  return (
    <div className='space-y-6'>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className='bg-card rounded-xl p-4 ring-1 ring-foreground/10'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='mt-2 h-4 w-64 max-w-full' />
          <Skeleton className='mt-4 h-40 w-full rounded-lg' />
        </div>
      ))}
    </div>
  );
}

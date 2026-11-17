'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { accountSecurityQueryOptions } from '@/features/security/api/queries';
import {
  AuditLogTableContent,
  LoginLogTableContent,
  SessionTableContent
} from '@/features/security/components/security-tables';

/**
 * Admin view of one user's security posture: sessions, login history and the
 * security log. Static preview until authboot-server exposes per-user data.
 */
export function UserSecurity({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery(accountSecurityQueryOptions(userId));

  return (
    <div className='space-y-6'>
      <SessionTableContent scope='user' rows={data.sessions} />
      <LoginLogTableContent scope='user' rows={data.loginLogs} />
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

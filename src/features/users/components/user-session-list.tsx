'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { userSessionsOptions } from '../api/queries';
import type { UserSession } from '../api/types';
import { deviceLabel, formatDateTime } from '../utils/device';

type UserSessionListProps = {
  userId: string;
};

function joinParts(...parts: string[]) {
  return parts.filter(Boolean).join(' · ');
}

function SessionItem({ session }: { session: UserSession }) {
  const signedInFrom = joinParts(session.ip, session.location);
  const lastActiveFrom = joinParts(session.last_active_ip, session.last_active_location);
  const movedSinceSignIn = lastActiveFrom !== '' && lastActiveFrom !== signedInFrom;

  return (
    <div className='flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0'>
      <div className='flex min-w-0 items-start gap-3'>
        <Icons.laptop className='text-muted-foreground mt-0.5 size-5 shrink-0' />
        <div className='min-w-0 space-y-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-medium' title={session.user_agent || undefined}>
              {deviceLabel(session.device_name, session.user_agent)}
            </span>
            <Badge
              variant={session.status === 'active' ? 'default' : 'secondary'}
              className='capitalize'
            >
              {session.status}
            </Badge>
          </div>
          <p className='text-sm'>{signedInFrom || 'Unknown IP'}</p>
          {movedSinceSignIn && (
            <p className='text-muted-foreground text-sm'>Last seen from {lastActiveFrom}</p>
          )}
          <p
            className='text-muted-foreground truncate font-mono text-xs'
            title={session.session_id}
          >
            {session.session_id}
          </p>
          {session.client_id > 0 && (
            <p className='text-muted-foreground text-xs'>Client #{session.client_id}</p>
          )}
        </div>
      </div>
      <div className='text-muted-foreground shrink-0 space-y-1 text-right text-xs whitespace-nowrap'>
        <p>Signed in {formatDateTime(session.created_at)}</p>
        <p>Last active {formatDateTime(session.last_active_at)}</p>
        <p>Expires {formatDateTime(session.expires_at)}</p>
      </div>
    </div>
  );
}

export default function UserSessionList({ userId }: UserSessionListProps) {
  const { data, isPending, isError } = useQuery(userSessionsOptions(Number(userId)));
  const sessions = data?.sessions ?? [];
  const failureMessage = isError
    ? 'Failed to load sessions.'
    : data?.success === false
      ? data.message
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.laptop className='size-5' />
          Sessions
          {sessions.length > 0 && (
            <Badge variant='secondary'>{data?.total ?? sessions.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Devices this user is currently signed in on.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className='space-y-3'>
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
          </div>
        ) : sessions.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{failureMessage ?? 'No active sessions.'}</p>
        ) : (
          <div className='divide-y'>
            {sessions.map((session) => (
              <SessionItem key={session.session_id} session={session} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

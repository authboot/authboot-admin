'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { sessionsQueryOptions } from '../api/queries';
import type { SessionDevice } from '../api/types';

function isMobileSession(session: SessionDevice): boolean {
  return /ios|android|ipad|iphone/i.test(`${session.os} ${session.device_name}`);
}

function SessionRow({ session, onSignOut }: { session: SessionDevice; onSignOut?: () => void }) {
  const DeviceIcon = isMobileSession(session) ? Icons.phone : Icons.laptop;

  return (
    <div className='flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0'>
      <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-md'>
        <DeviceIcon className='size-4' />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium'>{session.device_name}</span>
          <span className='text-muted-foreground text-xs'>
            {session.browser} · {session.os}
          </span>
          {session.current && <Badge variant='secondary'>This device</Badge>}
        </div>
        <p className='text-muted-foreground truncate text-xs'>
          {session.ip} · {session.location}
        </p>
      </div>

      <div className='flex items-center gap-3'>
        <span className='text-muted-foreground text-xs whitespace-nowrap'>
          {session.current
            ? 'Active now'
            : `Last active ${formatDate(session.last_active_at, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}`}
        </span>
        {!session.current && onSignOut && (
          <Button type='button' variant='outline' size='sm' onClick={onSignOut}>
            Sign out
          </Button>
        )}
      </div>
    </div>
  );
}

export function DevicesSessions() {
  const { data } = useSuspenseQuery(sessionsQueryOptions());
  // Static screen: revoked sessions are hidden locally. Replace with a
  // `deleteSession` mutation once the backend endpoint exists.
  const [revokedIds, setRevokedIds] = useState<string[]>([]);

  const sessions = data.sessions.filter((session) => !revokedIds.includes(session.id));
  const others = sessions.filter((session) => !session.current);

  function signOutSession(session: SessionDevice) {
    setRevokedIds((prev) => [...prev, session.id]);
    toast.success(`Signed out of ${session.device_name}`);
  }

  function signOutOtherSessions() {
    const ids = others.map((session) => session.id);
    if (ids.length === 0) return;
    setRevokedIds((prev) => [...prev, ...ids]);
    toast.success(`Signed out of ${ids.length} other session${ids.length === 1 ? '' : 's'}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.shieldCheck className='size-5' />
          Devices &amp; sessions
        </CardTitle>
        <CardDescription>
          Browsers and apps currently signed in to your account. Revoke anything you don&apos;t
          recognise.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* px-4/py-4 gives the rows breathing room from the outer border;
            the dividers between rows keep 12px padding on both sides. */}
        <div className='divide-y rounded-lg border px-4 py-4'>
          {sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onSignOut={() => signOutSession(session)}
            />
          ))}
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-muted-foreground text-xs'>
            {others.length > 0
              ? `${others.length} other active session${others.length === 1 ? '' : 's'}`
              : 'No other devices are signed in.'}
          </p>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  disabled={others.length === 0}
                />
              }
            >
              Sign out all other sessions
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out all other sessions?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will stay signed in on this device. Every other browser and app will need to
                  sign in again.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant='destructive' onClick={signOutOtherSessions}>
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <p className='text-muted-foreground text-xs'>
          Device details are mocked until the session API is available.
        </p>
      </CardContent>
    </Card>
  );
}

export function DevicesSessionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-5 w-44' />
        <Skeleton className='h-4 w-full max-w-md' />
      </CardHeader>
      <CardContent className='space-y-3'>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className='h-16 w-full rounded-lg' />
        ))}
      </CardContent>
    </Card>
  );
}

'use client';

import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
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
import { useAuth } from '@/components/auth/auth-provider';
import { useDateTime } from '@/components/preferences/preferences-provider';
import { sessionsQueryOptions } from '../api/queries';
import { revokeSessionMutation, revokeSessionsMutation } from '../api/mutations';
import type { SessionDevice } from '../api/types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

function isMobileSession(session: SessionDevice): boolean {
  return /ios|android|ipad|iphone/i.test(session.device_name);
}

function SessionRow({
  session,
  busy,
  onSignOut
}: {
  session: SessionDevice;
  busy: boolean;
  onSignOut?: () => void;
}) {
  const DeviceIcon = isMobileSession(session) ? Icons.phone : Icons.laptop;
  const { dateTime } = useDateTime();

  return (
    <div className='flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0'>
      <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-md'>
        <DeviceIcon className='size-4' />
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium'>{session.device_name}</span>
          {session.current && <Badge variant='secondary'>This device</Badge>}
        </div>
        <p className='text-muted-foreground truncate text-xs'>
          Signed in {dateTime(session.created_at)}
          {session.expires_at ? ` · expires ${dateTime(session.expires_at)}` : ''}
        </p>
      </div>

      <div className='flex items-center gap-3'>
        <span className='text-muted-foreground text-xs whitespace-nowrap'>
          {session.current
            ? 'Active now'
            : session.last_active_at
              ? `Last active ${dateTime(session.last_active_at)}`
              : ''}
        </span>
        {!session.current && onSignOut && (
          <Button type='button' variant='outline' size='sm' disabled={busy} onClick={onSignOut}>
            Sign out
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * The signed-in admin's live sessions (redis-backed, so revoked ones simply
 * disappear). "Sign out all other sessions" revokes every session except the
 * current one, so the admin stays signed in here.
 */
export function DevicesSessions() {
  const { user } = useAuth();
  const accountId = user?.id ?? 0;
  const { data } = useSuspenseQuery(sessionsQueryOptions(accountId));
  const revokeOne = useMutation(revokeSessionMutation);
  const revokeMany = useMutation(revokeSessionsMutation);
  const busy = revokeOne.isPending || revokeMany.isPending;

  const sessions = data.sessions;
  const others = sessions.filter((session) => !session.current);

  async function signOutSession(session: SessionDevice) {
    try {
      await revokeOne.mutateAsync({ sessionId: session.id, accountId });
      toast.success(`Signed out of ${session.device_name}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function signOutOtherSessions() {
    const ids = others.map((session) => session.id);
    if (ids.length === 0) return;
    try {
      await revokeMany.mutateAsync({ sessionIds: ids, accountId });
      toast.success(`Signed out of ${ids.length} other session${ids.length === 1 ? '' : 's'}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.shieldCheck className='size-5' />
          Devices &amp; sessions
        </CardTitle>
        <CardDescription>
          Browsers and apps currently signed in to your admin account. Sign out anything you
          don&apos;t recognise.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {sessions.length === 0 ? (
          <p className='text-muted-foreground rounded-lg border border-dashed px-3 py-8 text-center text-sm'>
            No active sessions.
          </p>
        ) : (
          <div className='divide-y rounded-lg border px-4 py-4'>
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                busy={busy}
                onSignOut={() => void signOutSession(session)}
              />
            ))}
          </div>
        )}

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
                  disabled={others.length === 0 || busy}
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
                <AlertDialogAction
                  variant='destructive'
                  onClick={() => void signOutOtherSessions()}
                >
                  Sign out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { USER_LOGIN_LOGS_PAGE_SIZE, userLoginLogsOptions } from '../api/queries';
import { deviceLabel, formatDateTime } from '../utils/device';

type UserLoginHistoryProps = {
  userId: string;
};

export default function UserLoginHistory({ userId }: UserLoginHistoryProps) {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, isPlaceholderData } = useQuery(
    userLoginLogsOptions(Number(userId), page)
  );

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / USER_LOGIN_LOGS_PAGE_SIZE));
  const failureMessage = isError
    ? 'Failed to load login history.'
    : data?.success === false
      ? data.message
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.login className='size-5' />
          Login history
          {total > 0 && <Badge variant='secondary'>{total}</Badge>}
        </CardTitle>
        <CardDescription>Sign-in attempts for this user, newest first.</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {isPending ? (
          <div className='space-y-2'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full' />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className='text-muted-foreground text-sm'>{failureMessage ?? 'No login records.'}</p>
        ) : (
          <Table className={isPlaceholderData ? 'opacity-60' : undefined}>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Identity</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDateTime(log.created_at)}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Badge variant={log.success ? 'default' : 'destructive'}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                      {!log.success && log.err_msg && (
                        <span
                          className='text-muted-foreground max-w-40 truncate text-xs'
                          title={log.err_msg}
                        >
                          {log.err_msg}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.identity_value || '—'}
                    {log.identity_type && (
                      <span className='text-muted-foreground ml-1 text-xs'>
                        ({log.identity_type})
                      </span>
                    )}
                  </TableCell>
                  <TableCell title={log.user_agent || undefined}>
                    {deviceLabel(log.device_name, log.user_agent)}
                  </TableCell>
                  <TableCell className='font-mono text-xs'>{log.ip || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {total > USER_LOGIN_LOGS_PAGE_SIZE && (
          <div className='flex items-center justify-between'>
            <span className='text-muted-foreground text-xs'>
              Page {page} of {pageCount}
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={page >= pageCount || isPlaceholderData}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

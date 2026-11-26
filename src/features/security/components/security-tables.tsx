'use client';

import { useState, type ReactNode } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons, type Icon } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { auditLogsQueryOptions, loginLogsQueryOptions } from '../api/queries';
import type { AuditLogRecord, LoginLogRecord, SecurityContext, SecurityScope } from '../api/types';

type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

function formatDateTime(value: string): string {
  return formatDate(value, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ResultBadge({
  ok,
  okLabel,
  failLabel
}: {
  ok: boolean;
  okLabel: string;
  failLabel: string;
}) {
  return <Badge variant={ok ? 'secondary' : 'destructive'}>{ok ? okLabel : failLabel}</Badge>;
}

function TimeCell({ value }: { value: string }) {
  return (
    <span className='text-muted-foreground text-xs whitespace-nowrap'>{formatDateTime(value)}</span>
  );
}

function SecurityTable<T extends { id: string }>({
  icon: TableIcon,
  title,
  description,
  rows,
  columns,
  searchPlaceholder,
  searchText
}: {
  icon: Icon;
  title: string;
  description: string;
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder: string;
  searchText: (row: T) => string;
}) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((row) => searchText(row).toLowerCase().includes(needle))
    : rows;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <TableIcon className='size-5' />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='relative max-w-sm'>
          <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className='pl-8'
            aria-label={searchPlaceholder}
          />
        </div>

        <div className='overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.className}>
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-muted-foreground h-20 text-center'
                  >
                    No records match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className='text-muted-foreground text-xs'>
          Showing {filtered.length} of {rows.length} records · static preview
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Column definitions live at module scope so they are not re-created during
// render (react/no-unstable-nested-components).
// ---------------------------------------------------------------------------

const LOGIN_LOG_COLUMNS: Record<SecurityScope, Column<LoginLogRecord>[]> = {
  admin: [
    {
      key: 'account',
      header: 'Account',
      cell: (row) => <span className='font-medium'>{row.account}</span>
    },
    {
      key: 'ip',
      header: 'IP / location',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.ip}</p>
          <p className='text-muted-foreground text-xs'>{row.location}</p>
        </div>
      )
    },
    {
      key: 'device',
      header: 'Device',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.device}</p>
          <p className='text-muted-foreground text-xs'>{row.browser}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Result',
      cell: (row) => (
        <div className='space-y-1'>
          <ResultBadge ok={row.status === 'success'} okLabel='Success' failLabel='Failed' />
          <p className='text-muted-foreground text-xs'>{row.detail}</p>
        </div>
      )
    },
    { key: 'created_at', header: 'Time', cell: (row) => <TimeCell value={row.created_at} /> }
  ],
  user: [
    {
      key: 'ip',
      header: 'IP / location',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.ip}</p>
          <p className='text-muted-foreground text-xs'>{row.location}</p>
        </div>
      )
    },
    {
      key: 'device',
      header: 'Device',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.device}</p>
          <p className='text-muted-foreground text-xs'>{row.browser}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Result',
      cell: (row) => (
        <div className='space-y-1'>
          <ResultBadge ok={row.status === 'success'} okLabel='Success' failLabel='Failed' />
          <p className='text-muted-foreground text-xs'>{row.detail}</p>
        </div>
      )
    },
    { key: 'created_at', header: 'Time', cell: (row) => <TimeCell value={row.created_at} /> }
  ]
};

const AUDIT_COLUMNS: Record<SecurityScope, Column<AuditLogRecord>[]> = {
  admin: [
    {
      key: 'account',
      header: 'Actor',
      cell: (row) => <span className='font-medium'>{row.account}</span>
    },
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.action}</p>
          <p className='text-muted-foreground font-mono text-xs'>{row.resource}</p>
        </div>
      )
    },
    {
      key: 'result',
      header: 'Result',
      cell: (row) => (
        <ResultBadge ok={row.result === 'success'} okLabel='Success' failLabel='Failed' />
      )
    },
    { key: 'ip', header: 'IP', cell: (row) => <span className='font-mono text-xs'>{row.ip}</span> },
    { key: 'created_at', header: 'Time', cell: (row) => <TimeCell value={row.created_at} /> }
  ],
  user: [
    {
      key: 'action',
      header: 'Action',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.action}</p>
          <p className='text-muted-foreground font-mono text-xs'>{row.resource}</p>
        </div>
      )
    },
    {
      key: 'result',
      header: 'Result',
      cell: (row) => (
        <ResultBadge ok={row.result === 'success'} okLabel='Success' failLabel='Failed' />
      )
    },
    { key: 'ip', header: 'IP', cell: (row) => <span className='font-mono text-xs'>{row.ip}</span> },
    { key: 'created_at', header: 'Time', cell: (row) => <TimeCell value={row.created_at} /> }
  ]
};

const loginLogSearchText = (row: LoginLogRecord) =>
  [row.account ?? '', row.ip, row.location, row.device, row.browser, row.detail].join(' ');

const auditLogSearchText = (row: AuditLogRecord) =>
  [row.account ?? '', row.action, row.resource, row.result, row.ip].join(' ');

// ---------------------------------------------------------------------------
// Table components
// ---------------------------------------------------------------------------

export function LoginLogTableContent({
  scope,
  rows
}: {
  scope: SecurityScope;
  rows: LoginLogRecord[];
}) {
  return (
    <SecurityTable
      icon={Icons.login}
      title={scope === 'admin' ? 'User sign-in attempts' : 'Login history'}
      description={
        scope === 'admin'
          ? 'Sign-in attempts by app users of the active workspace, newest 100.'
          : 'Recent sign-in attempts on your admin account, newest 100.'
      }
      rows={rows}
      columns={LOGIN_LOG_COLUMNS[scope]}
      searchPlaceholder='Search by account, IP or device…'
      searchText={loginLogSearchText}
    />
  );
}

/** Organization + admin ids the security endpoints are scoped by. */
export function useSecurityContext(): SecurityContext {
  const { user, activeOrganizationId } = useAuth();
  return { orgId: activeOrganizationId ?? 0, adminId: user?.id ?? 0 };
}

export function LoginLogTable({ scope }: { scope: SecurityScope }) {
  const ctx = useSecurityContext();
  const { data } = useSuspenseQuery(loginLogsQueryOptions(scope, ctx));

  return <LoginLogTableContent scope={scope} rows={data} />;
}

export function AuditLogTableContent({
  scope,
  rows
}: {
  scope: SecurityScope;
  rows: AuditLogRecord[];
}) {
  return (
    <SecurityTable
      icon={Icons.forms}
      title={scope === 'admin' ? 'Admin audit logs' : 'Security log'}
      description={
        scope === 'admin'
          ? 'Privileged actions by admins in the active workspace, newest 100.'
          : 'Privileged actions you performed in the active workspace, newest 100.'
      }
      rows={rows}
      columns={AUDIT_COLUMNS[scope]}
      searchPlaceholder='Search by actor, action or resource…'
      searchText={auditLogSearchText}
    />
  );
}

export function AuditLogTable({ scope }: { scope: SecurityScope }) {
  const ctx = useSecurityContext();
  const { data } = useSuspenseQuery(auditLogsQueryOptions(scope, ctx));

  return <AuditLogTableContent scope={scope} rows={data} />;
}

export function SecurityTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className='h-5 w-44' />
        <Skeleton className='h-4 w-full max-w-md' />
      </CardHeader>
      <CardContent className='space-y-3'>
        <Skeleton className='h-8 w-64 max-w-full' />
        <Skeleton className='h-56 w-full rounded-lg' />
      </CardContent>
    </Card>
  );
}

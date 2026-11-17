'use client';

import { useState, type ReactNode } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
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
import {
  auditLogsQueryOptions,
  devicesQueryOptions,
  loginLogsQueryOptions,
  sessionsQueryOptions
} from '../api/queries';
import type {
  AuditLogRecord,
  DeviceRecord,
  LoginLogRecord,
  SecurityScope,
  SessionRecord
} from '../api/types';

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

const SESSION_COLUMNS: Record<SecurityScope, Column<SessionRecord>[]> = {
  admin: [
    {
      key: 'account',
      header: 'Account',
      cell: (row) => <span className='font-medium'>{row.account}</span>
    },
    {
      key: 'device',
      header: 'Device',
      cell: (row) => (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-medium'>{row.device}</span>
          {row.current && <Badge variant='outline'>This device</Badge>}
        </div>
      )
    },
    {
      key: 'ip',
      header: 'IP / location',
      cell: (row) => (
        <div>
          <p className='font-mono text-xs'>{row.ip}</p>
          <p className='text-muted-foreground text-xs'>{row.location}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <ResultBadge ok={row.status === 'active'} okLabel='Active' failLabel='Revoked' />
      )
    },
    {
      key: 'last_active_at',
      header: 'Last active',
      cell: (row) =>
        row.current ? (
          <span className='text-muted-foreground text-xs whitespace-nowrap'>Active now</span>
        ) : (
          <TimeCell value={row.last_active_at} />
        )
    }
  ],
  user: [
    {
      key: 'device',
      header: 'Device',
      cell: (row) => (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='font-medium'>{row.device}</span>
          {row.current && <Badge variant='outline'>This device</Badge>}
        </div>
      )
    },
    {
      key: 'ip',
      header: 'IP / location',
      cell: (row) => (
        <div>
          <p className='font-mono text-xs'>{row.ip}</p>
          <p className='text-muted-foreground text-xs'>{row.location}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <ResultBadge ok={row.status === 'active'} okLabel='Active' failLabel='Revoked' />
      )
    },
    {
      key: 'last_active_at',
      header: 'Last active',
      cell: (row) =>
        row.current ? (
          <span className='text-muted-foreground text-xs whitespace-nowrap'>Active now</span>
        ) : (
          <TimeCell value={row.last_active_at} />
        )
    }
  ]
};

const DEVICE_COLUMNS: Record<SecurityScope, Column<DeviceRecord>[]> = {
  admin: [
    {
      key: 'account',
      header: 'Owner',
      cell: (row) => <span className='font-medium'>{row.account}</span>
    },
    {
      key: 'device',
      header: 'Device',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.name}</p>
          <p className='text-muted-foreground text-xs'>
            {row.os} · {row.browser}
          </p>
        </div>
      )
    },
    { key: 'ip', header: 'IP', cell: (row) => <span className='font-mono text-xs'>{row.ip}</span> },
    {
      key: 'trusted',
      header: 'Trust',
      cell: (row) => (
        <Badge variant={row.trusted ? 'secondary' : 'outline'}>
          {row.trusted ? 'Trusted' : 'Unverified'}
        </Badge>
      )
    },
    {
      key: 'last_seen_at',
      header: 'Last seen',
      cell: (row) => <TimeCell value={row.last_seen_at} />
    }
  ],
  user: [
    {
      key: 'device',
      header: 'Device',
      cell: (row) => (
        <div>
          <p className='font-medium'>{row.name}</p>
          <p className='text-muted-foreground text-xs'>
            {row.os} · {row.browser}
          </p>
        </div>
      )
    },
    { key: 'ip', header: 'IP', cell: (row) => <span className='font-mono text-xs'>{row.ip}</span> },
    {
      key: 'trusted',
      header: 'Trust',
      cell: (row) => (
        <Badge variant={row.trusted ? 'secondary' : 'outline'}>
          {row.trusted ? 'Trusted' : 'Unverified'}
        </Badge>
      )
    },
    {
      key: 'last_seen_at',
      header: 'Last seen',
      cell: (row) => <TimeCell value={row.last_seen_at} />
    }
  ]
};

const loginLogSearchText = (row: LoginLogRecord) =>
  [row.account ?? '', row.ip, row.location, row.device, row.browser, row.detail].join(' ');

const auditLogSearchText = (row: AuditLogRecord) =>
  [row.account ?? '', row.action, row.resource, row.result, row.ip].join(' ');

const sessionSearchText = (row: SessionRecord) =>
  [row.account ?? '', row.device, row.ip, row.location, row.status].join(' ');

const deviceSearchText = (row: DeviceRecord) =>
  [row.account ?? '', row.name, row.os, row.browser, row.ip].join(' ');

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
      title={scope === 'admin' ? 'Admin login logs' : 'Login history'}
      description={
        scope === 'admin'
          ? 'Sign-in attempts across every admin account (tb_admin_login_logs).'
          : 'Recent sign-in attempts on your account (tb_user_login_logs).'
      }
      rows={rows}
      columns={LOGIN_LOG_COLUMNS[scope]}
      searchPlaceholder='Search by account, IP or device…'
      searchText={loginLogSearchText}
    />
  );
}

export function LoginLogTable({ scope }: { scope: SecurityScope }) {
  const { data } = useSuspenseQuery(loginLogsQueryOptions(scope));

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
          ? 'Privileged actions performed by admins (tb_admin_audit_logs).'
          : 'Security-relevant changes on your account (tb_user_audit_logs).'
      }
      rows={rows}
      columns={AUDIT_COLUMNS[scope]}
      searchPlaceholder='Search by actor, action or resource…'
      searchText={auditLogSearchText}
    />
  );
}

export function AuditLogTable({ scope }: { scope: SecurityScope }) {
  const { data } = useSuspenseQuery(auditLogsQueryOptions(scope));

  return <AuditLogTableContent scope={scope} rows={data} />;
}

export function SessionTableContent({
  scope,
  rows
}: {
  scope: SecurityScope;
  rows: SessionRecord[];
}) {
  return (
    <SecurityTable
      icon={Icons.laptop}
      title='Sessions'
      description={
        scope === 'admin'
          ? 'Active and revoked admin sessions (tb_admin_sessions).'
          : 'Your active sessions (tb_user_sessions).'
      }
      rows={rows}
      columns={SESSION_COLUMNS[scope]}
      searchPlaceholder='Search by account, device or IP…'
      searchText={sessionSearchText}
    />
  );
}

export function SessionTable({ scope }: { scope: SecurityScope }) {
  const { data } = useSuspenseQuery(sessionsQueryOptions(scope));

  return <SessionTableContent scope={scope} rows={data} />;
}

export function DeviceTableContent({
  scope,
  rows
}: {
  scope: SecurityScope;
  rows: DeviceRecord[];
}) {
  return (
    <SecurityTable
      icon={Icons.phone}
      title='Devices'
      description={
        scope === 'admin'
          ? 'Devices seen across admin accounts (tb_admin_devices).'
          : 'Devices linked to your account (tb_user_devices).'
      }
      rows={rows}
      columns={DEVICE_COLUMNS[scope]}
      searchPlaceholder='Search by owner, device or IP…'
      searchText={deviceSearchText}
    />
  );
}

export function DeviceTable({ scope }: { scope: SecurityScope }) {
  const { data } = useSuspenseQuery(devicesQueryOptions(scope));

  return <DeviceTableContent scope={scope} rows={data} />;
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

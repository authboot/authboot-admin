'use client';

import type { Column, ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { TeamMember } from '../../api/types';
import { MemberCellAction } from './cell-action';
import { MemberRoleCell } from './role-cell';

function DateCell({ value, empty = '—' }: { value: string; empty?: string }) {
  return (
    <span className='text-muted-foreground text-xs whitespace-nowrap'>
      {value ? formatDate(value) : empty}
    </span>
  );
}

export const ROLE_OPTIONS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' }
];

export const MEMBER_STATUS_OPTIONS = [
  { label: 'Active', value: '2' },
  { label: 'Pending', value: '1' },
  { label: 'Suspended', value: '3' }
];

export const MFA_OPTIONS = [
  { label: 'Enabled', value: '1' },
  { label: 'Off', value: '2' }
];

export const columns: ColumnDef<TeamMember>[] = [
  {
    id: 'member',
    accessorFn: (row) => `${row.name} ${row.email}`,
    header: ({ column }: { column: Column<TeamMember, unknown> }) => (
      <DataTableColumnHeader column={column} title='Member' />
    ),
    cell: ({ row }) => {
      const m = row.original;
      return (
        <div className='flex items-center gap-2'>
          <Avatar className='size-8 rounded-full'>
            <AvatarImage src={m.avatar || ''} alt={m.name} />
            <AvatarFallback className='text-xs'>{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-col'>
            <span className='flex items-center gap-1.5 truncate font-medium'>
              {m.name}
              {m.is_current_user && (
                <Badge variant='secondary' className='h-4 px-1 text-[10px]'>
                  You
                </Badge>
              )}
            </span>
            <a
              href={`mailto:${m.email}`}
              className='text-muted-foreground truncate text-xs hover:underline'
            >
              {m.email}
            </a>
          </div>
        </div>
      );
    },
    meta: {
      label: 'Member',
      placeholder: 'Search by name or email…',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <MemberRoleCell member={row.original} />,
    meta: { label: 'Role', variant: 'select' as const, options: ROLE_OPTIONS },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: { label: 'Status', variant: 'select' as const, options: MEMBER_STATUS_OPTIONS },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    id: 'mfa',
    accessorKey: 'two_factor_enabled',
    header: '2FA',
    meta: { label: '2FA', variant: 'select' as const, options: MFA_OPTIONS },
    enableColumnFilter: true,
    cell: ({ row }) => (
      <span
        className={cn(
          'text-xs',
          row.original.two_factor_enabled ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {row.original.two_factor_enabled ? 'Enabled' : 'Off'}
      </span>
    ),
    enableSorting: false
  },
  {
    accessorKey: 'joined_at',
    header: 'Joined',
    cell: ({ row }) => <DateCell value={row.original.joined_at} />,
    enableSorting: false
  },
  {
    accessorKey: 'last_active_at',
    header: 'Last active',
    cell: ({ row }) => <DateCell value={row.original.last_active_at} empty='Never' />,
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <MemberCellAction member={row.original} />,
    enableSorting: false,
    enableHiding: false
  }
];

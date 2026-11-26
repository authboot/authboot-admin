'use client';

import type { Column, ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { Icons } from '@/components/icons';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/format';
import type { TeamInvitation } from '../../api/types';
import { InvitationCellAction } from './cell-action';

export const INVITATION_STATUS_OPTIONS = [
  { label: 'Pending', value: '1' },
  { label: 'Accepted', value: '2' },
  { label: 'Expired', value: '3' },
  { label: 'Revoked', value: '4' }
];

function DateCell({ value }: { value: string }) {
  return (
    <span className='text-muted-foreground text-xs whitespace-nowrap'>
      {value ? formatDate(value) : '—'}
    </span>
  );
}

export const columns: ColumnDef<TeamInvitation>[] = [
  {
    accessorKey: 'email',
    header: ({ column }: { column: Column<TeamInvitation, unknown> }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <a href={`mailto:${row.original.email}`} className='font-medium hover:underline'>
        {row.original.email}
      </a>
    ),
    meta: {
      label: 'Email',
      placeholder: 'Search by email…',
      variant: 'text' as const,
      icon: Icons.mail
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    meta: {
      label: 'Status',
      variant: 'select' as const,
      options: INVITATION_STATUS_OPTIONS
    },
    enableColumnFilter: true,
    enableSorting: false
  },
  {
    accessorKey: 'invited_at',
    header: 'Invited',
    cell: ({ row }) => <DateCell value={row.original.invited_at} />,
    enableSorting: false
  },
  {
    accessorKey: 'expires_at',
    header: 'Expires',
    cell: ({ row }) => <DateCell value={row.original.expires_at} />,
    enableSorting: false
  },
  {
    id: 'actions',
    cell: ({ row }) => <InvitationCellAction invitation={row.original} />,
    enableSorting: false,
    enableHiding: false
  }
];

'use client';

import { StatusBadge } from '@/components/status-badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { User } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';
import { formatDate } from '@/lib/format';

// Missing backend timestamps are mapped to the unix epoch — render a dash
// instead of "January 1, 1970".
function formatCellDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000) return '—';
  return formatDate(date);
}

function EmptyValue() {
  return <span className='text-muted-foreground'>—</span>;
}

export const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    accessorFn: (row) => `${row.first_name} ${row.last_name}`.trim(),
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='User' />
    ),
    cell: ({ row }) => {
      const name = `${row.original.first_name} ${row.original.last_name}`.trim() || 'Unnamed';
      return (
        <div className='flex min-w-0 flex-col'>
          <span className='truncate font-medium'>{name}</span>
          <span className='text-muted-foreground text-xs'>#{row.original.id}</span>
        </div>
      );
    },
    meta: {
      label: 'Name',
      placeholder: 'Search by name, email or phone…',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'email',
    header: 'EMAIL',
    meta: { label: 'Email', placeholder: 'Contains…', variant: 'text' as const },
    enableColumnFilter: true,
    cell: ({ row }) =>
      row.original.email ? (
        <a
          href={`mailto:${row.original.email}`}
          className='text-sm hover:underline'
          title={row.original.email}
        >
          {row.original.email}
        </a>
      ) : (
        <EmptyValue />
      )
  },
  {
    accessorKey: 'phone',
    header: 'PHONE',
    meta: { label: 'Phone', placeholder: 'Contains…', variant: 'text' as const },
    enableColumnFilter: true,
    cell: ({ row }) =>
      row.original.phone ? (
        <span className='text-sm whitespace-nowrap'>{row.original.phone}</span>
      ) : (
        <EmptyValue />
      )
  },
  {
    accessorKey: 'status',
    header: 'STATUS',
    meta: {
      label: 'Status',
      variant: 'select' as const,
      options: [
        { label: 'Active', value: '1' },
        { label: 'Disabled', value: '2' }
      ]
    },
    enableColumnFilter: true,
    cell: ({ cell }) => <StatusBadge status={cell.getValue<User['status']>()} />
  },
  {
    accessorKey: 'created_at',
    header: 'CREATED',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-xs whitespace-nowrap'>
        {formatCellDate(row.original.created_at)}
      </span>
    )
  },
  {
    accessorKey: 'updated_at',
    header: 'UPDATED',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-xs whitespace-nowrap'>
        {formatCellDate(row.original.updated_at)}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];

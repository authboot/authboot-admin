'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        <div className='flex items-center gap-2'>
          <Avatar className='size-8 rounded-lg'>
            <AvatarImage src={row.original.avatar || ''} alt={name} />
            <AvatarFallback className='text-xs'>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-col'>
            <span className='truncate font-medium'>{name}</span>
            <span className='text-muted-foreground text-xs'>#{row.original.id}</span>
          </div>
        </div>
      );
    },
    meta: {
      label: 'Name',
      placeholder: 'Search users...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'email',
    header: 'EMAIL',
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
    cell: ({ cell }) => {
      const status = cell.getValue<User['status']>();
      const variant =
        status === 'Active' ? 'default' : status === 'Inactive' ? 'secondary' : 'outline';
      return <Badge variant={variant}>{status}</Badge>;
    }
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

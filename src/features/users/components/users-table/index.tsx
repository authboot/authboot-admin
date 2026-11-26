'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterToolbar } from '@/components/ui/table/data-table-filter-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { usersQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function UsersTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    email: parseAsString,
    phone: parseAsString,
    status: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  // Only created_at / updated_at are sortable server-side; first sort wins.
  const sort = params.sort[0];
  const sortParam =
    sort && (sort.id === 'created_at' || sort.id === 'updated_at')
      ? `${sort.id}_${sort.desc ? 'desc' : 'asc'}`
      : undefined;
  const status = params.status?.[0] ? Number(params.status[0]) : undefined;

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.email && { email: params.email }),
    ...(params.phone && { phone: params.phone }),
    ...(status && { status }),
    ...(sortParam && { sort: sortParam })
  };

  const { data } = useSuspenseQuery(usersQueryOptions(filters));

  const pageCount = Math.max(1, Math.ceil(data.total_users / params.perPage));

  const { table } = useDataTable({
    data: data.users,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <DataTable table={table}>
      <DataTableFilterToolbar table={table} searchPlaceholder='Search by name, email or phone…' />
    </DataTable>
  );
}

export function UsersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}

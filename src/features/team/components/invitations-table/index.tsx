'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterToolbar } from '@/components/ui/table/data-table-filter-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useAuth } from '@/components/auth/auth-provider';
import { teamInvitationsOptions } from '../../api/queries';
import { columns } from './columns';

/** Server-paginated list of email invitations, filterable by status. */
export function InvitationsTable() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId ?? 0;
  // `email` and `status` are the filterable column ids written by useDataTable.
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    email: parseAsString,
    status: parseAsArrayOf(parseAsString, ',')
  });

  // The backend takes one status; the faceted filter is single-select here.
  const status = params.status?.[0] ? Number(params.status[0]) : undefined;
  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.email && { search: params.email }),
    ...(status && { status })
  };
  const { data } = useSuspenseQuery(teamInvitationsOptions(orgId, filters));
  const pageCount = Math.max(1, Math.ceil(data.total / params.perPage));

  const { table } = useDataTable({
    data: data.invitations,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    getRowId: (row) => String(row.invitation_id),
    initialState: { columnPinning: { right: ['actions'] } }
  });

  return (
    <DataTable table={table}>
      <DataTableFilterToolbar table={table} searchPlaceholder='Search by email…' />
    </DataTable>
  );
}

'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterToolbar } from '@/components/ui/table/data-table-filter-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { useAuth } from '@/components/auth/auth-provider';
import { teamMembersOptions } from '../../api/queries';
import { columns } from './columns';
import type { TeamRole } from '../../api/types';

/** Server-paginated roster of accounts that have joined the workspace. */
export function MembersTable() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId ?? 0;
  // URL keys are the filterable column ids; useDataTable writes them.
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    member: parseAsString,
    role: parseAsArrayOf(parseAsString, ','),
    status: parseAsArrayOf(parseAsString, ','),
    mfa: parseAsArrayOf(parseAsString, ',')
  });

  // Select filters are single-value here (the backend takes one per field).
  const role = params.role?.[0] as TeamRole | undefined;
  const status = params.status?.[0] ? Number(params.status[0]) : undefined;
  const mfa = params.mfa?.[0] ? Number(params.mfa[0]) : undefined;
  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.member && { search: params.member }),
    ...(role && { role }),
    ...(status && { status }),
    ...(mfa && { mfa })
  };
  const { data } = useSuspenseQuery(teamMembersOptions(orgId, filters));
  const pageCount = Math.max(1, Math.ceil(data.total / params.perPage));

  const { table } = useDataTable({
    data: data.members,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    getRowId: (row) => String(row.membership_id),
    initialState: { columnPinning: { right: ['actions'] } }
  });

  return (
    <DataTable table={table}>
      <DataTableFilterToolbar table={table} searchPlaceholder='Search by name or email…' />
    </DataTable>
  );
}

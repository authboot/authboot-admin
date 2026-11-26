import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { usersQueryOptions } from '../api/queries';
import { UsersTable } from './users-table';

export default function UserListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const email = searchParamsCache.get('email');
  const phone = searchParamsCache.get('phone');
  const statusRaw = searchParamsCache.get('status');
  const status = statusRaw ? Number(statusRaw.split(',')[0]) : undefined;

  // Prefetch mirrors the client-side key in users-table/index.tsx; `sort`
  // there is a JSON sorting state, which the client maps itself, so it is
  // left out here (a mismatch just means no cache hit, not wrong data).
  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(email && { email }),
    ...(phone && { phone }),
    ...(status && { status })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(usersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable />
    </HydrationBoundary>
  );
}

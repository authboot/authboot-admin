import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  userByIdOptions,
  userAddressesOptions,
  userNotesOptions,
  userSessionsOptions,
  userLoginLogsOptions
} from '@/features/users/api/queries';
import { accountSecurityQueryOptions } from '@/features/security/api/queries';
import UserViewPage from '@/features/users/components/user-view-page';

export const metadata = {
  title: 'Dashboard : User View'
};

type PageProps = { params: Promise<{ userId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(userByIdOptions(Number(params.userId)));
  void queryClient.prefetchQuery(userAddressesOptions(Number(params.userId)));
  void queryClient.prefetchQuery(userNotesOptions(Number(params.userId)));
  void queryClient.prefetchQuery(accountSecurityQueryOptions(params.userId));
  void queryClient.prefetchQuery(userSessionsOptions(Number(params.userId)));
  void queryClient.prefetchQuery(userLoginLogsOptions(Number(params.userId)));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserViewPage userId={params.userId} />
    </HydrationBoundary>
  );
}

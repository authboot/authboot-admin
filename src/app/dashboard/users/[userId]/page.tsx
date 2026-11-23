import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import Link from 'next/link';
import { getQueryClient } from '@/lib/query-client';
import {
  userByIdOptions,
  userAddressesOptions,
  userNotesOptions,
  userSessionsOptions,
  userLoginLogsOptions
} from '@/features/users/api/queries';
import { accountSecurityQueryOptions } from '@/features/security/api/queries';
import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
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
    <PageContainer
      pageTitle='User details'
      pageDescription='Profile, contact information, addresses, security and admin notes for this user.'
      pageHeaderAction={
        <Link
          href='/dashboard/users'
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <Icons.chevronLeft className='size-4' />
          Back to users
        </Link>
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UserViewPage userId={params.userId} />
      </HydrationBoundary>
    </PageContainer>
  );
}

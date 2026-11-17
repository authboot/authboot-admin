import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { teamInfoContent } from '@/config/infoconfig';
import { teamMembersOptions } from '@/features/team/api/queries';
import { InviteAdminButton } from '@/features/team/components/invite-admin-sheet';
import { TeamView } from '@/features/team/components/team-view';

export const metadata = {
  title: 'Dashboard: Team'
};

export default function TeamPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(teamMembersOptions());

  return (
    <PageContainer
      pageTitle='Team'
      pageDescription='Admins with access to this workspace. Static preview until membership APIs land.'
      infoContent={teamInfoContent}
      pageHeaderAction={<InviteAdminButton />}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TeamView />
      </HydrationBoundary>
    </PageContainer>
  );
}

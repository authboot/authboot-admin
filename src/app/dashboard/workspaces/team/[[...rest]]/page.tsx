import PageContainer from '@/components/layout/page-container';
import { teamInfoContent } from '@/config/infoconfig';
import { InviteAdminButton } from '@/features/team/components/invite-admin-sheet';
import { TeamView } from '@/features/team/components/team-view';

export const metadata = {
  title: 'Dashboard: Team'
};

// The active organization is only known client-side (auth provider), so the
// roster is fetched in the browser instead of prefetched on the server.
export default function TeamPage() {
  return (
    <PageContainer
      pageTitle='Team'
      pageDescription='Admins with access to this workspace and pending invitations.'
      infoContent={teamInfoContent}
      pageHeaderAction={<InviteAdminButton />}
    >
      <TeamView />
    </PageContainer>
  );
}

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { cookies } from 'next/headers';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';
import { WorkspaceSettingsView } from '@/features/organizations/components/workspace-settings-view';
import { workspaceSettingsInfoContent } from '@/config/infoconfig';

export const metadata = {
  title: 'Dashboard: Workspace Settings'
};

export default async function WorkspaceSettingsPage() {
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);

  return (
    <PageContainer
      pageTitle='Workspace Settings'
      pageDescription='Manage the active workspace: identity, sign-in rules, verification codes, message delivery, email templates, and maintenance.'
      infoContent={workspaceSettingsInfoContent}
    >
      {orgId ? (
        <WorkspaceSettingsView orgId={orgId} />
      ) : (
        <Card className='max-w-3xl'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.workspace className='size-5' />
              No active workspace
            </CardTitle>
            <CardDescription>
              Select or create a workspace first, then you can configure its settings.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm'>
            Use the workspace switcher in the header to activate one.
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

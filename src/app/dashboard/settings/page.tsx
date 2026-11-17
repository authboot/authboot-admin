import PageContainer from '@/components/layout/page-container';
import { SettingsView } from '@/features/account/components/settings-view';

export const metadata = {
  title: 'Dashboard: Settings'
};

export default function SettingsPage() {
  return (
    <PageContainer
      pageTitle='Settings'
      pageDescription='Manage your account and the devices signed in to it.'
    >
      <SettingsView />
    </PageContainer>
  );
}

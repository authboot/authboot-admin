import PageContainer from '@/components/layout/page-container';
import { LegalSettings } from '@/features/organizations/components/legal-settings';

export const metadata = {
  title: 'Dashboard: Legal Documents'
};

export default function LegalPage() {
  return (
    <PageContainer
      pageTitle='Legal documents'
      pageDescription='Terms of Service and Privacy Policy for this workspace.'
    >
      <LegalSettings />
    </PageContainer>
  );
}

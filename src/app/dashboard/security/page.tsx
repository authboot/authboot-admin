import PageContainer from '@/components/layout/page-container';
import { SecurityCenter } from '@/features/security/components/security-center';

export const metadata = {
  title: 'Dashboard: Security'
};

export default function SecurityPage() {
  return (
    <PageContainer
      pageTitle='Security'
      pageDescription='Monitor sessions, devices and account activity across the platform.'
    >
      <SecurityCenter />
    </PageContainer>
  );
}

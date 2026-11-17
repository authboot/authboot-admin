'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { ProfileSettings } from '@/features/profile/components/profile-view-page';
import { AccountSecurity } from '@/features/security/components/account-security';

/**
 * Account settings shell: profile (personal info) and security
 * (devices & sessions, login history, security log).
 */
export function SettingsView() {
  return (
    <Tabs defaultValue='profile' className='gap-6'>
      <TabsList>
        <TabsTrigger value='profile'>
          <Icons.account />
          Profile
        </TabsTrigger>
        <TabsTrigger value='security'>
          <Icons.lock />
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value='profile'>
        <ProfileSettings />
      </TabsContent>

      <TabsContent value='security'>
        <AccountSecurity />
      </TabsContent>
    </Tabs>
  );
}

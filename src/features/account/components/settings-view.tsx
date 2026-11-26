'use client';

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { ProfileSettings } from '@/features/profile/components/profile-view-page';
import { AccountSecurity } from '@/features/security/components/account-security';
import { PreferencesSettings } from './preferences-settings';

/**
 * Account settings shell: profile (personal info), preferences (timezone,
 * formats, appearance, language) and security (devices & sessions, login
 * history, security log).
 */
export function SettingsView() {
  return (
    <Tabs defaultValue='profile' className='gap-6'>
      <TabsList>
        <TabsTrigger value='profile'>
          <Icons.account />
          Profile
        </TabsTrigger>
        <TabsTrigger value='preferences'>
          <Icons.settings />
          Preferences
        </TabsTrigger>
        <TabsTrigger value='security'>
          <Icons.lock />
          Security
        </TabsTrigger>
      </TabsList>

      <TabsContent value='profile'>
        <ProfileSettings />
      </TabsContent>

      <TabsContent value='preferences'>
        <Suspense fallback={<Skeleton className='h-96 w-full rounded-xl' />}>
          <PreferencesSettings />
        </Suspense>
      </TabsContent>

      <TabsContent value='security'>
        <AccountSecurity />
      </TabsContent>
    </Tabs>
  );
}

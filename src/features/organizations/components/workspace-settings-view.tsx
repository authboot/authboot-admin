'use client';

import { Suspense, useState } from 'react';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { useAuth } from '@/components/auth/auth-provider';
import { DangerZoneCard } from './danger-zone-card';
import { EmailTemplateSettings } from './email-template-settings';
import { GeneralSettingsCard } from './general-settings-card';
import { LoginMethodsSettings } from './login-methods-settings';
import { MaintenanceSettings } from './maintenance-settings';
import { MessageProviderSettings, useActiveProviders } from './message-provider-settings';
import { PasswordPolicyCard } from './password-policy-card';
import { VerificationCodeSettings } from './verification-code-settings';

const SETTINGS_TABS = [
  'general',
  'sign-in',
  'verification',
  'delivery',
  'templates',
  'maintenance'
] as const;

type SettingsTab = (typeof SETTINGS_TABS)[number];

/** Shown on the tabs whose settings are not wired to the backend yet. */
function PreviewNotice() {
  return (
    <div className='text-muted-foreground flex items-start gap-2 px-1 text-xs'>
      <Icons.info className='mt-0.5 size-4 shrink-0' />
      <p>
        Preview — the settings on this tab are not connected to the server yet. Changes stay in this
        browser tab until you leave the page and are not enforced.
      </p>
    </div>
  );
}

function MessageProviderSettingsSkeleton() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-44 w-full rounded-xl' />
      <Skeleton className='h-44 w-full rounded-xl' />
    </div>
  );
}

type WorkspaceSettingsViewProps = {
  orgId: number;
};

/**
 * Workspace settings, grouped by what an admin is trying to do:
 *
 * - General       — identity (name, code, logo) and ownership actions
 * - Sign-in       — which methods users can use, and the password rule
 * - Verification  — validity and resend limits of email / phone codes
 * - Delivery      — the email and SMS providers that send those codes
 * - Templates     — the subject and content of the emails users receive
 * - Maintenance   — taking the workspace offline with a notice
 *
 * The tab is kept in the URL (?tab=…) so a section can be linked to. Panels
 * stay mounted, so unsaved edits survive switching tabs.
 */
export function WorkspaceSettingsView({ orgId }: WorkspaceSettingsViewProps) {
  const { organizations } = useAuth();
  const organizationName =
    organizations.find((organization) => organization.id === orgId)?.name ?? 'this workspace';

  const [tab, setTab] = useQueryState(
    'tab',
    parseAsStringLiteral(SETTINGS_TABS).withDefault('general')
  );

  // Shared across tabs: the maintenance banner sits above them, and the
  // verification tab shows which provider sends each channel's codes.
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const activeProviders = useActiveProviders(orgId);

  return (
    <div className='max-w-3xl space-y-4'>
      {maintenanceEnabled && tab !== 'maintenance' && (
        <Alert className='border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'>
          <Icons.maintenance />
          <AlertTitle>{organizationName} is under maintenance</AlertTitle>
          <AlertDescription className='text-amber-800 dark:text-amber-300'>
            Users cannot sign in or sign up until maintenance mode is turned off.
          </AlertDescription>
          <AlertAction>
            <Button
              type='button'
              variant='outline'
              size='xs'
              onClick={() => void setTab('maintenance')}
            >
              Manage
            </Button>
          </AlertAction>
        </Alert>
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => void setTab(value as SettingsTab)}
        className='gap-4'
      >
        {/* Scrolls sideways on narrow screens instead of wrapping. */}
        <div className='-mx-1 overflow-x-auto px-1 pb-1'>
          <TabsList>
            <TabsTrigger value='general'>
              <Icons.settings />
              General
            </TabsTrigger>
            <TabsTrigger value='sign-in'>
              <Icons.login />
              Sign-in
            </TabsTrigger>
            <TabsTrigger value='verification'>
              <Icons.shieldCheck />
              Verification
            </TabsTrigger>
            <TabsTrigger value='delivery'>
              <Icons.send />
              Delivery
            </TabsTrigger>
            <TabsTrigger value='templates'>
              <Icons.mail />
              Templates
            </TabsTrigger>
            <TabsTrigger value='maintenance'>
              <Icons.maintenance />
              Maintenance
              {maintenanceEnabled && (
                <span className='size-1.5 rounded-full bg-amber-500'>
                  <span className='sr-only'>(on)</span>
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='general' keepMounted className='space-y-4'>
          <GeneralSettingsCard orgId={orgId} />
          <DangerZoneCard orgId={orgId} />
        </TabsContent>

        <TabsContent value='sign-in' keepMounted className='space-y-4'>
          <LoginMethodsSettings />
          <PasswordPolicyCard />
          <PreviewNotice />
        </TabsContent>

        <TabsContent value='verification' keepMounted className='space-y-4'>
          <VerificationCodeSettings
            activeProviders={activeProviders}
            onManageDelivery={() => void setTab('delivery')}
          />
          <PreviewNotice />
        </TabsContent>

        <TabsContent value='delivery' keepMounted className='space-y-4'>
          <Suspense fallback={<MessageProviderSettingsSkeleton />}>
            <MessageProviderSettings orgId={orgId} />
          </Suspense>
        </TabsContent>

        <TabsContent value='templates' keepMounted className='space-y-4'>
          <EmailTemplateSettings onManageDelivery={() => void setTab('delivery')} />
          <PreviewNotice />
        </TabsContent>

        <TabsContent value='maintenance' keepMounted className='space-y-4'>
          <MaintenanceSettings
            organizationName={organizationName}
            enabled={maintenanceEnabled}
            onEnabledChange={setMaintenanceEnabled}
          />
          <PreviewNotice />
        </TabsContent>
      </Tabs>
    </div>
  );
}

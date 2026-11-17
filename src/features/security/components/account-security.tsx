'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import {
  DevicesSessions,
  DevicesSessionsSkeleton
} from '@/features/account/components/devices-sessions';
import { AuditLogTable, LoginLogTable, SecurityTableSkeleton } from './security-tables';

/**
 * Personal security tab for /dashboard/settings: current sessions & devices,
 * plus the signed-in account's own login history and security log.
 */
export function AccountSecurity() {
  return (
    <Tabs defaultValue='devices' className='gap-4'>
      <TabsList variant='line'>
        <TabsTrigger value='devices'>
          <Icons.laptop />
          Devices &amp; sessions
        </TabsTrigger>
        <TabsTrigger value='login'>
          <Icons.login />
          Login history
        </TabsTrigger>
        <TabsTrigger value='audit'>
          <Icons.forms />
          Security log
        </TabsTrigger>
      </TabsList>

      <TabsContent value='devices'>
        <Suspense fallback={<DevicesSessionsSkeleton />}>
          <DevicesSessions />
        </Suspense>
      </TabsContent>

      <TabsContent value='login'>
        <Suspense fallback={<SecurityTableSkeleton />}>
          <LoginLogTable scope='user' />
        </Suspense>
      </TabsContent>

      <TabsContent value='audit'>
        <Suspense fallback={<SecurityTableSkeleton />}>
          <AuditLogTable scope='user' />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { AuditLogTable, LoginLogTable, SecurityTableSkeleton } from './security-tables';

/**
 * Workspace security center: app users' sign-in attempts and the admin audit
 * log of the active organization. (Per-user sessions live on the user detail
 * page; there is no organization-wide session list.)
 */
export function SecurityCenter() {
  return (
    <Tabs defaultValue='login' className='gap-4'>
      <TabsList variant='line'>
        <TabsTrigger value='login'>
          <Icons.login />
          User sign-ins
        </TabsTrigger>
        <TabsTrigger value='audit'>
          <Icons.forms />
          Audit logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value='login'>
        <Suspense fallback={<SecurityTableSkeleton />}>
          <LoginLogTable scope='admin' />
        </Suspense>
      </TabsContent>

      <TabsContent value='audit'>
        <Suspense fallback={<SecurityTableSkeleton />}>
          <AuditLogTable scope='admin' />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}

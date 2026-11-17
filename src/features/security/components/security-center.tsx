'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import {
  AuditLogTable,
  DeviceTable,
  LoginLogTable,
  SecurityTableSkeleton,
  SessionTable
} from './security-tables';

/**
 * Admin security center: the four platform-wide tables
 * (sessions, devices, login logs, audit logs) behind tabs.
 */
export function SecurityCenter() {
  return (
    <Tabs defaultValue='sessions' className='gap-4'>
      <TabsList variant='line'>
        <TabsTrigger value='sessions'>
          <Icons.laptop />
          Sessions
        </TabsTrigger>
        <TabsTrigger value='devices'>
          <Icons.phone />
          Devices
        </TabsTrigger>
        <TabsTrigger value='login'>
          <Icons.login />
          Login logs
        </TabsTrigger>
        <TabsTrigger value='audit'>
          <Icons.forms />
          Audit logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value='sessions'>
        <Suspense fallback={<SecurityTableSkeleton />}>
          <SessionTable scope='admin' />
        </Suspense>
      </TabsContent>

      <TabsContent value='devices'>
        <Suspense fallback={<SecurityTableSkeleton />}>
          <DeviceTable scope='admin' />
        </Suspense>
      </TabsContent>

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

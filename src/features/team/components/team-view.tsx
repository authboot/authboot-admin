'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Icons, type Icon } from '@/components/icons';
import { useAuth } from '@/components/auth/auth-provider';
import { teamInvitationsOptions, teamMembersOptions } from '../api/queries';
import { MembersTable } from './members-table';
import { InvitationsTable } from './invitations-table';

const TABS = ['members', 'invitations'] as const;
type Tab = (typeof TABS)[number];

function StatCard({
  icon: StatIcon,
  label,
  value,
  hint
}: {
  icon: Icon;
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <Card size='sm'>
      <CardContent className='flex items-center gap-3 px-3'>
        <div className='bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg'>
          <StatIcon className='text-muted-foreground size-5' />
        </div>
        <div className='min-w-0'>
          <p className='text-xl leading-tight font-semibold'>{value}</p>
          <p className='text-muted-foreground truncate text-xs'>{label}</p>
          <p className='text-muted-foreground truncate text-[11px]'>{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Workspace team: joined admins and email invitations, each in its own
 * server-paginated table. Only the active tab is mounted, since both tables
 * share the `page` / `perPage` URL parameters.
 */
export function TeamView() {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId ?? 0;

  const [params, setParams] = useQueryStates({
    tab: parseAsStringLiteral(TABS).withDefault('members'),
    page: parseAsInteger,
    perPage: parseAsInteger,
    member: parseAsString,
    role: parseAsString,
    mfa: parseAsString,
    email: parseAsString,
    status: parseAsString
  });

  // Totals for the stat cards: one tiny request per list, independent of the
  // table filters so the numbers do not change while searching.
  const membersTotal = useQuery({
    ...teamMembersOptions(orgId, { page: 1, limit: 1 }),
    select: (d) => d.total
  });
  const pendingTotal = useQuery({
    ...teamInvitationsOptions(orgId, { page: 1, limit: 1, status: 1 }),
    select: (d) => d.total
  });

  function switchTab(next: Tab) {
    // Paging and filters belong to the table that set them; reset on switch.
    void setParams({
      tab: next,
      page: null,
      perPage: null,
      member: null,
      email: null,
      status: null
    });
  }

  // The DataTable body is an absolutely positioned box that fills its flex
  // parent, so every ancestor down to it must be a `flex-1` column.
  return (
    <div className='flex flex-1 flex-col gap-6'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <StatCard
          icon={Icons.teams}
          label='Workspace admins'
          value={membersTotal.data ?? '—'}
          hint='Accounts that have joined'
        />
        <StatCard
          icon={Icons.mail}
          label='Pending invitations'
          value={pendingTotal.data ?? '—'}
          hint='Awaiting acceptance'
        />
      </div>

      <Tabs
        value={params.tab}
        onValueChange={(v) => switchTab(v as Tab)}
        className='flex flex-1 flex-col gap-4'
      >
        <TabsList variant='line'>
          <TabsTrigger value='members'>
            <Icons.teams />
            Members
            {membersTotal.data !== undefined && (
              <Badge variant='secondary' className='ml-1'>
                {membersTotal.data}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='invitations'>
            <Icons.mail />
            Invitations
            {pendingTotal.data !== undefined && pendingTotal.data > 0 && (
              <Badge variant='secondary' className='ml-1'>
                {pendingTotal.data}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value='members' className='flex flex-1 flex-col'>
          <Suspense fallback={<DataTableSkeleton columnCount={7} rowCount={8} />}>
            <MembersTable />
          </Suspense>
        </TabsContent>

        <TabsContent value='invitations' className='flex flex-1 flex-col'>
          <Suspense fallback={<DataTableSkeleton columnCount={5} rowCount={5} />}>
            <InvitationsTable />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

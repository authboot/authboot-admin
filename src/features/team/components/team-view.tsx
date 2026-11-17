'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons, type Icon } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { teamMembersOptions } from '../api/queries';
import type { TeamMember, TeamMemberStatus } from '../api/types';

const STATUS_LABELS: Record<TeamMemberStatus, string> = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended'
};

function statusVariant(status: TeamMemberStatus) {
  return status === 'active' ? 'default' : status === 'invited' ? 'outline' : 'destructive';
}

function formatShortDate(value: string): string {
  return formatDate(value, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Couldn't copy ${label.toLowerCase()}`);
  }
}

function resendInvitation(member: TeamMember) {
  toast.success(`Invitation resent to ${member.email} (demo)`);
}

function StatCard({
  icon: StatIcon,
  label,
  value,
  hint
}: {
  icon: Icon;
  label: string;
  value: number;
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

export function TeamView() {
  const { data } = useSuspenseQuery(teamMembersOptions());
  const [members, setMembers] = useState<TeamMember[]>(data.members);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | TeamMemberStatus>('all');
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const needle = query.trim().toLowerCase();
  const visibleMembers = members.filter((member) => {
    const matchesQuery = !needle || `${member.name} ${member.email}`.toLowerCase().includes(needle);
    const matchesStatus = status === 'all' || member.status === status;
    return matchesQuery && matchesStatus;
  });

  const activeCount = members.filter((member) => member.status === 'active').length;
  const invitedCount = members.filter((member) => member.status === 'invited').length;
  const twoFactorCount = members.filter((member) => member.two_factor_enabled).length;

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    // Static demo: wait briefly so the modal's loading state is visible.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setMembers((previous) => previous.filter((member) => member.id !== removeTarget.id));
    setRemoving(false);
    setRemoveTarget(null);
    toast.success(`${removeTarget.name} removed (demo)`);
  };

  return (
    <div className='flex flex-col gap-4'>
      <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          icon={Icons.teams}
          label='Workspace admins'
          value={members.length}
          hint='All members have admin access'
        />
        <StatCard
          icon={Icons.check}
          label='Active'
          value={activeCount}
          hint='Signed in at least once'
        />
        <StatCard
          icon={Icons.mail}
          label='Pending invites'
          value={invitedCount}
          hint='Awaiting acceptance'
        />
        <StatCard
          icon={Icons.shieldCheck}
          label='2FA enabled'
          value={twoFactorCount}
          hint={`${members.length - twoFactorCount} without 2FA`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.teams className='size-5' />
            Team members
            <Badge variant='secondary'>{members.length}</Badge>
          </CardTitle>
          <CardDescription>
            Every member of this workspace is an Admin. This roster is a static preview — changes
            are not persisted.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='relative w-full sm:max-w-xs'>
              <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Search by name or email…'
                className='pl-8'
                aria-label='Search team members'
              />
            </div>
            <NativeSelect
              value={status}
              onChange={(event) => setStatus(event.target.value as 'all' | TeamMemberStatus)}
              aria-label='Filter by status'
              size='sm'
            >
              <NativeSelectOption value='all'>All statuses</NativeSelectOption>
              <NativeSelectOption value='active'>Active</NativeSelectOption>
              <NativeSelectOption value='invited'>Invited</NativeSelectOption>
              <NativeSelectOption value='suspended'>Suspended</NativeSelectOption>
            </NativeSelect>
          </div>

          <div className='overflow-x-auto rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 py-10 text-sm'>
                        <Icons.search className='size-6' />
                        {members.length === 0
                          ? 'No admins left in this workspace.'
                          : 'No members match your filters.'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar className='size-8 rounded-full'>
                            <AvatarImage src={member.avatar || ''} alt={member.name} />
                            <AvatarFallback className='text-xs'>
                              {member.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className='flex min-w-0 flex-col'>
                            <span className='flex items-center gap-1.5 truncate font-medium'>
                              {member.name}
                              {member.is_current_user && (
                                <Badge variant='secondary' className='h-4 px-1 text-[10px]'>
                                  You
                                </Badge>
                              )}
                            </span>
                            <a
                              href={`mailto:${member.email}`}
                              className='text-muted-foreground truncate text-xs hover:underline'
                            >
                              {member.email}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(member.status)}>
                          {STATUS_LABELS[member.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'text-xs',
                            member.two_factor_enabled ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {member.two_factor_enabled ? 'Enabled' : 'Off'}
                        </span>
                      </TableCell>
                      <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
                        {formatShortDate(member.joined_at)}
                      </TableCell>
                      <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
                        {formatShortDate(member.last_active_at)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant='ghost'
                                size='icon-sm'
                                aria-label={`Actions for ${member.name}`}
                              />
                            }
                          >
                            <Icons.ellipsis className='size-4' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => void copyToClipboard(member.email, 'Email')}
                            >
                              <Icons.mail className='mr-2 size-4' /> Copy email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={member.status !== 'invited'}
                              onClick={() => resendInvitation(member)}
                            >
                              <Icons.send className='mr-2 size-4' /> Resend invitation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant='destructive'
                              disabled={member.is_current_user}
                              onClick={() => setRemoveTarget(member)}
                            >
                              <Icons.trash className='mr-2 size-4' /> Remove admin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertModal
        isOpen={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void handleRemove()}
        loading={removing}
        title='Remove admin?'
        description={
          removeTarget
            ? `${removeTarget.name} will lose access to this workspace. This is a demo action and is not persisted.`
            : 'This action cannot be undone.'
        }
        confirmLabel='Remove admin'
      />
    </div>
  );
}

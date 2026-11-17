'use client';

import { Suspense, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons, type Icon } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { userByIdOptions } from '../api/queries';
import UserAddressList from './user-address-list';
import { UserFormSheet } from './user-form-sheet';
import { UserNotes, UserNotesSkeleton } from './user-notes';
import { UserSecurity, UserSecuritySkeleton } from './user-security';

type UserViewPageProps = {
  userId: string;
};

// Missing backend timestamps come through as the unix epoch.
function formatCellDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() < 2000) return '—';
  return formatDate(date);
}

// Backend gender enum — keep in sync with authboot-server's profile model.
const GENDER_LABELS: Record<number, string> = { 1: 'Male', 2: 'Female' };

function statusVariant(status: string) {
  return status === 'Active' ? 'default' : status === 'Inactive' ? 'secondary' : 'outline';
}

function MetaRow({
  icon: MetaIcon,
  label,
  children
}: {
  icon: Icon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className='flex items-start gap-3'>
      <MetaIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
      <div className='min-w-0'>
        <p className='text-muted-foreground text-xs'>{label}</p>
        <div className='truncate text-sm font-medium'>{children}</div>
      </div>
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='rounded-lg border p-3'>
      <p className='text-muted-foreground text-xs'>{label}</p>
      <div className='text-sm font-medium break-words'>{children}</div>
    </div>
  );
}

async function copyToClipboard(value: string | undefined, label: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Couldn't copy ${label.toLowerCase()}`);
  }
}

function PanelSkeleton() {
  return (
    <div className='bg-card space-y-3 rounded-xl p-4 ring-1 ring-foreground/10'>
      <Skeleton className='h-5 w-40' />
      <Skeleton className='h-4 w-64 max-w-full' />
      <Skeleton className='h-40 w-full rounded-lg' />
    </div>
  );
}

export default function UserViewPage({ userId }: UserViewPageProps) {
  const { data } = useSuspenseQuery(userByIdOptions(Number(userId)));
  const [editOpen, setEditOpen] = useState(false);

  if (!data?.success || !data?.user) {
    notFound();
  }

  const user = data.user;
  const fullName = `${user.first_name} ${user.last_name}`.trim() || 'Unnamed user';
  const initials = fullName.slice(0, 2).toUpperCase();
  const aboutMissing = !user.bio && !user.signature && !user.gender && !user.birthday;

  return (
    <div className='grid flex-1 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]'>
      {/* Identity summary — stretches with the taller tab panel so both
          columns reach the same bottom edge. */}
      <Card className='gap-0 overflow-hidden py-0'>
        <div className='from-primary/15 via-primary/5 h-24 bg-gradient-to-br to-transparent' />
        <CardContent className='-mt-10 space-y-4 px-4 pb-4'>
          <Avatar className='ring-background size-20 shadow-sm ring-4'>
            <AvatarImage src={user.avatar || ''} alt={fullName} />
            <AvatarFallback className='text-xl font-semibold'>{initials}</AvatarFallback>
          </Avatar>

          <div className='min-w-0 space-y-1'>
            <h2 className='truncate text-lg font-semibold'>{fullName}</h2>
            <p className='text-muted-foreground text-sm'>User #{user.id}</p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
          </div>

          {/* Quick actions */}
          <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
            <Button variant='outline' size='sm' onClick={() => setEditOpen(true)}>
              <Icons.edit className='size-3.5' />
              Edit profile
            </Button>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                render={<Button variant='outline' size='icon-sm' aria-label='More actions' />}
              >
                <Icons.ellipsis className='size-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Copy</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuItem
                  disabled={!user.email}
                  onClick={() => void copyToClipboard(user.email, 'Email')}
                >
                  <Icons.mail className='mr-2 size-4' /> Copy email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void copyToClipboard(`#${user.id}`, 'User ID')}>
                  <Icons.account className='mr-2 size-4' /> Copy user ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!user.organization_id}
                  onClick={() =>
                    void copyToClipboard(
                      user.organization_id ? `#${user.organization_id}` : undefined,
                      'Organization ID'
                    )
                  }
                >
                  <Icons.workspace className='mr-2 size-4' /> Copy organization ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuItem disabled>
                  <Icons.lock className='mr-2 size-4' /> Reset password
                  <DropdownMenuShortcut>Soon</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Icons.send className='mr-2 size-4' /> Send verification email
                  <DropdownMenuShortcut>Soon</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          <div className='space-y-3'>
            <MetaRow icon={Icons.mail} label='Email'>
              {user.email || '—'}
            </MetaRow>
            <MetaRow icon={Icons.phone} label='Phone'>
              {user.phone || '—'}
            </MetaRow>
            <MetaRow icon={Icons.workspace} label='Organization'>
              {user.organization_id ? `#${user.organization_id}` : '—'}
            </MetaRow>
            <MetaRow icon={Icons.calendar} label='Member since'>
              {formatCellDate(user.created_at)}
            </MetaRow>
            <MetaRow icon={Icons.clock} label='Last updated'>
              {formatCellDate(user.updated_at)}
            </MetaRow>
          </div>
        </CardContent>
      </Card>

      <div className='flex min-w-0 flex-col gap-6'>
        <Tabs defaultValue='profile' className='gap-4'>
          <div className='overflow-x-auto'>
            <TabsList variant='line' className='w-full justify-start'>
              <TabsTrigger value='profile'>
                <Icons.account />
                Profile
              </TabsTrigger>
              <TabsTrigger value='addresses'>
                <Icons.workspace />
                Addresses
              </TabsTrigger>
              <TabsTrigger value='security'>
                <Icons.shieldCheck />
                Security
              </TabsTrigger>
              <TabsTrigger value='notes'>
                <Icons.post />
                Notes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='profile'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Icons.account className='size-5' />
                  Profile
                </CardTitle>
                <CardDescription>
                  Contact details and account information returned by the backend.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <section className='space-y-3'>
                  <h3 className='text-sm font-medium'>Contact</h3>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <DetailItem label='Email'>
                      {user.email ? (
                        <a href={`mailto:${user.email}`} className='break-all hover:underline'>
                          {user.email}
                        </a>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </DetailItem>
                    <DetailItem label='Phone'>
                      {user.phone ? (
                        <a href={`tel:${user.phone}`} className='hover:underline'>
                          {user.phone}
                        </a>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </DetailItem>
                  </div>
                </section>

                <section className='space-y-3'>
                  <h3 className='text-sm font-medium'>Account</h3>
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    <DetailItem label='Status'>
                      <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                    </DetailItem>
                    <DetailItem label='Organization'>
                      {user.organization_id ? (
                        `#${user.organization_id}`
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </DetailItem>
                    <DetailItem label='Member since'>{formatCellDate(user.created_at)}</DetailItem>
                    <DetailItem label='Last updated'>{formatCellDate(user.updated_at)}</DetailItem>
                    <DetailItem label='User ID'>#{user.id}</DetailItem>
                  </div>
                </section>

                <section className='space-y-3'>
                  <h3 className='text-sm font-medium'>About</h3>
                  {aboutMissing ? (
                    <p className='text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm'>
                      This user has not filled in any profile details yet.
                    </p>
                  ) : (
                    <div className='space-y-4'>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        <DetailItem label='Gender'>
                          {(user.gender && GENDER_LABELS[user.gender]) || (
                            <span className='text-muted-foreground'>Not specified</span>
                          )}
                        </DetailItem>
                        <DetailItem label='Birthday'>
                          {user.birthday ? (
                            formatCellDate(user.birthday)
                          ) : (
                            <span className='text-muted-foreground'>Not specified</span>
                          )}
                        </DetailItem>
                      </div>
                      {user.bio && (
                        <div className='rounded-lg border p-3'>
                          <p className='text-muted-foreground text-xs'>Bio</p>
                          <p className='mt-1 text-sm break-words whitespace-pre-wrap'>{user.bio}</p>
                        </div>
                      )}
                      {user.signature && (
                        <div className='rounded-lg border p-3'>
                          <p className='text-muted-foreground text-xs'>Signature</p>
                          <p className='mt-1 text-sm break-words whitespace-pre-wrap'>
                            {user.signature}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='addresses'>
            <Suspense fallback={<PanelSkeleton />}>
              <UserAddressList userId={userId} />
            </Suspense>
          </TabsContent>

          <TabsContent value='security'>
            <Suspense fallback={<UserSecuritySkeleton />}>
              <UserSecurity userId={userId} />
            </Suspense>
          </TabsContent>

          <TabsContent value='notes'>
            <Suspense fallback={<UserNotesSkeleton />}>
              <UserNotes userId={Number(userId)} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>

      <UserFormSheet user={user} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

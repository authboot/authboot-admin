'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { useAuth } from '@/components/auth/auth-provider';
import { AvatarUpload } from '@/components/avatar-upload';
import { updateProfile, uploadAvatar } from '@/lib/auth-client';
import { useAppForm } from '@/lib/form';
import { formatDate } from '@/lib/format';
import type { AuthUser, Organization } from '@/lib/auth-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';

const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, { message: 'Display name is required' })
    .max(32, { message: 'Keep the display name under 32 characters' })
});

function displayNameOf(user: AuthUser): string {
  return user.nickname?.trim() || user.email || 'Unnamed';
}

function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase() || 'AD';
}

export default function ProfileViewPage() {
  const { isLoaded } = useAuth();

  return (
    <PageContainer
      isLoading={!isLoaded}
      pageTitle='Profile'
      pageDescription='Manage your personal information and how it appears across the dashboard.'
    >
      <ProfileSettings />
    </PageContainer>
  );
}

/**
 * Profile content without the page chrome — reused by the Settings page so the
 * same identity/form UI is not duplicated.
 */
export function ProfileSettings() {
  const { user, organizations, activeOrganizationId } = useAuth();
  const activeOrganization =
    organizations.find((org) => org.id === activeOrganizationId) ?? organizations[0];

  if (!user) {
    return (
      <Card className='max-w-3xl'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.account className='size-5' />
            Not signed in
          </CardTitle>
          <CardDescription>Sign in to view and edit your profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return <ProfileContent user={user} organization={activeOrganization} />;
}

function ProfileContent({ user, organization }: { user: AuthUser; organization?: Organization }) {
  const { refresh } = useAuth();
  const name = displayNameOf(user);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // The avatar is uploaded as soon as an image is picked, independently of the
  // form below. Refreshing the session updates it in the sidebar/header too.
  async function handleAvatarSelect(file: File) {
    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(file);
      if (!result.success) {
        toast.error("Couldn't update the avatar", { description: result.message });
        return;
      }
      await refresh();
      toast.success('Avatar updated');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  const form = useAppForm({
    defaultValues: { nickname: user.nickname ?? '' },
    validators: { onSubmit: profileSchema },
    onSubmit: async ({ value }) => {
      const result = await updateProfile({ nickname: value.nickname.trim() });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      await refresh();
      toast.success('Profile updated');
    }
  });

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]'>
      {/* Identity summary */}
      <Card className='h-fit gap-0 overflow-hidden py-0 lg:sticky lg:top-4'>
        <div className='from-primary/15 via-primary/5 h-24 bg-gradient-to-br to-transparent' />
        <CardContent className='-mt-10 space-y-4 px-4 pb-4'>
          <AvatarUpload
            src={user.avatar}
            name={name}
            initials={initialsOf(name)}
            isUploading={isUploadingAvatar}
            onSelect={handleAvatarSelect}
          />

          <div className='min-w-0 space-y-1'>
            <h2 className='truncate text-lg font-semibold'>{name}</h2>
            <p className='text-muted-foreground truncate text-sm'>{user.email}</p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Badge variant='secondary' className='gap-1'>
              <Icons.shieldCheck className='size-3' />
              Administrator
            </Badge>
            {organization && (
              <Badge variant='outline' className='gap-1'>
                <Icons.workspace className='size-3' />
                {organization.name}
              </Badge>
            )}
          </div>

          <Separator />

          <dl className='space-y-3 text-sm'>
            <div className='flex items-start gap-3'>
              <Icons.mail className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <div className='min-w-0'>
                <dt className='text-muted-foreground text-xs'>Email</dt>
                <dd className='truncate font-medium'>{user.email}</dd>
              </div>
            </div>
            {user.createdAt ? (
              <div className='flex items-start gap-3'>
                <Icons.calendar className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                <div>
                  <dt className='text-muted-foreground text-xs'>Member since</dt>
                  <dd className='font-medium'>{formatDate(user.createdAt * 1000)}</dd>
                </div>
              </div>
            ) : null}
            <div className='flex items-start gap-3'>
              <Icons.account className='text-muted-foreground mt-0.5 size-4 shrink-0' />
              <div>
                <dt className='text-muted-foreground text-xs'>Account ID</dt>
                <dd className='font-mono text-xs font-medium'>#{user.id}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className='space-y-6'>
        {/* Editable profile */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.account className='size-5' />
              Personal information
            </CardTitle>
            <CardDescription>
              This name is shown in the sidebar, chat and audit logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className='space-y-5'
              onSubmit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void form.handleSubmit();
              }}
            >
              <FieldGroup className='max-w-md'>
                <form.AppField
                  name='nickname'
                  children={(field) => (
                    <field.TextField
                      label='Display name'
                      description='Up to 32 characters.'
                      placeholder='Your display name'
                      required
                    />
                  )}
                />
              </FieldGroup>

              <div className='flex items-center gap-2'>
                {/* SubmitButton needs formContext, provided by form.AppForm. */}
                <form.AppForm>
                  <form.SubmitButton>Save changes</form.SubmitButton>
                </form.AppForm>
                <Button
                  type='button'
                  variant='ghost'
                  disabled={form.state.isSubmitting}
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Active workspace */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Icons.workspace className='size-5' />
              Workspace
            </CardTitle>
            <CardDescription>The workspace your account is active in right now.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {organization ? (
              <div className='flex items-center gap-3'>
                <div className='bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg'>
                  {organization.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={organization.logo}
                      alt={organization.name}
                      className='size-full object-cover'
                    />
                  ) : (
                    <Icons.workspace className='text-muted-foreground size-5' />
                  )}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium'>{organization.name}</p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {organization.code || 'Organization'}
                  </p>
                </div>
                <Badge variant='outline'>Active</Badge>
              </div>
            ) : (
              <p className='text-muted-foreground text-sm'>No workspace selected.</p>
            )}

            <Button
              variant='outline'
              size='sm'
              // Renders an <a> (next/link), so drop native button semantics.
              nativeButton={false}
              render={<Link href='/dashboard/workspaces/settings' aria-label='Manage workspace' />}
            >
              Manage workspace
              <Icons.chevronRight className='size-3.5' />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

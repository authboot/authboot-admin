'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import { useAuth } from '@/components/auth/auth-provider';
import { removeMemberMutation } from '../../api/mutations';
import type { TeamMember } from '../../api/types';

async function copyToClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success('Email copied');
  } catch {
    toast.error("Couldn't copy email");
  }
}

export function MemberCellAction({ member }: { member: TeamMember }) {
  const { activeOrganizationId } = useAuth();
  const [removeOpen, setRemoveOpen] = useState(false);
  const mutation = useMutation(removeMemberMutation);

  async function remove() {
    if (!activeOrganizationId) return;
    try {
      await mutation.mutateAsync({
        orgId: activeOrganizationId,
        membershipId: member.membership_id
      });
      toast.success(`${member.name} removed`);
      setRemoveOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Request failed');
    }
  }

  const canRemove = !member.is_current_user && member.role !== 'owner';

  return (
    <>
      <AlertModal
        isOpen={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => void remove()}
        loading={mutation.isPending}
        title='Remove admin?'
        description={`${member.name} will lose access to this workspace immediately.`}
        confirmLabel='Remove admin'
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='icon-sm' aria-label={`Actions for ${member.name}`} />
          }
        >
          <Icons.ellipsis className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void copyToClipboard(member.email)}>
            <Icons.mail className='mr-2 size-4' /> Copy email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            disabled={!canRemove}
            onClick={() => setRemoveOpen(true)}
          >
            <Icons.trash className='mr-2 size-4' /> Remove admin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

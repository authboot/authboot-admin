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
import { resendInvitationMutation, revokeInvitationMutation } from '../../api/mutations';
import type { TeamInvitation } from '../../api/types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

export function InvitationCellAction({ invitation }: { invitation: TeamInvitation }) {
  const { activeOrganizationId } = useAuth();
  const orgId = activeOrganizationId ?? 0;
  const [revokeOpen, setRevokeOpen] = useState(false);
  const resend = useMutation(resendInvitationMutation);
  const revoke = useMutation(revokeInvitationMutation);
  // Expired invitations are still `pending` server-side, so they can be re-sent.
  const actionable = invitation.status === 'pending' || invitation.status === 'expired';

  async function handleResend() {
    try {
      await resend.mutateAsync({ orgId, invitationId: invitation.invitation_id });
      toast.success(`Invitation resent to ${invitation.email}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleRevoke() {
    try {
      await revoke.mutateAsync({ orgId, invitationId: invitation.invitation_id });
      toast.success(`Invitation to ${invitation.email} revoked`);
      setRevokeOpen(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <>
      <AlertModal
        isOpen={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => void handleRevoke()}
        loading={revoke.isPending}
        title='Revoke invitation?'
        description={`${invitation.email} will no longer be able to accept this invitation.`}
        confirmLabel='Revoke'
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='icon-sm' aria-label={`Actions for ${invitation.email}`} />
          }
        >
          <Icons.ellipsis className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem
            disabled={!actionable || resend.isPending}
            onClick={() => void handleResend()}
          >
            <Icons.send className='mr-2 size-4' /> Resend invitation
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            disabled={!actionable}
            onClick={() => setRevokeOpen(true)}
          >
            <Icons.trash className='mr-2 size-4' /> Revoke invitation
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

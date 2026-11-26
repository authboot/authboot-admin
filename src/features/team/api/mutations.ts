import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  inviteAdmin,
  removeMember,
  resendInvitation,
  revokeInvitation,
  setMemberRole
} from './service';
import { teamKeys } from './queries';
import type { TeamRole } from './types';

function invalidate(orgId: number) {
  const qc = getQueryClient();
  qc.invalidateQueries({ queryKey: teamKeys.members(orgId) });
  qc.invalidateQueries({ queryKey: teamKeys.invitations(orgId) });
}

export const inviteAdminMutation = mutationOptions({
  mutationFn: ({ orgId, email }: { orgId: number; email: string }) => inviteAdmin(orgId, email),
  onSuccess: (_d, { orgId }) => invalidate(orgId)
});

export const resendInvitationMutation = mutationOptions({
  mutationFn: ({ invitationId }: { orgId: number; invitationId: number }) =>
    resendInvitation(invitationId),
  onSuccess: (_d, { orgId }) => invalidate(orgId)
});

export const revokeInvitationMutation = mutationOptions({
  mutationFn: ({ invitationId }: { orgId: number; invitationId: number }) =>
    revokeInvitation(invitationId),
  onSuccess: (_d, { orgId }) => invalidate(orgId)
});

export const removeMemberMutation = mutationOptions({
  mutationFn: ({ membershipId }: { orgId: number; membershipId: number }) =>
    removeMember(membershipId),
  onSuccess: (_d, { orgId }) => invalidate(orgId)
});

export const setMemberRoleMutation = mutationOptions({
  mutationFn: ({
    orgId,
    membershipId,
    role
  }: {
    orgId: number;
    membershipId: number;
    role: TeamRole;
  }) => setMemberRole(orgId, membershipId, role),
  onSuccess: (_d, { orgId }) => invalidate(orgId)
});

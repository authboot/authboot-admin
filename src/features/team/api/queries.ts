import { queryOptions } from '@tanstack/react-query';
import { getTeamInvitations, getTeamMembers } from './service';
import type { InvitationFilters, MemberFilters } from './types';

export const teamKeys = {
  all: ['team'] as const,
  members: (orgId: number) => [...teamKeys.all, 'members', orgId] as const,
  membersList: (orgId: number, filters: MemberFilters) =>
    [...teamKeys.members(orgId), filters] as const,
  invitations: (orgId: number) => [...teamKeys.all, 'invitations', orgId] as const,
  invitationsList: (orgId: number, filters: InvitationFilters) =>
    [...teamKeys.invitations(orgId), filters] as const
};

export const teamMembersOptions = (orgId: number, filters: MemberFilters) =>
  queryOptions({
    queryKey: teamKeys.membersList(orgId, filters),
    queryFn: () => getTeamMembers(orgId, filters)
  });

export const teamInvitationsOptions = (orgId: number, filters: InvitationFilters) =>
  queryOptions({
    queryKey: teamKeys.invitationsList(orgId, filters),
    queryFn: () => getTeamInvitations(orgId, filters)
  });

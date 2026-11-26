// ============================================================
// Team — Data Access Layer (authboot-server via BFF routes)
// ============================================================

import { apiClient } from '@/lib/api-client';
import type {
  BackendInvitation,
  BackendMembership,
  InvitationResponse,
  ListInvitationsResponse,
  ListMembersResponse,
  SimpleResponse,
  InvitationFilters,
  ListFilters,
  MemberFilters,
  TeamInvitation,
  TeamInvitationStatus,
  TeamInvitationsResponse,
  TeamMember,
  TeamMembersResponse,
  TeamRole
} from './types';

function unwrap<T extends { code: number; message: string }>(res: T): T {
  if (res.code !== 0) throw new Error(res.message || 'Request failed');
  return res;
}

function toIso(unix: number | undefined): string {
  return unix ? new Date(unix * 1000).toISOString() : '';
}

function roleOf(raw: string): TeamRole {
  return raw === 'owner' || raw === 'member' ? raw : 'admin';
}

function fromMembership(m: BackendMembership): TeamMember {
  const status = m.status === 2 ? 'active' : m.status === 3 ? 'suspended' : 'pending';
  return {
    membership_id: m.id,
    account_id: m.account_id,
    name: m.nickname || m.email || `account #${m.account_id}`,
    email: m.email ?? '',
    avatar: m.avatar || undefined,
    role: roleOf(m.role),
    status,
    is_current_user: Boolean(m.is_current_user),
    two_factor_enabled: Boolean(m.mfa_enabled),
    joined_at: toIso(m.created_at),
    last_active_at: toIso(m.last_login_at)
  };
}

const INVITATION_STATUS: Record<number, TeamInvitationStatus> = {
  1: 'pending',
  2: 'accepted',
  3: 'expired',
  4: 'revoked'
};

function fromInvitation(i: BackendInvitation): TeamInvitation {
  // The backend never flips pending → expired itself; derive it from expired_at.
  let status = INVITATION_STATUS[i.status] ?? 'pending';
  if (status === 'pending' && i.expired_at && i.expired_at * 1000 < Date.now()) status = 'expired';
  return {
    invitation_id: i.id,
    email: i.email,
    status,
    invited_at: toIso(i.created_at),
    expires_at: toIso(i.expired_at)
  };
}

function query(filters: ListFilters, extra: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams({ page: String(filters.page), page_size: String(filters.limit) });
  if (filters.search) qs.set('search', filters.search);
  for (const [k, v] of Object.entries(extra)) {
    if (v !== undefined && v !== '' && v !== 0) qs.set(k, String(v));
  }
  return qs.toString();
}

export async function getTeamMembers(
  orgId: number,
  filters: MemberFilters
): Promise<TeamMembersResponse> {
  if (!orgId) return { members: [], total: 0 };
  const res = unwrap(
    await apiClient<ListMembersResponse>(
      `/organizations/${orgId}/members?${query(filters, {
        role: filters.role,
        status: filters.status,
        mfa: filters.mfa
      })}`
    )
  );
  return {
    members: (res.members ?? []).filter((m) => m.status !== 4).map(fromMembership),
    total: res.total ?? 0
  };
}

export async function getTeamInvitations(
  orgId: number,
  filters: InvitationFilters
): Promise<TeamInvitationsResponse> {
  if (!orgId) return { invitations: [], total: 0 };
  const res = unwrap(
    await apiClient<ListInvitationsResponse>(
      `/organizations/${orgId}/invitations?${query(filters, { status: filters.status })}`
    )
  );
  return {
    invitations: (res.invitations ?? []).map(fromInvitation),
    total: res.total ?? 0
  };
}

export async function inviteAdmin(orgId: number, email: string): Promise<InvitationResponse> {
  return unwrap(
    await apiClient<InvitationResponse>(`/organizations/${orgId}/invitations`, {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  );
}

export async function resendInvitation(invitationId: number): Promise<void> {
  unwrap(
    await apiClient<InvitationResponse>(`/admin/invitations/${invitationId}/resend`, {
      method: 'POST'
    })
  );
}

export async function revokeInvitation(invitationId: number): Promise<void> {
  unwrap(
    await apiClient<SimpleResponse>(`/admin/invitations/${invitationId}`, { method: 'DELETE' })
  );
}

export async function removeMember(membershipId: number): Promise<void> {
  unwrap(
    await apiClient<SimpleResponse>(`/admin/memberships/${membershipId}`, { method: 'DELETE' })
  );
}

export async function setMemberRole(
  orgId: number,
  membershipId: number,
  role: TeamRole
): Promise<void> {
  unwrap(
    await apiClient<SimpleResponse>(`/organizations/${orgId}/members/${membershipId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })
  );
}

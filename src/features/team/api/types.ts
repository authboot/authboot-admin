// ============================================================
// Team — Type Contract
// ============================================================
// Workspace admins come from two backend tables: memberships (accounts that
// have joined) and invitations (emails that have not accepted yet). Each has
// its own server-paginated list.

export type TeamRole = 'owner' | 'admin' | 'member';

export type TeamMemberStatus = 'active' | 'suspended' | 'pending';

/** A platform account that has joined the workspace. */
export type TeamMember = {
  membership_id: number;
  account_id: number;
  name: string;
  email: string;
  avatar?: string;
  role: TeamRole;
  status: TeamMemberStatus;
  /** Renders the "You" marker and blocks self-removal. */
  is_current_user: boolean;
  two_factor_enabled: boolean;
  /** ISO */
  joined_at: string;
  /** ISO; '' when the account never signed in. */
  last_active_at: string;
};

export type TeamInvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export type TeamInvitation = {
  invitation_id: number;
  email: string;
  status: TeamInvitationStatus;
  /** ISO */
  invited_at: string;
  /** ISO */
  expires_at: string;
};

export type ListFilters = {
  page: number;
  limit: number;
  search?: string;
};

export type MemberFilters = ListFilters & {
  role?: TeamRole;
  /** Backend MembershipStatus number; omit for all. */
  status?: number;
  /** 1 = MFA enabled, 2 = disabled; omit for all. */
  mfa?: number;
};

export type InvitationFilters = ListFilters & {
  /** Backend InvitationStatus number; omit for all. */
  status?: number;
};

export type TeamMembersResponse = {
  members: TeamMember[];
  total: number;
};

export type TeamInvitationsResponse = {
  invitations: TeamInvitation[];
  total: number;
};

// ---- Backend DTOs (idl/membership.proto, idl/invitation.proto) ----

export type BackendMembership = {
  id: number;
  organization_id: number;
  account_id: number;
  status: number; // 1 pending, 2 active, 3 disabled, 4 removed
  role: string;
  created_at: number;
  updated_at: number;
  email?: string;
  nickname?: string;
  avatar?: string;
  mfa_enabled?: boolean;
  last_login_at?: number;
  is_current_user?: boolean;
};

export type ListMembersResponse = {
  code: number;
  message: string;
  members?: BackendMembership[];
  total?: number;
};

export type BackendInvitation = {
  id: number;
  organization_id: number;
  email: string;
  inviter_account_id: number;
  status: number; // 1 pending, 2 accepted, 3 expired, 4 revoked
  expired_at: number;
  created_at: number;
  updated_at: number;
};

export type ListInvitationsResponse = {
  code: number;
  message: string;
  invitations?: BackendInvitation[];
  total?: number;
};

export type InvitationResponse = {
  code: number;
  message: string;
  invitation?: BackendInvitation;
};

export type SimpleResponse = {
  code: number;
  message: string;
};

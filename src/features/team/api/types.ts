// ============================================================
// Team — Type Contract (static mock)
// ============================================================
// Workspace membership is currently all-Admin: authboot-server does not yet
// expose a membership API, so this page renders a static roster.

export type TeamMemberStatus = 'active' | 'invited' | 'suspended';

export type TeamMember = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  /** Every workspace member currently has admin access. */
  role: 'Admin';
  status: TeamMemberStatus;
  /** Renders the "You" marker and blocks self-removal. */
  is_current_user?: boolean;
  two_factor_enabled: boolean;
  joined_at: string;
  last_active_at: string;
};

export type TeamMembersResponse = {
  success: boolean;
  message: string;
  members: TeamMember[];
};

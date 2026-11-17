// ============================================================
// Team Service — static mock roster
// ============================================================
// Replace `getTeamMembers` with a BFF call once authboot-server ships the
// organization membership endpoints. The component layer only depends on the
// response shape, so the swap is contained to this file.

import type { TeamMember, TeamMembersResponse } from './types';

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 1,
    name: 'Chen Peng',
    email: 'chenpeng20@example.com',
    role: 'Admin',
    status: 'active',
    is_current_user: true,
    two_factor_enabled: true,
    joined_at: '2025-03-12T08:30:00Z',
    last_active_at: '2026-11-14T02:10:00Z'
  },
  {
    id: 2,
    name: 'Li Wei',
    email: 'liwei@example.com',
    role: 'Admin',
    status: 'active',
    two_factor_enabled: true,
    joined_at: '2025-05-04T03:15:00Z',
    last_active_at: '2026-11-13T16:42:00Z'
  },
  {
    id: 3,
    name: 'Wang Fang',
    email: 'wangfang@example.com',
    role: 'Admin',
    status: 'active',
    two_factor_enabled: false,
    joined_at: '2025-07-21T11:05:00Z',
    last_active_at: '2026-11-12T09:20:00Z'
  },
  {
    id: 4,
    name: 'Zhang Min',
    email: 'zhangmin@example.com',
    role: 'Admin',
    status: 'active',
    two_factor_enabled: true,
    joined_at: '2025-09-02T06:48:00Z',
    last_active_at: '2026-11-14T01:05:00Z'
  },
  {
    id: 5,
    name: 'Liu Yang',
    email: 'liuyang@example.com',
    role: 'Admin',
    status: 'active',
    two_factor_enabled: false,
    joined_at: '2026-01-18T13:22:00Z',
    last_active_at: '2026-11-10T07:35:00Z'
  },
  {
    id: 6,
    name: 'Zhao Lei',
    email: 'zhaolei@example.com',
    role: 'Admin',
    status: 'invited',
    two_factor_enabled: false,
    joined_at: '2026-11-11T04:00:00Z',
    last_active_at: '2026-11-11T04:00:00Z'
  },
  {
    id: 7,
    name: 'Sun Yue',
    email: 'sunyue@example.com',
    role: 'Admin',
    status: 'invited',
    two_factor_enabled: false,
    joined_at: '2026-11-13T09:30:00Z',
    last_active_at: '2026-11-13T09:30:00Z'
  },
  {
    id: 8,
    name: 'Zhou Hao',
    email: 'zhouhao@example.com',
    role: 'Admin',
    status: 'suspended',
    two_factor_enabled: true,
    joined_at: '2025-11-27T02:10:00Z',
    last_active_at: '2026-09-30T15:55:00Z'
  }
];

export async function getTeamMembers(): Promise<TeamMembersResponse> {
  return {
    success: true,
    message: 'Static mock roster (no membership API yet)',
    members: TEAM_MEMBERS.map((member) => ({ ...member }))
  };
}

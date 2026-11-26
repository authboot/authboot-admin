// ============================================================
// Account — Type Contract
// ============================================================
// Admin sessions come from /api/v1/admin/accounts/:id/sessions (redis-backed:
// only live sessions are listed, revoked ones disappear).

/** One admin session (idl/session.proto AdminSession). Timestamps are ISO, '' if unset. */
export type SessionDevice = {
  id: string;
  device_name: string;
  device_id: string;
  current_organization_id: number;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
  expires_at: string;
  last_active_at: string;
  /** The session issuing the current request. */
  current: boolean;
};

export type SessionsResponse = {
  sessions: SessionDevice[];
  total: number;
};

// Backend DTOs
export type BackendAdminSession = {
  session_id?: string;
  account_id?: number;
  current_organization_id?: number;
  device_id?: string;
  device_name?: string;
  status?: number;
  created_at?: number;
  expires_at?: number;
  last_active_at?: number;
  current?: boolean;
};

export type ListAdminSessionsResponse = {
  code: number;
  message: string;
  sessions?: BackendAdminSession[];
  total?: number;
};

export type SimpleResponse = {
  code: number;
  message: string;
};

// ---- Admin preferences ----
// The backend stores a flat string map per admin (admin.proto MySettings).
// Keys and parsing live in `@/lib/preferences`.
export type MySettingsResponse = {
  code: number;
  message: string;
  settings: Record<string, string>;
};

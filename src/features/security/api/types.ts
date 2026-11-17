// ============================================================
// Security — Type Contract
// ============================================================
// One record shape per table family. `scope` selects which backend tables
// feed the UI:
//   admin → tb_admin_login_logs / tb_admin_audit_logs / tb_admin_sessions / tb_admin_devices
//   user  → tb_user_login_logs  / tb_user_audit_logs  / tb_user_sessions  / tb_user_devices
// The admin views keep an `account` field; user views omit it because the
// records already belong to the signed-in account.

export type SecurityScope = 'admin' | 'user';

export type LoginLogRecord = {
  id: string;
  /** Actor — admin views only. */
  account?: string;
  ip: string;
  location: string;
  device: string;
  browser: string;
  status: 'success' | 'failed';
  /** Failure reason or extra context ("Invalid password", "New device"). */
  detail: string;
  created_at: string;
};

export type AuditLogRecord = {
  id: string;
  /** Actor — admin views only. */
  account?: string;
  action: string;
  resource: string;
  result: 'success' | 'failed';
  ip: string;
  created_at: string;
};

export type SessionRecord = {
  id: string;
  /** Session owner — admin views only. */
  account?: string;
  device: string;
  ip: string;
  location: string;
  status: 'active' | 'revoked';
  /** The session issuing the current request. */
  current?: boolean;
  last_active_at: string;
};

export type DeviceRecord = {
  id: string;
  /** Device owner — admin views only. */
  account?: string;
  name: string;
  os: string;
  browser: string;
  ip: string;
  trusted: boolean;
  last_seen_at: string;
};

/** Per-user security bundle shown on the admin user detail page. */
export type AccountSecurityOverview = {
  sessions: SessionRecord[];
  loginLogs: LoginLogRecord[];
  auditLogs: AuditLogRecord[];
};

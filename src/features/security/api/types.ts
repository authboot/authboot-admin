// ============================================================
// Security — Type Contract
// ============================================================
// Record shapes consumed by the tables, plus the backend DTOs they are mapped
// from. `scope` selects the data source:
//   admin → organization-wide: app users' sign-in attempts and admins' audit log
//   user  → the signed-in admin's own sign-in history and audit entries
// Admin-scope records carry an `account` label; user-scope ones omit it.

export type SecurityScope = 'admin' | 'user';

/** Who is asking; drives which backend endpoint and filters are used. */
export type SecurityContext = {
  /** Active organization; 0 when none is selected. */
  orgId: number;
  /** Signed-in admin account id. */
  adminId: number;
};

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

// ---- Backend DTOs (idl/audit.proto, idl/admin.proto) ----

export type BackendAuditLog = {
  id: number;
  admin_id: number;
  organization_id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  method: string;
  path: string;
  ip: string;
  user_agent: string;
  success: boolean;
  status_code: number;
  err_msg: string;
  created_at: number;
};

export type ListAuditLogsResponse = {
  code: number;
  message: string;
  logs: BackendAuditLog[];
  total: number;
};

export type BackendUserLoginLog = {
  id: number;
  user_id: number;
  identity_type: string;
  identity_value: string;
  device_id: string;
  device_name: string;
  ip: string;
  user_agent: string;
  success: boolean;
  err_msg: string;
  created_at: number;
};

export type ListUserLoginLogsResponse = {
  code: number;
  message: string;
  logs: BackendUserLoginLog[];
  total: number;
};

export type BackendAdminLoginLog = {
  id: number;
  email: string;
  device_id: string;
  device_name: string;
  ip: string;
  user_agent: string;
  success: boolean;
  err_msg: string;
  created_at: number;
};

export type ListMyLoginLogsResponse = {
  code: number;
  message: string;
  logs: BackendAdminLoginLog[];
  total: number;
};

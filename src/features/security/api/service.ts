// ============================================================
// Security — Data Access Layer (authboot-server via BFF routes)
// ============================================================
// admin scope: organization-wide tables — app users' sign-in attempts
//   (/organizations/:id/user-login-logs) and admins' audit log
//   (/organizations/:id/audit-logs).
// user scope: the signed-in admin's own history — /auth/me/login-logs and the
//   audit log filtered to admin_id.
// Lists are capped at the newest PAGE_SIZE rows; the tables filter client-side.

import { apiClient } from '@/lib/api-client';
import type {
  AuditLogRecord,
  BackendAdminLoginLog,
  BackendAuditLog,
  BackendUserLoginLog,
  ListAuditLogsResponse,
  ListMyLoginLogsResponse,
  ListUserLoginLogsResponse,
  LoginLogRecord,
  SecurityContext,
  SecurityScope
} from './types';

const PAGE_SIZE = 100;

function unwrap<T extends { code: number; message: string }>(res: T): T {
  if (res.code !== 0) throw new Error(res.message || 'Request failed');
  return res;
}

function toIso(unix: number): string {
  return unix ? new Date(unix * 1000).toISOString() : '';
}

/** Rough browser label from a user agent ("Chrome 131", "Safari 18", ...). */
export function browserLabel(ua: string): string {
  if (!ua) return '';
  const m =
    /(Edg|Edge|OPR|Opera|Chrome|Firefox|Safari)\/(\d+)/.exec(ua) ??
    /(Edg|Edge|OPR|Opera|Chrome|Firefox|Safari)[ /](\d+)/.exec(ua);
  if (!m) return ua.split(' ')[0].slice(0, 32);
  const name = m[1] === 'Edg' ? 'Edge' : m[1] === 'OPR' ? 'Opera' : m[1];
  return `${name} ${m[2]}`;
}

function fromUserLoginLog(r: BackendUserLoginLog): LoginLogRecord {
  return {
    id: String(r.id),
    account: r.identity_value || `user #${r.user_id}`,
    ip: r.ip,
    location: '',
    device: r.device_name || r.device_id || '',
    browser: browserLabel(r.user_agent),
    status: r.success ? 'success' : 'failed',
    detail: r.success ? r.identity_type : r.err_msg || r.identity_type,
    created_at: toIso(r.created_at)
  };
}

function fromAdminLoginLog(r: BackendAdminLoginLog): LoginLogRecord {
  return {
    id: String(r.id),
    ip: r.ip,
    location: '',
    device: r.device_name || r.device_id || '',
    browser: browserLabel(r.user_agent),
    status: r.success ? 'success' : 'failed',
    detail: r.success ? '' : r.err_msg,
    created_at: toIso(r.created_at)
  };
}

function fromAuditLog(r: BackendAuditLog, withActor: boolean): AuditLogRecord {
  const resource = r.resource_type
    ? r.resource_id
      ? `${r.resource_type} #${r.resource_id}`
      : r.resource_type
    : r.path;
  return {
    id: String(r.id),
    ...(withActor ? { account: `admin #${r.admin_id}` } : {}),
    action: r.action || `${r.method} ${r.path}`,
    resource,
    result: r.success ? 'success' : 'failed',
    ip: r.ip,
    created_at: toIso(r.created_at)
  };
}

export async function getLoginLogs(
  scope: SecurityScope,
  ctx: SecurityContext
): Promise<LoginLogRecord[]> {
  if (scope === 'user') {
    const res = unwrap(
      await apiClient<ListMyLoginLogsResponse>(`/auth/me/login-logs?page_size=${PAGE_SIZE}`)
    );
    return (res.logs ?? []).map(fromAdminLoginLog);
  }
  if (!ctx.orgId) return [];
  const res = unwrap(
    await apiClient<ListUserLoginLogsResponse>(
      `/organizations/${ctx.orgId}/user-login-logs?page_size=${PAGE_SIZE}`
    )
  );
  return (res.logs ?? []).map(fromUserLoginLog);
}

export async function getAuditLogs(
  scope: SecurityScope,
  ctx: SecurityContext
): Promise<AuditLogRecord[]> {
  if (!ctx.orgId) return [];
  const qs = new URLSearchParams({ page_size: String(PAGE_SIZE) });
  if (scope === 'user' && ctx.adminId) qs.set('admin_id', String(ctx.adminId));
  const res = unwrap(
    await apiClient<ListAuditLogsResponse>(`/organizations/${ctx.orgId}/audit-logs?${qs}`)
  );
  return (res.logs ?? []).map((r) => fromAuditLog(r, scope === 'admin'));
}

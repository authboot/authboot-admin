// ============================================================
// Account — Data Access Layer (authboot-server via BFF routes)
// ============================================================

import { apiClient } from '@/lib/api-client';
import type {
  BackendAdminSession,
  ListAdminSessionsResponse,
  MySettingsResponse,
  SessionDevice,
  SessionsResponse,
  SimpleResponse
} from './types';

function unwrap<T extends { code: number; message: string }>(res: T): T {
  if (res.code !== 0) throw new Error(res.message || 'Request failed');
  return res;
}

function toIso(unix: number | undefined): string {
  return unix ? new Date(unix * 1000).toISOString() : '';
}

function sessionStatus(code: number | undefined): SessionDevice['status'] {
  if (code === 2) return 'revoked';
  if (code === 3) return 'expired';
  return 'active';
}

function toSessionDevice(raw: BackendAdminSession): SessionDevice {
  return {
    id: raw.session_id ?? '',
    device_name: raw.device_name || raw.device_id || 'Unknown device',
    device_id: raw.device_id ?? '',
    current_organization_id: raw.current_organization_id ?? 0,
    status: sessionStatus(raw.status),
    created_at: toIso(raw.created_at),
    expires_at: toIso(raw.expires_at),
    last_active_at: toIso(raw.last_active_at),
    current: Boolean(raw.current)
  };
}

// ---- Admin sessions ----

export async function getSessions(accountId: number): Promise<SessionsResponse> {
  const res = unwrap(
    await apiClient<ListAdminSessionsResponse>(
      `/admin/accounts/${accountId}/sessions?page_size=100`
    )
  );
  return {
    sessions: (res.sessions ?? []).map(toSessionDevice),
    total: res.total ?? 0
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  unwrap(
    await apiClient<SimpleResponse>(`/admin/sessions/${encodeURIComponent(sessionId)}/revoke`, {
      method: 'POST'
    })
  );
}

export async function revokeAllSessions(accountId: number): Promise<void> {
  unwrap(
    await apiClient<SimpleResponse>(`/admin/accounts/${accountId}/sessions/revoke-all`, {
      method: 'POST'
    })
  );
}

// ---- Admin preferences ----

export async function getMySettings(): Promise<MySettingsResponse> {
  return unwrap(await apiClient<MySettingsResponse>('/auth/me/settings'));
}

/** Whole-map replace; merge over the current map before calling. */
export async function updateMySettings(
  settings: Record<string, string>
): Promise<MySettingsResponse> {
  return unwrap(
    await apiClient<MySettingsResponse>('/auth/me/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings })
    })
  );
}

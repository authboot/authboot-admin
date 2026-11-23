// ============================================================
// authboot-server User → dashboard User mapping (server-only)
// ============================================================
// The backend org-user model exposes {id, organization_id, nickname,
// avatar, status, created_at, updated_at}. Some deployments also return
// email/phone (or first/last name) — those are passed through when
// present so the users table can render richer rows.

import type {
  User,
  UserAddress,
  UserLoginLog,
  UserSession,
  UserSessionStatus
} from '@/features/users/api/types';

// Backend common.Status values (pkg/constants): 1 = enabled, 2 = disabled.
const STATUS_ENABLED = 1;

export function backendStatusToLabel(status: number | undefined): string {
  return status === STATUS_ENABLED ? 'Active' : 'Inactive';
}

export function toIsoString(unixSeconds: number | undefined): string {
  if (!unixSeconds) return new Date(0).toISOString();
  return new Date(unixSeconds * 1000).toISOString();
}

export interface BackendUser {
  id?: number;
  organization_id?: number;
  nickname?: string;
  avatar?: string;
  // Optional richer fields — only present on some backend builds.
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  // Profile fields returned by newer authboot-server builds.
  gender?: number;
  birthday?: string;
  bio?: string;
  background_image?: string;
  signature?: string;
  status?: number;
  created_at?: number;
  updated_at?: number;
}

export function normalizeUser(raw: BackendUser): User {
  // Backends that only expose `nickname` still get a usable name split.
  const nickname = raw.nickname?.trim() ?? '';
  const [nicknameFirst, ...nicknameRest] = nickname.split(/\s+/).filter(Boolean);

  return {
    id: raw.id ?? 0,
    first_name: raw.first_name ?? nicknameFirst ?? '',
    last_name: raw.last_name ?? nicknameRest.join(' '),
    email: raw.email ?? '',
    phone: raw.phone ?? '',
    status: backendStatusToLabel(raw.status),
    created_at: toIsoString(raw.created_at),
    updated_at: toIsoString(raw.updated_at),
    avatar: raw.avatar ?? '',
    organization_id: raw.organization_id,
    // Profile extras — optional on the dashboard User type.
    gender: raw.gender,
    birthday: raw.birthday ?? '',
    bio: raw.bio ?? '',
    background_image: raw.background_image ?? '',
    signature: raw.signature ?? ''
  };
}

export function normalizeUsers(raw: BackendUser[] | undefined): User[] {
  return (raw ?? []).map(normalizeUser);
}

// Backend UserAddress (idl/address.proto) — timestamps are unix seconds.
export interface BackendUserAddress {
  id?: number;
  receiver_name?: string;
  receiver_phone?: string;
  province?: string;
  city?: string;
  district?: string;
  detail?: string;
  is_default?: boolean;
  created_at?: number;
  updated_at?: number;
}

export function normalizeUserAddress(raw: BackendUserAddress): UserAddress {
  return {
    id: raw.id ?? 0,
    receiver_name: raw.receiver_name ?? '',
    receiver_phone: raw.receiver_phone ?? '',
    province: raw.province ?? '',
    city: raw.city ?? '',
    district: raw.district ?? '',
    detail: raw.detail ?? '',
    is_default: Boolean(raw.is_default),
    created_at: raw.created_at ? toIsoString(raw.created_at) : '',
    updated_at: raw.updated_at ? toIsoString(raw.updated_at) : ''
  };
}

export function normalizeUserAddresses(raw: BackendUserAddress[] | undefined): UserAddress[] {
  return (raw ?? []).map(normalizeUserAddress);
}

// Backend IPLocation (idl/session.proto) — approximate region of an IP.
export interface BackendIPLocation {
  country?: string;
  region?: string;
  city?: string;
  display?: string;
}

function locationLabel(raw: BackendIPLocation | undefined): string {
  if (!raw) return '';
  return raw.display || [raw.country, raw.region, raw.city].filter(Boolean).join(' ');
}

// Backend Session (idl/session.proto) — timestamps are unix seconds, status
// is the SessionStatus enum number.
export interface BackendSession {
  session_id?: string;
  client_id?: number;
  device_id?: string;
  device_name?: string;
  status?: number;
  created_at?: number;
  expires_at?: number;
  last_active_at?: number;
  ip?: string;
  location?: BackendIPLocation;
  last_active_ip?: string;
  last_active_location?: BackendIPLocation;
  user_agent?: string;
}

const SESSION_STATUS_LABELS: Record<number, UserSessionStatus> = {
  1: 'active',
  2: 'revoked',
  3: 'expired'
};

export function normalizeUserSession(raw: BackendSession): UserSession {
  return {
    session_id: raw.session_id ?? '',
    client_id: raw.client_id ?? 0,
    device_id: raw.device_id ?? '',
    device_name: raw.device_name ?? '',
    user_agent: raw.user_agent ?? '',
    status: SESSION_STATUS_LABELS[raw.status ?? 0] ?? 'unknown',
    ip: raw.ip ?? '',
    location: locationLabel(raw.location),
    last_active_ip: raw.last_active_ip ?? '',
    last_active_location: locationLabel(raw.last_active_location),
    created_at: raw.created_at ? toIsoString(raw.created_at) : '',
    last_active_at: raw.last_active_at ? toIsoString(raw.last_active_at) : '',
    expires_at: raw.expires_at ? toIsoString(raw.expires_at) : ''
  };
}

export function normalizeUserSessions(raw: BackendSession[] | undefined): UserSession[] {
  return (raw ?? []).map(normalizeUserSession);
}

// Backend UserLoginLog (idl/audit.proto) — created_at is unix seconds.
export interface BackendUserLoginLog {
  id?: number;
  identity_type?: string;
  identity_value?: string;
  client_id?: number;
  device_id?: string;
  device_name?: string;
  ip?: string;
  user_agent?: string;
  success?: boolean;
  err_msg?: string;
  created_at?: number;
}

export function normalizeUserLoginLog(raw: BackendUserLoginLog): UserLoginLog {
  return {
    id: raw.id ?? 0,
    identity_type: raw.identity_type ?? '',
    identity_value: raw.identity_value ?? '',
    client_id: raw.client_id ?? 0,
    device_id: raw.device_id ?? '',
    device_name: raw.device_name ?? '',
    ip: raw.ip ?? '',
    user_agent: raw.user_agent ?? '',
    success: Boolean(raw.success),
    err_msg: raw.err_msg ?? '',
    created_at: raw.created_at ? toIsoString(raw.created_at) : ''
  };
}

export function normalizeUserLoginLogs(raw: BackendUserLoginLog[] | undefined): UserLoginLog[] {
  return (raw ?? []).map(normalizeUserLoginLog);
}

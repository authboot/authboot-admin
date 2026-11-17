// ============================================================
// authboot-server User → dashboard User mapping (server-only)
// ============================================================
// The backend org-user model exposes {id, organization_id, nickname,
// avatar, status, created_at, updated_at}. Some deployments also return
// email/phone (or first/last name) — those are passed through when
// present so the users table can render richer rows.

import type { User, UserAddress } from '@/features/users/api/types';

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

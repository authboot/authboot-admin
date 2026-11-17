// ============================================================
// Security — Data Access Layer (static mock)
// ============================================================
// The auth service does not expose the security tables yet, so these return
// fake rows. Replace each function body with an `apiClient` call when the
// endpoints ship; the query layer and components stay unchanged.

import type {
  AccountSecurityOverview,
  AuditLogRecord,
  DeviceRecord,
  LoginLogRecord,
  SecurityScope,
  SessionRecord
} from './types';

// Fixed timestamps keep server/client renders identical.

const ADMIN_LOGIN_LOGS: LoginLogRecord[] = [
  {
    id: 'al-1',
    account: 'chenpeng',
    ip: '10.99.64.82',
    location: 'Hangzhou, CN',
    device: 'MacBook Pro',
    browser: 'Chrome 131',
    status: 'success',
    detail: 'Password + verification code',
    created_at: '2026-11-12T09:42:00Z'
  },
  {
    id: 'al-2',
    account: 'li.wei',
    ip: '10.99.65.12',
    location: 'Shanghai, CN',
    device: 'Office Desktop',
    browser: 'Edge 131',
    status: 'failed',
    detail: 'Invalid password (2 attempts)',
    created_at: '2026-11-12T08:15:00Z'
  },
  {
    id: 'al-3',
    account: 'wang.fang',
    ip: '10.99.64.90',
    location: 'Hangzhou, CN',
    device: 'iPhone 15',
    browser: 'Safari 18',
    status: 'success',
    detail: 'New device verified by email',
    created_at: '2026-11-12T07:03:00Z'
  },
  {
    id: 'al-4',
    account: 'chenpeng',
    ip: '10.99.64.82',
    location: 'Hangzhou, CN',
    device: 'MacBook Pro',
    browser: 'Chrome 131',
    status: 'success',
    detail: 'Token refreshed',
    created_at: '2026-11-11T18:20:00Z'
  },
  {
    id: 'al-5',
    account: 'zhao.min',
    ip: '10.99.70.31',
    location: 'Beijing, CN',
    device: 'ThinkPad X1',
    browser: 'Firefox 133',
    status: 'failed',
    detail: 'Account temporarily locked',
    created_at: '2026-11-11T11:48:00Z'
  }
];

const ADMIN_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'aa-1',
    account: 'chenpeng',
    action: 'Updated workspace settings',
    resource: 'workspace:acme',
    result: 'success',
    ip: '10.99.64.82',
    created_at: '2026-11-12T09:55:00Z'
  },
  {
    id: 'aa-2',
    account: 'chenpeng',
    action: 'Enabled third-party sign-in',
    resource: 'workspace:acme/login-methods',
    result: 'success',
    ip: '10.99.64.82',
    created_at: '2026-11-12T09:50:00Z'
  },
  {
    id: 'aa-3',
    account: 'li.wei',
    action: 'Invited member',
    resource: 'organization:acme/member:wang.fang',
    result: 'success',
    ip: '10.99.65.12',
    created_at: '2026-11-12T08:30:00Z'
  },
  {
    id: 'aa-4',
    account: 'li.wei',
    action: 'Deleted API key',
    resource: 'organization:acme/apikey:svc-reporting',
    result: 'failed',
    ip: '10.99.65.12',
    created_at: '2026-11-11T16:12:00Z'
  },
  {
    id: 'aa-5',
    account: 'wang.fang',
    action: 'Updated display name',
    resource: 'account:wang.fang',
    result: 'success',
    ip: '10.99.64.90',
    created_at: '2026-11-11T10:05:00Z'
  }
];

const ADMIN_SESSIONS: SessionRecord[] = [
  {
    id: 'as-1',
    account: 'chenpeng',
    device: 'MacBook Pro',
    ip: '10.99.64.82',
    location: 'Hangzhou, CN',
    status: 'active',
    current: true,
    last_active_at: '2026-11-12T09:42:00Z'
  },
  {
    id: 'as-2',
    account: 'li.wei',
    device: 'Office Desktop',
    ip: '10.99.65.12',
    location: 'Shanghai, CN',
    status: 'active',
    last_active_at: '2026-11-12T08:15:00Z'
  },
  {
    id: 'as-3',
    account: 'wang.fang',
    device: 'iPhone 15',
    ip: '10.99.64.90',
    location: 'Hangzhou, CN',
    status: 'active',
    last_active_at: '2026-11-12T07:03:00Z'
  },
  {
    id: 'as-4',
    account: 'zhao.min',
    device: 'ThinkPad X1',
    ip: '10.99.70.31',
    location: 'Beijing, CN',
    status: 'revoked',
    last_active_at: '2026-11-10T09:20:00Z'
  }
];

const ADMIN_DEVICES: DeviceRecord[] = [
  {
    id: 'ad-1',
    account: 'chenpeng',
    name: 'MacBook Pro',
    os: 'macOS 14.6',
    browser: 'Chrome 131',
    ip: '10.99.64.82',
    trusted: true,
    last_seen_at: '2026-11-12T09:42:00Z'
  },
  {
    id: 'ad-2',
    account: 'li.wei',
    name: 'Office Desktop',
    os: 'Windows 11',
    browser: 'Edge 131',
    ip: '10.99.65.12',
    trusted: true,
    last_seen_at: '2026-11-12T08:15:00Z'
  },
  {
    id: 'ad-3',
    account: 'wang.fang',
    name: 'iPhone 15',
    os: 'iOS 18.1',
    browser: 'Safari 18',
    ip: '10.99.64.90',
    trusted: false,
    last_seen_at: '2026-11-12T07:03:00Z'
  },
  {
    id: 'ad-4',
    account: 'zhao.min',
    name: 'ThinkPad X1',
    os: 'Windows 11',
    browser: 'Firefox 133',
    ip: '10.99.70.31',
    trusted: false,
    last_seen_at: '2026-11-10T09:20:00Z'
  }
];

// User scope mirrors the same shapes without the `account` column.
const USER_LOGIN_LOGS: LoginLogRecord[] = [
  {
    id: 'ul-1',
    ip: '10.99.64.82',
    location: 'Hangzhou, CN',
    device: 'MacBook Pro',
    browser: 'Chrome 131',
    status: 'success',
    detail: 'Password + verification code',
    created_at: '2026-11-12T09:42:00Z'
  },
  {
    id: 'ul-2',
    ip: '10.99.64.90',
    location: 'Hangzhou, CN',
    device: 'iPhone 15',
    browser: 'Safari 18',
    status: 'failed',
    detail: 'Invalid verification code',
    created_at: '2026-11-11T21:12:00Z'
  },
  {
    id: 'ul-3',
    ip: '10.99.64.82',
    location: 'Hangzhou, CN',
    device: 'MacBook Pro',
    browser: 'Chrome 131',
    status: 'success',
    detail: 'Token refreshed',
    created_at: '2026-11-11T18:20:00Z'
  }
];

const USER_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'ua-1',
    action: 'Updated display name',
    resource: 'account:self',
    result: 'success',
    ip: '10.99.64.82',
    created_at: '2026-11-12T09:47:00Z'
  },
  {
    id: 'ua-2',
    action: 'Changed password',
    resource: 'account:self',
    result: 'success',
    ip: '10.99.64.82',
    created_at: '2026-11-10T15:40:00Z'
  },
  {
    id: 'ua-3',
    action: 'Connected third-party account',
    resource: 'oauth:wechat',
    result: 'failed',
    ip: '10.99.64.90',
    created_at: '2026-11-09T11:08:00Z'
  }
];

const USER_SESSIONS: SessionRecord[] = [
  {
    id: 'us-1',
    device: 'MacBook Pro',
    ip: '10.99.64.82',
    location: 'Hangzhou, CN',
    status: 'active',
    current: true,
    last_active_at: '2026-11-12T09:42:00Z'
  },
  {
    id: 'us-2',
    device: 'iPhone 15',
    ip: '10.99.64.90',
    location: 'Hangzhou, CN',
    status: 'active',
    last_active_at: '2026-11-11T21:12:00Z'
  }
];

const USER_DEVICES: DeviceRecord[] = [
  {
    id: 'ud-1',
    name: 'MacBook Pro',
    os: 'macOS 14.6',
    browser: 'Chrome 131',
    ip: '10.99.64.82',
    trusted: true,
    last_seen_at: '2026-11-12T09:42:00Z'
  },
  {
    id: 'ud-2',
    name: 'iPhone 15',
    os: 'iOS 18.1',
    browser: 'Safari 18',
    ip: '10.99.64.90',
    trusted: true,
    last_seen_at: '2026-11-11T21:12:00Z'
  }
];

export async function getLoginLogs(scope: SecurityScope): Promise<LoginLogRecord[]> {
  return scope === 'admin' ? ADMIN_LOGIN_LOGS : USER_LOGIN_LOGS;
}

export async function getAuditLogs(scope: SecurityScope): Promise<AuditLogRecord[]> {
  return scope === 'admin' ? ADMIN_AUDIT_LOGS : USER_AUDIT_LOGS;
}

export async function getSessions(scope: SecurityScope): Promise<SessionRecord[]> {
  return scope === 'admin' ? ADMIN_SESSIONS : USER_SESSIONS;
}

export async function getDevices(scope: SecurityScope): Promise<DeviceRecord[]> {
  return scope === 'admin' ? ADMIN_DEVICES : USER_DEVICES;
}

// Admin-side per-user security preview. The backend has no per-user security
// endpoint yet, so every user id gets the same static sample bundle.
export async function getAccountSecurity(): Promise<AccountSecurityOverview> {
  return {
    sessions: USER_SESSIONS,
    loginLogs: USER_LOGIN_LOGS,
    auditLogs: USER_AUDIT_LOGS
  };
}

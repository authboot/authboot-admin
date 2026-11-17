import { queryOptions } from '@tanstack/react-query';
import { getAccountSecurity, getAuditLogs, getDevices, getLoginLogs, getSessions } from './service';
import type { SecurityScope } from './types';

export const securityKeys = {
  all: ['security'] as const,
  loginLogs: (scope: SecurityScope) => [...securityKeys.all, 'login-logs', scope] as const,
  auditLogs: (scope: SecurityScope) => [...securityKeys.all, 'audit-logs', scope] as const,
  sessions: (scope: SecurityScope) => [...securityKeys.all, 'sessions', scope] as const,
  devices: (scope: SecurityScope) => [...securityKeys.all, 'devices', scope] as const,
  account: (userId: string) => [...securityKeys.all, 'account', userId] as const
};

export const loginLogsQueryOptions = (scope: SecurityScope) =>
  queryOptions({
    queryKey: securityKeys.loginLogs(scope),
    queryFn: () => getLoginLogs(scope)
  });

export const auditLogsQueryOptions = (scope: SecurityScope) =>
  queryOptions({
    queryKey: securityKeys.auditLogs(scope),
    queryFn: () => getAuditLogs(scope)
  });

export const sessionsQueryOptions = (scope: SecurityScope) =>
  queryOptions({
    queryKey: securityKeys.sessions(scope),
    queryFn: () => getSessions(scope)
  });

export const devicesQueryOptions = (scope: SecurityScope) =>
  queryOptions({
    queryKey: securityKeys.devices(scope),
    queryFn: () => getDevices(scope)
  });

/** Sessions + login history + security log for one user (admin view). */
export const accountSecurityQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: securityKeys.account(userId),
    queryFn: getAccountSecurity
  });

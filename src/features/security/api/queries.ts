import { queryOptions } from '@tanstack/react-query';
import { getAuditLogs, getLoginLogs } from './service';
import type { SecurityContext, SecurityScope } from './types';

export const securityKeys = {
  all: ['security'] as const,
  loginLogs: (scope: SecurityScope, ctx: SecurityContext) =>
    [...securityKeys.all, 'login-logs', scope, ctx.orgId, ctx.adminId] as const,
  auditLogs: (scope: SecurityScope, ctx: SecurityContext) =>
    [...securityKeys.all, 'audit-logs', scope, ctx.orgId, ctx.adminId] as const
};

export const loginLogsQueryOptions = (scope: SecurityScope, ctx: SecurityContext) =>
  queryOptions({
    queryKey: securityKeys.loginLogs(scope, ctx),
    queryFn: () => getLoginLogs(scope, ctx)
  });

export const auditLogsQueryOptions = (scope: SecurityScope, ctx: SecurityContext) =>
  queryOptions({
    queryKey: securityKeys.auditLogs(scope, ctx),
    queryFn: () => getAuditLogs(scope, ctx)
  });

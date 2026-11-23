import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import {
  getUsers,
  getUserById,
  getUserAddresses,
  getUserNotes,
  getUserSessions,
  getUserLoginLogs
} from './service';
import type { User, UserFilters, UserLoginLogFilters } from './types';

export type { User };

export const USER_LOGIN_LOGS_PAGE_SIZE = 10;

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  addresses: (id: number) => [...userKeys.all, 'addresses', id] as const,
  notes: (id: number) => [...userKeys.all, 'notes', id] as const,
  sessions: (id: number) => [...userKeys.all, 'sessions', id] as const,
  loginLogs: (id: number, filters: UserLoginLogFilters) =>
    [...userKeys.all, 'login-logs', id, filters] as const
};

export const usersQueryOptions = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters)
  });

export const userByIdOptions = (id: number) =>
  queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id)
  });

export const userAddressesOptions = (id: number) =>
  queryOptions({
    queryKey: userKeys.addresses(id),
    queryFn: () => getUserAddresses(id)
  });

export const userNotesOptions = (id: number) =>
  queryOptions({
    queryKey: userKeys.notes(id),
    queryFn: () => getUserNotes(id)
  });

export const userSessionsOptions = (id: number) =>
  queryOptions({
    queryKey: userKeys.sessions(id),
    queryFn: () => getUserSessions(id)
  });

export const userLoginLogsOptions = (id: number, page = 1) => {
  const filters = { page, limit: USER_LOGIN_LOGS_PAGE_SIZE };
  return queryOptions({
    queryKey: userKeys.loginLogs(id, filters),
    queryFn: () => getUserLoginLogs(id, filters),
    placeholderData: keepPreviousData
  });
};

import { queryOptions } from '@tanstack/react-query';
import { getMySettings, getSessions } from './service';

export const sessionKeys = {
  all: ['account', 'sessions'] as const,
  list: (accountId: number) => [...sessionKeys.all, accountId] as const
};

export const sessionsQueryOptions = (accountId: number) =>
  queryOptions({
    queryKey: sessionKeys.list(accountId),
    queryFn: () => getSessions(accountId)
  });

export const preferenceKeys = {
  all: ['account', 'preferences'] as const
};

export const preferencesQueryOptions = () =>
  queryOptions({
    queryKey: preferenceKeys.all,
    queryFn: getMySettings,
    staleTime: 5 * 60 * 1000
  });

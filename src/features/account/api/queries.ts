import { queryOptions } from '@tanstack/react-query';
import { getSessions } from './service';

export const sessionKeys = {
  all: ['account', 'sessions'] as const
};

export const sessionsQueryOptions = () =>
  queryOptions({
    queryKey: sessionKeys.all,
    queryFn: getSessions
  });

import { queryOptions } from '@tanstack/react-query';
import { getTeamMembers } from './service';

export const teamKeys = {
  all: ['team'] as const,
  members: () => [...teamKeys.all, 'members'] as const
};

export const teamMembersOptions = () =>
  queryOptions({
    queryKey: teamKeys.members(),
    queryFn: getTeamMembers
  });

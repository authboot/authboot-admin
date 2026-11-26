import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { revokeAllSessions, revokeSession, updateMySettings } from './service';
import { preferenceKeys, sessionKeys } from './queries';

export const updateMySettingsMutation = mutationOptions({
  mutationFn: (settings: Record<string, string>) => updateMySettings(settings),
  onSuccess: (data) => {
    // The response is the saved map; seed the cache so dependent UI updates at once.
    getQueryClient().setQueryData(preferenceKeys.all, data);
  }
});

// ---- Admin sessions ----

export const revokeSessionMutation = mutationOptions({
  mutationFn: ({ sessionId }: { sessionId: string; accountId: number }) => revokeSession(sessionId),
  onSuccess: (_data, { accountId }) => {
    getQueryClient().invalidateQueries({ queryKey: sessionKeys.list(accountId) });
  }
});

/** Revokes the given sessions one by one so the current one can be kept. */
export const revokeSessionsMutation = mutationOptions({
  mutationFn: async ({ sessionIds }: { sessionIds: string[]; accountId: number }) => {
    for (const id of sessionIds) await revokeSession(id);
  },
  onSuccess: (_data, { accountId }) => {
    getQueryClient().invalidateQueries({ queryKey: sessionKeys.list(accountId) });
  }
});

export const revokeAllSessionsMutation = mutationOptions({
  mutationFn: ({ accountId }: { accountId: number }) => revokeAllSessions(accountId),
  onSuccess: (_data, { accountId }) => {
    getQueryClient().invalidateQueries({ queryKey: sessionKeys.list(accountId) });
  }
});

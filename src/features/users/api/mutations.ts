import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createUser,
  updateUser,
  uploadUserAvatar,
  deleteUser,
  updateUserAddress,
  createUserNote,
  deleteUserNote
} from './service';
import { userKeys } from './queries';
import type { UserAddress, UserMutationPayload, UserNotePayload } from './types';

export const createUserMutation = mutationOptions({
  mutationFn: (data: UserMutationPayload) => createUser(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const updateUserMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UserMutationPayload }) =>
    updateUser(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const uploadUserAvatarMutation = mutationOptions({
  mutationFn: ({ id, file }: { id: number; file: File }) => uploadUserAvatar(id, file),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const deleteUserMutation = mutationOptions({
  mutationFn: (id: number) => deleteUser(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.all });
  }
});

export const updateUserAddressMutation = mutationOptions({
  mutationFn: ({ id, address }: { id: number; address: UserAddress }) =>
    updateUserAddress(id, address),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.addresses(id) });
  }
});

// Notes update the cached list from the mutation response instead of
// invalidating: the dev-only store lives in the browser bundle, so a refetch
// would hit a fresh server-side copy and drop the just-added note.
export const createUserNoteMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UserNotePayload }) =>
    createUserNote(id, values),
  onSuccess: (data, { id }) => {
    getQueryClient().setQueryData(userKeys.notes(id), data);
  }
});

export const deleteUserNoteMutation = mutationOptions({
  mutationFn: ({ id, noteId }: { id: number; noteId: number }) => deleteUserNote(id, noteId),
  onSuccess: (data, { id }) => {
    getQueryClient().setQueryData(userKeys.notes(id), data);
  }
});

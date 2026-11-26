import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createUser,
  updateUser,
  uploadUserAvatar,
  deleteUser,
  createUserAddress,
  updateUserAddress,
  deleteUserAddress,
  setDefaultUserAddress
} from './service';
import { userKeys } from './queries';
import type { UserAddressPayload, UserMutationPayload } from './types';

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

// ---- Addresses ----

export const createUserAddressMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UserAddressPayload }) =>
    createUserAddress(id, values),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.addresses(id) });
  }
});

export const updateUserAddressMutation = mutationOptions({
  mutationFn: ({
    id,
    addressId,
    values
  }: {
    id: number;
    addressId: number;
    values: UserAddressPayload;
  }) => updateUserAddress(id, addressId, values),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.addresses(id) });
  }
});

export const deleteUserAddressMutation = mutationOptions({
  mutationFn: ({ id, addressId }: { id: number; addressId: number }) =>
    deleteUserAddress(id, addressId),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.addresses(id) });
  }
});

export const setDefaultUserAddressMutation = mutationOptions({
  mutationFn: ({ id, addressId }: { id: number; addressId: number }) =>
    setDefaultUserAddress(id, addressId),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: userKeys.addresses(id) });
  }
});

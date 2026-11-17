// ============================================================
// Dev-only in-memory user store (server side)
// ============================================================
// authboot-server has no admin "create user" endpoint yet. In development the
// BFF routes keep dashboard-created rows here so the list, detail, edit and
// delete flows stay coherent. Never used in production.
//
// The store lives on `globalThis` so every route bundle in the dev server
// shares the same instance.

import type { User, UserMutationPayload } from '@/features/users/api/types';

type DevUserStore = {
  users: User[];
  nextId: number;
};

const globalStore = globalThis as typeof globalThis & {
  authbootDevUsers?: DevUserStore;
};

function store(): DevUserStore {
  globalStore.authbootDevUsers ??= { users: [], nextId: 900001 };
  return globalStore.authbootDevUsers;
}

export function devUsersEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function listDevUsers(): User[] {
  return store().users.map((user) => ({ ...user }));
}

export function findDevUser(id: number): User | undefined {
  const user = store().users.find((item) => item.id === id);
  return user ? { ...user } : undefined;
}

export function addDevUser(data: UserMutationPayload): User {
  const now = new Date().toISOString();
  const user: User = {
    id: store().nextId++,
    ...data,
    created_at: now,
    updated_at: now
  };
  store().users = [user, ...store().users];
  return { ...user };
}

export function updateDevUser(id: number, data: UserMutationPayload): User | undefined {
  const target = store();
  const index = target.users.findIndex((user) => user.id === id);
  if (index === -1) return undefined;

  target.users[index] = {
    ...target.users[index],
    ...data,
    updated_at: new Date().toISOString()
  };
  return { ...target.users[index] };
}

export function removeDevUser(id: number): boolean {
  const target = store();
  const previousLength = target.users.length;
  target.users = target.users.filter((user) => user.id !== id);
  return target.users.length !== previousLength;
}

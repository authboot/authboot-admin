// ============================================================
// User Service — Data Access Layer (BFF → authboot-server)
// ============================================================
// All calls go through the /api/users BFF routes, which proxy to
// authboot-server's admin organization-user API using the signed-in
// admin's token + active organization.

import { apiClient } from '@/lib/api-client';
import type {
  UserFilters,
  UsersResponse,
  UserByIdResponse,
  UserAddressesResponse,
  UserAddressResponse,
  UserAddressPayload,
  UserSessionsResponse,
  UserLoginLogFilters,
  UserLoginLogsResponse,
  UserMutationPayload
} from './types';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const query = new URLSearchParams();
  if (filters.page) query.set('page', String(filters.page));
  if (filters.limit) query.set('limit', String(filters.limit));
  if (filters.search) query.set('search', filters.search);
  if (filters.user_name) query.set('user_name', filters.user_name);
  if (filters.email) query.set('email', filters.email);
  if (filters.phone) query.set('phone', filters.phone);
  if (filters.status) query.set('status', String(filters.status));
  if (filters.sort) query.set('sort', filters.sort);

  const qs = query.toString();
  return apiClient<UsersResponse>(`/users${qs ? `?${qs}` : ''}`);
}

export async function getUserById(id: number): Promise<UserByIdResponse> {
  return apiClient<UserByIdResponse>(`/users/${id}`);
}

// ---- Addresses (real backend via /api/users/:id/addresses) ----
// The BFF answers HTTP 200 with `success: false` + message for backend
// business failures (e.g. the 10-address limit); surface those as errors so
// the mutation's onError shows the reason.

function ensureSuccess<T extends { success: boolean; message: string }>(res: T): T {
  if (!res.success) throw new Error(res.message || 'Request failed');
  return res;
}

export async function getUserAddresses(id: number): Promise<UserAddressesResponse> {
  // Listing keeps `success: false` in the payload (not thrown) so the tab can
  // render the message in its empty state.
  return apiClient<UserAddressesResponse>(`/users/${id}/addresses`);
}

export async function createUserAddress(
  id: number,
  payload: UserAddressPayload
): Promise<UserAddressResponse> {
  return ensureSuccess(
    await apiClient<UserAddressResponse>(`/users/${id}/addresses`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  );
}

export async function updateUserAddress(
  id: number,
  addressId: number,
  payload: UserAddressPayload
): Promise<UserAddressResponse> {
  return ensureSuccess(
    await apiClient<UserAddressResponse>(`/users/${id}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  );
}

export async function deleteUserAddress(id: number, addressId: number): Promise<void> {
  ensureSuccess(
    await apiClient<UserAddressesResponse>(`/users/${id}/addresses/${addressId}`, {
      method: 'DELETE'
    })
  );
}

export async function setDefaultUserAddress(id: number, addressId: number): Promise<void> {
  ensureSuccess(
    await apiClient<UserAddressesResponse>(`/users/${id}/addresses/${addressId}/default`, {
      method: 'PUT'
    })
  );
}

export async function getUserSessions(id: number): Promise<UserSessionsResponse> {
  return apiClient<UserSessionsResponse>(`/users/${id}/sessions`);
}

export async function getUserLoginLogs(
  id: number,
  filters: UserLoginLogFilters = {}
): Promise<UserLoginLogsResponse> {
  const query = new URLSearchParams();
  if (filters.page) query.set('page', String(filters.page));
  if (filters.limit) query.set('limit', String(filters.limit));

  const qs = query.toString();
  return apiClient<UserLoginLogsResponse>(`/users/${id}/login-logs${qs ? `?${qs}` : ''}`);
}

export async function createUser(data: UserMutationPayload): Promise<UserByIdResponse> {
  return apiClient<UserByIdResponse>(`/users`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateUser(id: number, data: UserMutationPayload) {
  return apiClient(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// Avatar upload is multipart/form-data — bypass apiClient so the browser sets
// the multipart boundary itself (never set Content-Type manually here).
// The BFF forwards the file part named `avatar` to authboot-server.
export async function uploadUserAvatar(id: number, file: File): Promise<UserByIdResponse> {
  const form = new FormData();
  form.append('avatar', file);

  const res = await fetch(`/api/users/${id}/avatar`, {
    method: 'POST',
    body: form
  });

  const body = (await res.json().catch(() => null)) as UserByIdResponse | null;
  if (!res.ok || !body?.success) {
    throw new Error(body?.message || `API error: ${res.status} ${res.statusText}`);
  }

  return body;
}

export async function deleteUser(id: number) {
  return apiClient(`/users/${id}`, {
    method: 'DELETE'
  });
}

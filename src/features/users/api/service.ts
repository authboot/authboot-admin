// ============================================================
// User Service — Data Access Layer (BFF → authboot-server)
// ============================================================
// All calls go through the /api/users BFF routes, which proxy to
// authboot-server's admin organization-user API using the signed-in
// admin's token + active organization.

import { apiClient } from '@/lib/api-client';
import type {
  UserAddress,
  UserFilters,
  UsersResponse,
  UserByIdResponse,
  UserAddressesResponse,
  UserSessionsResponse,
  UserLoginLogFilters,
  UserLoginLogsResponse,
  UserMutationPayload,
  UserNote,
  UserNotesResponse,
  UserNotePayload
} from './types';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const query = new URLSearchParams();
  if (filters.page) query.set('page', String(filters.page));
  if (filters.limit) query.set('limit', String(filters.limit));
  if (filters.search) query.set('search', filters.search);
  if (filters.sort) query.set('sort', filters.sort);

  const qs = query.toString();
  return apiClient<UsersResponse>(`/users${qs ? `?${qs}` : ''}`);
}

export async function getUserById(id: number): Promise<UserByIdResponse> {
  return apiClient<UserByIdResponse>(`/users/${id}`);
}

// Development-only samples so the Addresses tab has something to render before
// authboot-server returns address records. Never used in production.
const MOCK_USER_ADDRESSES: UserAddress[] = [
  {
    id: 1001,
    receiver_name: 'Chen Peng',
    receiver_phone: '138 0000 1234',
    province: 'Zhejiang',
    city: 'Hangzhou',
    district: 'Xihu',
    detail: 'Room 1203, Building 5, 88 Wensan Road',
    is_default: true,
    created_at: '2026-10-18T09:20:00Z',
    updated_at: '2026-11-02T14:05:00Z'
  },
  {
    id: 1002,
    receiver_name: 'Li Wei',
    receiver_phone: '139 0000 5678',
    province: 'Shanghai',
    city: 'Shanghai',
    district: 'Pudong New Area',
    detail: 'Floor 21, Tower B, 1000 Century Avenue',
    is_default: false,
    created_at: '2026-09-27T03:12:00Z',
    updated_at: '2026-10-30T08:41:00Z'
  },
  {
    id: 1003,
    receiver_name: 'Wang Fang',
    receiver_phone: '137 0000 9900',
    province: 'Beijing',
    city: 'Beijing',
    district: 'Chaoyang',
    detail: 'Unit 802, Building 3, 66 Jiuxianqiao Road',
    is_default: false,
    created_at: '2026-08-05T11:30:00Z',
    updated_at: '2026-09-14T10:18:00Z'
  }
];

// Dev-only in-memory copy so edits made in the UI survive remounts during a
// session. Reset on a full page reload / server restart.
let mockUserAddresses: UserAddress[] = MOCK_USER_ADDRESSES.map((address) => ({ ...address }));

export async function getUserAddresses(id: number): Promise<UserAddressesResponse> {
  let response: UserAddressesResponse | null = null;

  try {
    response = await apiClient<UserAddressesResponse>(`/users/${id}/addresses`);
  } catch (error) {
    // In production a failed request should surface, not silently turn into mock data.
    if (process.env.NODE_ENV === 'production') throw error;
  }

  if (response?.addresses?.length) return response;
  if (response && process.env.NODE_ENV === 'production') return response;

  return {
    success: true,
    message: 'Mock addresses (development only)',
    addresses: mockUserAddresses.map((address) => ({ ...address }))
  };
}

export async function updateUserAddress(
  id: number,
  address: UserAddress
): Promise<UserAddressesResponse> {
  if (process.env.NODE_ENV === 'production') {
    return apiClient<UserAddressesResponse>(`/users/${id}/addresses/${address.id}`, {
      method: 'PUT',
      body: JSON.stringify(address)
    });
  }

  // Development: patch the in-memory store instead of calling the backend.
  mockUserAddresses = mockUserAddresses.map((item) =>
    item.id === address.id ? { ...item, ...address, updated_at: new Date().toISOString() } : item
  );

  return {
    success: true,
    message: 'Address updated (development only)',
    addresses: mockUserAddresses.map((item) => ({ ...item }))
  };
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

export async function deleteUser(id: number) {
  return apiClient(`/users/${id}`, {
    method: 'DELETE'
  });
}

// ---------------------------------------------------------------------------
// Admin notes (dev-only sample data)
// ---------------------------------------------------------------------------
// There is no notes endpoint on authboot-server yet, so development uses an
// in-memory store. Production hits the REST paths once the backend ships them.

const MOCK_USER_NOTES: UserNote[] = [
  {
    id: 2001,
    user_id: 1,
    author: 'Admin',
    body: 'Follow-up scheduled: the user is reviewing the new workspace invite and will confirm migration timing this week.',
    created_at: '2026-11-06T09:15:00Z'
  },
  {
    id: 2002,
    user_id: 1,
    author: 'Admin',
    body: 'Verified the billing contact by phone on 2026-10-29. No further action needed.',
    created_at: '2026-10-29T03:40:00Z'
  }
];

let mockUserNotes: UserNote[] = MOCK_USER_NOTES.map((note) => ({ ...note }));
let nextUserNoteId = 2003;

function readMockNotes(id: number): UserNotesResponse {
  return {
    success: true,
    message: 'Mock notes (development only)',
    notes: mockUserNotes
      .filter((note) => note.user_id === id)
      .toSorted((a, b) => b.created_at.localeCompare(a.created_at))
      .map((note) => ({ ...note }))
  };
}

export async function getUserNotes(id: number): Promise<UserNotesResponse> {
  if (process.env.NODE_ENV === 'production') {
    return apiClient<UserNotesResponse>(`/users/${id}/notes`);
  }
  return readMockNotes(id);
}

export async function createUserNote(
  id: number,
  payload: UserNotePayload
): Promise<UserNotesResponse> {
  if (process.env.NODE_ENV === 'production') {
    return apiClient<UserNotesResponse>(`/users/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  mockUserNotes = [
    {
      id: nextUserNoteId++,
      user_id: id,
      author: payload.author?.trim() || 'Admin',
      body: payload.body.trim(),
      created_at: new Date().toISOString()
    },
    ...mockUserNotes
  ];

  return readMockNotes(id);
}

export async function deleteUserNote(id: number, noteId: number): Promise<UserNotesResponse> {
  if (process.env.NODE_ENV === 'production') {
    return apiClient<UserNotesResponse>(`/users/${id}/notes/${noteId}`, {
      method: 'DELETE'
    });
  }

  mockUserNotes = mockUserNotes.filter((note) => note.id !== noteId);
  return readMockNotes(id);
}

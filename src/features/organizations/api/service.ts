// ============================================================
// Organizations Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
// Queries (queries.ts) and components import from here — they never change.
//
// Pattern: BFF — these functions call the Next.js route handlers under
// /api/organizations, which proxy to `${BACKEND_URL}/api/v1/admin/organizations`.
// ============================================================

import { apiClient } from '@/lib/api-client';
import type {
  OrganizationFilters,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  OrganizationResponse,
  ListOrganizationsResponse,
  DeleteOrganizationResponse,
  UploadOrganizationLogoResponse,
  LeaveOrganizationResponse,
  ListOAuthConfigsResponse,
  OAuthConfigResponse,
  OAuthConfigPayload,
  DeleteOAuthConfigResponse,
  MessageChannelId,
  ListMessageProviderCatalogResponse,
  ListMessageProviderConfigsResponse,
  SetMessageProviderPayload,
  SetMessageProviderResponse,
  SetMessageProviderPriorityPayload,
  SetMessageProviderPriorityResponse,
  DeleteMessageProviderResponse
} from './types';

function buildQuery(filters: OrganizationFilters): string {
  const params = new URLSearchParams();
  if (filters.page != null) params.set('page', String(filters.page));
  if (filters.page_size != null) params.set('page_size', String(filters.page_size));
  if (filters.search) params.set('search', filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function getOrganizations(
  filters: OrganizationFilters
): Promise<ListOrganizationsResponse> {
  return apiClient<ListOrganizationsResponse>(`/organizations${buildQuery(filters)}`);
}

export async function getOrganizationById(id: number): Promise<OrganizationResponse> {
  return apiClient<OrganizationResponse>(`/organizations/${id}`);
}

export async function createOrganization(
  data: CreateOrganizationPayload
): Promise<OrganizationResponse> {
  return apiClient<OrganizationResponse>('/organizations', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateOrganization(
  id: number,
  data: UpdateOrganizationPayload
): Promise<OrganizationResponse> {
  return apiClient<OrganizationResponse>(`/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteOrganization(id: number): Promise<DeleteOrganizationResponse> {
  return apiClient<DeleteOrganizationResponse>(`/organizations/${id}`, {
    method: 'DELETE'
  });
}

export async function leaveOrganization(id: number): Promise<LeaveOrganizationResponse> {
  return apiClient<LeaveOrganizationResponse>(`/organizations/${id}/leave`, {
    method: 'POST'
  });
}

// ---- Login methods (per-organization OAuth provider configs) ----

export async function getOAuthConfigs(id: number): Promise<ListOAuthConfigsResponse> {
  return apiClient<ListOAuthConfigsResponse>(`/organizations/${id}/oauth`);
}

export async function setOAuthConfig(
  id: number,
  provider: string,
  data: OAuthConfigPayload
): Promise<OAuthConfigResponse> {
  return apiClient<OAuthConfigResponse>(
    `/organizations/${id}/oauth/${encodeURIComponent(provider)}`,
    {
      method: 'PUT',
      body: JSON.stringify(data)
    }
  );
}

export async function deleteOAuthConfig(
  id: number,
  provider: string
): Promise<DeleteOAuthConfigResponse> {
  return apiClient<DeleteOAuthConfigResponse>(
    `/organizations/${id}/oauth/${encodeURIComponent(provider)}`,
    { method: 'DELETE' }
  );
}

// ---- Message delivery providers ----
// The backend answers business failures (e.g. the vendor rejected the
// credentials) with HTTP 200 and a non-zero `code`; surface those as errors so
// callers see the vendor's message instead of a half-saved state.

function unwrap<T extends { code: number; message: string }>(res: T): T {
  if (res.code !== 0) {
    throw new Error(res.message || 'Request failed');
  }
  return res;
}

export async function getMessageProviderCatalog(
  channel?: MessageChannelId
): Promise<ListMessageProviderCatalogResponse> {
  const qs = channel ? `?channel=${encodeURIComponent(channel)}` : '';
  return unwrap(await apiClient<ListMessageProviderCatalogResponse>(`/message-providers${qs}`));
}

export async function getMessageProviderConfigs(
  id: number
): Promise<ListMessageProviderConfigsResponse> {
  return unwrap(
    await apiClient<ListMessageProviderConfigsResponse>(`/organizations/${id}/message-providers`)
  );
}

export async function setMessageProvider(
  id: number,
  channel: MessageChannelId,
  provider: string,
  data: SetMessageProviderPayload
): Promise<SetMessageProviderResponse> {
  return unwrap(
    await apiClient<SetMessageProviderResponse>(
      `/organizations/${id}/message-providers/${channel}/${encodeURIComponent(provider)}`,
      { method: 'PUT', body: JSON.stringify(data) }
    )
  );
}

export async function setMessageProviderPriority(
  id: number,
  channel: MessageChannelId,
  data: SetMessageProviderPriorityPayload
): Promise<SetMessageProviderPriorityResponse> {
  return unwrap(
    await apiClient<SetMessageProviderPriorityResponse>(
      `/organizations/${id}/message-providers/${channel}/priority`,
      { method: 'PUT', body: JSON.stringify(data) }
    )
  );
}

export async function deleteMessageProvider(
  id: number,
  channel: MessageChannelId,
  provider: string
): Promise<DeleteMessageProviderResponse> {
  return unwrap(
    await apiClient<DeleteMessageProviderResponse>(
      `/organizations/${id}/message-providers/${channel}/${encodeURIComponent(provider)}`,
      { method: 'DELETE' }
    )
  );
}

// Logo upload is multipart/form-data — bypass apiClient so the browser sets
// the multipart boundary itself (never set Content-Type manually here).
// The backend handler reads the file via c.FormFile('logo').
export async function uploadOrganizationLogo(
  id: number,
  file: File
): Promise<UploadOrganizationLogoResponse> {
  const form = new FormData();
  form.append('logo', file);

  const res = await fetch(`/api/organizations/${id}/logo`, {
    method: 'POST',
    body: form
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<UploadOrganizationLogoResponse>;
}

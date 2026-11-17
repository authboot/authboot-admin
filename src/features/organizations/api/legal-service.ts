// ============================================================
// Legal documents — backend-backed service (BFF → authboot-server)
// ============================================================
// The BFF routes under /api/legal-docs map the dashboard doc type (terms /
// privacy) to the backend canonical names and forward the admin token +
// active org. See src/app/api/legal-docs/*.

import { apiClient } from '@/lib/api-client';
import type {
  LegalPublishInput,
  LegalPublishResponse,
  LegalPublicResponse,
  LegalVersionResponse,
  LegalVersionsResponse,
  LegalDocType
} from '../constants/legal-documents';

// Publish a new immutable version. effectiveAt is an ISO string; the BFF
// converts it to unix seconds (0 / past = active now, future = scheduled).
export async function publishLegalVersion(
  docType: LegalDocType,
  input: LegalPublishInput
): Promise<LegalPublishResponse> {
  return apiClient<LegalPublishResponse>(`/legal-docs/${docType}/publish`, {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

// Full immutable version history, newest first (no content payloads).
export async function listLegalVersions(docType: LegalDocType): Promise<LegalVersionsResponse> {
  return apiClient<LegalVersionsResponse>(`/legal-docs/${docType}/versions`);
}

// One exact version including its archived snapshot content.
export async function getLegalVersion(
  docType: LegalDocType,
  version: number
): Promise<LegalVersionResponse> {
  return apiClient<LegalVersionResponse>(`/legal-docs/${docType}/version?version=${version}`);
}

// Current effective version (public read). A matching clientVersion answers
// { unchanged: true } without the payload; includeContent=false returns
// metadata only (url/hash) for link rendering.
export async function getPublicLegalDoc(
  docType: LegalDocType,
  options?: { version?: number; includeContent?: boolean; orgId?: number }
): Promise<LegalPublicResponse> {
  const query = new URLSearchParams();
  if (options?.version) query.set('version', String(options.version));
  query.set('include_content', options?.includeContent === false ? 'false' : 'true');
  if (options?.orgId) query.set('org_id', String(options.orgId));
  const qs = query.toString();
  return apiClient<LegalPublicResponse>(`/legal-docs/public/${docType}${qs ? `?${qs}` : ''}`);
}

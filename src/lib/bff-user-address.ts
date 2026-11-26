// ============================================================
// BFF helper — admin user address endpoints
// ============================================================
// Shared by the /api/users/:id/addresses route handlers. Resolves the active
// organization from the cookie, forwards to
// {BACKEND_URL}/api/v1/admin/organizations/:orgId/users/:userId/addresses...
// and normalizes the response to the frontend address shape. Backend business
// failures (HTTP 200, code != 0) are reported as `success: false` with the
// backend message so the UI can show the reason.

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';
import { normalizeUserAddress, normalizeUserAddresses } from '@/lib/user-mapper';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export async function proxyUserAddress(
  userId: string,
  subpath: string,
  method: Method,
  body?: unknown
): Promise<NextResponse> {
  const token = await getAccessToken();
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);

  if (!token || !orgId) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated / no org', addresses: [] },
      { status: 401 }
    );
  }

  let res: Response;
  try {
    res = await fetch(
      `${authbootBaseUrl()}/admin/organizations/${orgId}/users/${userId}/addresses${subpath}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to reach the backend', addresses: [] },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.code !== 0) {
    return NextResponse.json(
      { success: false, message: data?.message ?? `Request failed (${res.status})`, addresses: [] },
      { status: 200 }
    );
  }

  return NextResponse.json({
    success: true,
    message: data.message ?? '',
    addresses: normalizeUserAddresses(data.addresses),
    ...(data.address ? { address: normalizeUserAddress(data.address) } : {})
  });
}

// ============================================================
// Route Handler — User Sessions (list) — BFF
// ============================================================
// GET → GET {BACKEND_URL}/api/v1/organizations/{orgId}/users/{id}/sessions
//       (orgId from the active_org cookie; response normalized to the
//        frontend session shape with ISO timestamps)
//
// The backend only keeps LIVE sessions (redis), so every item is active;
// revoked/expired sessions simply disappear from the list.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';
import { normalizeUserSessions } from '@/lib/user-mapper';

type Params = { params: Promise<{ id: string }> };

// Backend caps page_size at 100; a user rarely has more live sessions.
const PAGE_SIZE = 100;

function failure(message: string) {
  return NextResponse.json({ success: false, message, total: 0, sessions: [] }, { status: 200 });
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return failure('Invalid user id');

  const token = await getAccessToken();
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);
  if (!token || !orgId) return failure('Not authenticated / no org');

  // ListSessionsRequest lacks path annotations, so the ids are also passed
  // as query params (they must match the path or the backend rejects them).
  const query = new URLSearchParams({
    organization_id: String(orgId),
    user_id: id,
    page: '1',
    page_size: String(PAGE_SIZE)
  });

  let res: Response;
  try {
    res = await fetch(`${authbootBaseUrl()}/organizations/${orgId}/users/${id}/sessions?${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch {
    return failure('Failed to reach the backend');
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0) {
    return failure(body?.message ?? 'Failed to load sessions');
  }

  const sessions = normalizeUserSessions(body.sessions);
  return NextResponse.json({
    success: true,
    message: body.message,
    total: Number(body.total ?? sessions.length),
    sessions
  });
}

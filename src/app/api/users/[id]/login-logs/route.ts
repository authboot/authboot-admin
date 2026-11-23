// ============================================================
// Route Handler — User Login History (paginated) — BFF
// ============================================================
// GET → GET {BACKEND_URL}/api/v1/admin/organizations/{orgId}/user-login-logs
//           ?user_id={id}&page=&page_size=
//       (orgId from the active_org cookie; newest first; response
//        normalized to the frontend shape with ISO timestamps)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';
import { normalizeUserLoginLogs } from '@/lib/user-mapper';

type Params = { params: Promise<{ id: string }> };

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function positiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const page = positiveInt(request.nextUrl.searchParams.get('page'), 1);
  const limit = Math.min(
    positiveInt(request.nextUrl.searchParams.get('limit'), DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const failure = (message: string) =>
    NextResponse.json(
      { success: false, message, total: 0, page, limit, logs: [] },
      { status: 200 }
    );

  if (!/^\d+$/.test(id)) return failure('Invalid user id');

  const token = await getAccessToken();
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);
  if (!token || !orgId) return failure('Not authenticated / no org');

  const query = new URLSearchParams({
    user_id: id,
    page: String(page),
    page_size: String(limit)
  });

  let res: Response;
  try {
    res = await fetch(
      `${authbootBaseUrl()}/admin/organizations/${orgId}/user-login-logs?${query}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  } catch {
    return failure('Failed to reach the backend');
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0) {
    return failure(body?.message ?? 'Failed to load login history');
  }

  return NextResponse.json({
    success: true,
    message: body.message,
    total: Number(body.total ?? 0),
    page,
    limit,
    logs: normalizeUserLoginLogs(body.logs)
  });
}

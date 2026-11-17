// ============================================================
// Route Handler — Users (list) — BFF to authboot-server
// ============================================================
// GET  → GET {BACKEND_URL}/api/v1/admin/organizations/{orgId}/users
//        (orgId from the active_org cookie; pagination mapped to the
//         backend's page/page_size; response normalized to the table shape)
// POST → 501 in production — the backend exposes no admin "create user".
//        In development the row is kept in memory so the dashboard's
//        create flow stays demoable.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';
import { addDevUser, devUsersEnabled, listDevUsers } from '@/lib/dev-users-store';
import { normalizeUsers } from '@/lib/user-mapper';
import type { User, UserMutationPayload } from '@/features/users/api/types';

type UsersPayload = {
  success: boolean;
  time?: string;
  message: string;
  total_users: number;
  offset: number;
  limit: number;
  users: User[];
};

// Dev-only: prepend dashboard-created rows to the first page.
function withDevUsers(payload: UsersPayload, page: number, limit: number): UsersPayload {
  if (!devUsersEnabled() || page !== 1) return payload;

  const created = listDevUsers();
  if (created.length === 0) return payload;

  return {
    ...payload,
    users: [...created, ...payload.users].slice(0, limit),
    total_users: payload.total_users + created.length
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const pageSize = Number.isInteger(limit) && limit > 0 ? limit : 10;
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json(
      withDevUsers(
        {
          success: false,
          message: 'Not authenticated',
          users: [],
          total_users: 0,
          offset: 0,
          limit: pageSize
        },
        safePage,
        pageSize
      ),
      { status: 200 }
    );
  }

  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);
  if (!orgId) {
    return NextResponse.json(
      withDevUsers(
        {
          success: true,
          message: 'No active organization',
          users: [],
          total_users: 0,
          offset: 0,
          limit: pageSize
        },
        safePage,
        pageSize
      ),
      { status: 200 }
    );
  }

  let res: Response;
  try {
    // organization_id must also appear as a query param: the backend IDL
    // binds ListUsersRequest via form/query (the path annotation is missing).
    res = await fetch(
      `${authbootBaseUrl()}/admin/organizations/${orgId}/users?organization_id=${orgId}&page=${safePage}&page_size=${pageSize}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    return NextResponse.json(
      withDevUsers(
        {
          success: false,
          message: 'Failed to reach the backend',
          users: [],
          total_users: 0,
          offset: 0,
          limit: pageSize
        },
        safePage,
        pageSize
      ),
      { status: 200 }
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0) {
    return NextResponse.json(
      withDevUsers(
        {
          success: false,
          message: body?.message ?? 'Failed to load users',
          users: [],
          total_users: 0,
          offset: 0,
          limit: pageSize
        },
        safePage,
        pageSize
      ),
      { status: 200 }
    );
  }

  return NextResponse.json(
    withDevUsers(
      {
        success: true,
        time: new Date().toISOString(),
        message: body.message,
        total_users: body.total ?? 0,
        offset: (safePage - 1) * pageSize,
        limit: pageSize,
        users: normalizeUsers(body.users)
      },
      safePage,
      pageSize
    )
  );
}

export async function POST(request: NextRequest) {
  if (!devUsersEnabled()) {
    return NextResponse.json(
      { success: false, message: '创建用户接口尚未在 authboot-server 实现' },
      { status: 501 }
    );
  }

  const payload = (await request.json().catch(() => null)) as UserMutationPayload | null;
  if (!payload) {
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  }

  const user = addDevUser(payload);
  return NextResponse.json({
    success: true,
    time: new Date().toISOString(),
    message: 'User created (development only)',
    user
  });
}

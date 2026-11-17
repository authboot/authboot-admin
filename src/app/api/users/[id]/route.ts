// ============================================================
// Route Handler — Single User (detail / update / delete) — BFF
// ============================================================
// GET    → GET    {BACKEND_URL}/api/v1/admin/organizations/{orgId}/users/{id}
// PUT    → PUT    .../users/{id}  (nickname derived from the form's name fields)
// DELETE → 501 — the backend exposes disable/enable, not hard delete.
//
// In development, users created from the dashboard live in an in-memory store
// (src/lib/dev-users-store.ts); all three handlers resolve those first.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';
import { devUsersEnabled, findDevUser, removeDevUser, updateDevUser } from '@/lib/dev-users-store';
import { normalizeUser } from '@/lib/user-mapper';

type Params = { params: Promise<{ id: string }> };

async function authContext() {
  const token = await getAccessToken();
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);
  return { token, orgId };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  // Dev-only: users created from the dashboard are not in the backend.
  const devUser = devUsersEnabled() ? findDevUser(Number(id)) : undefined;
  if (devUser) {
    return NextResponse.json({
      success: true,
      time: new Date().toISOString(),
      message: 'Development user',
      user: devUser
    });
  }

  const { token, orgId } = await authContext();
  if (!token || !orgId) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated / no org' },
      { status: 200 }
    );
  }

  let res: Response;
  try {
    // Same IDL quirk as the list endpoint: pass ids as query params so the
    // backend request binds (GetUserRequest lacks path annotations).
    res = await fetch(
      `${authbootBaseUrl()}/admin/organizations/${orgId}/users/${id}?organization_id=${orgId}&user_id=${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to reach the backend' },
      { status: 200 }
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0 || !body.user) {
    return NextResponse.json(
      { success: false, message: body?.message ?? 'User not found' },
      { status: 200 }
    );
  }

  return NextResponse.json({
    success: true,
    message: body.message,
    user: normalizeUser(body.user)
  });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { token, orgId } = await authContext();
  if (!token || !orgId) {
    return NextResponse.json(
      { success: false, message: 'Not authenticated / no org' },
      { status: 200 }
    );
  }

  const formBody = await request.json().catch(() => ({}));

  // Dev-only: keep dashboard-created rows editable.
  if (devUsersEnabled()) {
    const devUser = findDevUser(Number(id));
    if (devUser) {
      const updated = updateDevUser(Number(id), {
        first_name: formBody.first_name ?? devUser.first_name,
        last_name: formBody.last_name ?? devUser.last_name,
        email: formBody.email ?? devUser.email,
        phone: formBody.phone ?? devUser.phone,
        status: formBody.status ?? devUser.status
      });
      return NextResponse.json({
        success: true,
        time: new Date().toISOString(),
        message: 'User updated (development only)',
        user: updated
      });
    }
  }

  // The form submits first/last name + contact fields the backend list
  // model doesn't carry; map the name to the backend's nickname field.
  const nickname = `${formBody.first_name ?? ''} ${formBody.last_name ?? ''}`.trim();
  const payload = {
    ...(nickname ? { nickname } : {}),
    ...(formBody.avatar ? { avatar: formBody.avatar } : {})
  };

  let res: Response;
  try {
    res = await fetch(
      `${authbootBaseUrl()}/admin/organizations/${orgId}/users/${id}?organization_id=${orgId}&user_id=${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to reach the backend' },
      { status: 200 }
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0) {
    return NextResponse.json(
      { success: false, message: body?.message ?? 'Failed to update user' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: body.message,
    user: normalizeUser(body.user)
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  // Dev-only: remove dashboard-created rows from the local store.
  if (devUsersEnabled() && removeDevUser(Number(id))) {
    return NextResponse.json({
      success: true,
      message: 'User deleted (development only)'
    });
  }

  return NextResponse.json(
    { success: false, message: '后端未提供删除用户接口，可使用禁用/启用替代' },
    { status: 501 }
  );
}

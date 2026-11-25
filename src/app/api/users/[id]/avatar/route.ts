// ============================================================
// Route Handler — User Avatar Upload — BFF
// ============================================================
// POST → POST {BACKEND_URL}/api/v1/admin/organizations/{orgId}/users/{id}/avatar
//        (multipart/form-data; the file part is named `avatar`, which the
//         backend reads via c.FormFile("avatar"). orgId comes from the
//         active_org cookie; the response is normalized to the dashboard
//         user shape.)
//
// Unlike the read routes, failures return a non-2xx status so the upload
// mutation rejects and the UI can show the message.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';
import { devUsersEnabled, findDevUser } from '@/lib/dev-users-store';
import { normalizeUser } from '@/lib/user-mapper';
import { getAvatarFileError } from '@/lib/avatar-upload';

type Params = { params: Promise<{ id: string }> };

const UPLOAD_TIMEOUT_MS = 30_000;

function failure(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return failure('Invalid user id', 400);
  }

  // Dev-only: dashboard-created users exist only in the local store, so there
  // is no backend account to attach an avatar to.
  if (devUsersEnabled() && findDevUser(Number(id))) {
    return failure('Avatar upload is not available for development-only users', 400);
  }

  const token = await getAccessToken();
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);
  if (!token || !orgId) {
    return failure('Not authenticated / no org', 401);
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('avatar');
  if (!file || typeof file === 'string') {
    return failure('Select an image to upload', 400);
  }
  const fileError = getAvatarFileError(file);
  if (fileError) {
    return failure(fileError, 400);
  }

  // Rebuild the form so only the avatar part reaches the backend.
  const upstream = new FormData();
  upstream.append('avatar', file, file.name);

  let res: Response;
  try {
    res = await fetch(`${authbootBaseUrl()}/admin/organizations/${orgId}/users/${id}/avatar`, {
      method: 'POST',
      // No Content-Type here: fetch sets the multipart boundary itself.
      headers: { Authorization: `Bearer ${token}` },
      body: upstream,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
    });
  } catch {
    return failure('Failed to reach the backend', 502);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0 || !body.user) {
    return failure(body?.message ?? 'Failed to upload avatar', res.ok ? 400 : res.status);
  }

  return NextResponse.json({
    success: true,
    message: body.message,
    user: normalizeUser(body.user)
  });
}

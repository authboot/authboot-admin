// ============================================================
// POST /api/auth/me/avatar — upload the signed-in admin's avatar
// ============================================================
// Proxies POST {BACKEND_URL}/api/v1/admin/me/avatar (multipart/form-data; the
// file part is named `avatar`, which the backend reads via
// c.FormFile("avatar")). The account is the one the access token belongs to,
// so an admin can only replace their own avatar.
//
// Like the other /api/auth/* routes it returns the backend envelope
// ({ code, message, profile }); failures are { code, message } with a non-2xx
// status.

import { NextRequest, NextResponse } from 'next/server';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { getAvatarFileError } from '@/lib/avatar-upload';

const UPLOAD_TIMEOUT_MS = 30_000;

function failure(message: string, status: number, code = 1) {
  return NextResponse.json({ code, message }, { status });
}

export async function POST(request: NextRequest) {
  const token = await getAccessToken();
  if (!token) {
    return failure('Not authenticated', 401);
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
    res = await fetch(`${authbootBaseUrl()}/admin/me/avatar`, {
      method: 'POST',
      // No Content-Type here: fetch sets the multipart boundary itself.
      headers: { Authorization: `Bearer ${token}` },
      body: upstream,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS)
    });
  } catch {
    return failure('Failed to reach the auth service', 502);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.code !== 0 || !data.profile) {
    return failure(
      data?.message ?? 'Failed to upload avatar',
      res.ok ? 400 : res.status,
      data?.code || 1
    );
  }

  return NextResponse.json(data);
}

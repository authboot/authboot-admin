// ============================================================
// POST /api/auth/login — proxy admin login to authboot-server
// ============================================================
// Forwards {email, password, device_id, device_name} to
// POST {BACKEND_URL}/api/v1/admin/auth/login and stores the returned
// access/refresh tokens in httpOnly cookies on success.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ACTIVE_ORG_COOKIE, authbootBaseUrl, setAuthCookies } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: 1, message: 'Invalid JSON body' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${authbootBaseUrl()}/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    return NextResponse.json(
      { code: 1, message: 'Failed to reach the auth service' },
      { status: 502 }
    );
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.code !== 0) {
    return NextResponse.json(
      { code: data.code ?? 1, message: data.message ?? 'Login failed' },
      { status: 401 }
    );
  }

  await setAuthCookies(
    data.access_token,
    data.refresh_token,
    data.access_token_expires_at,
    data.refresh_token_expires_at
  );

  // A new login starts with a platform token, even for a returning admin.
  (await cookies()).delete(ACTIVE_ORG_COOKIE);
  return NextResponse.json(data);
}

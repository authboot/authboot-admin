// ============================================================
// POST /api/auth/forgot-password — request a password reset
// ============================================================
// Proxies POST {BACKEND_URL}/api/v1/admin/auth/forgot-password with the
// submitted email. authboot-server is expected to send the reset link/code;
// adjust the path here if the backend names it differently.

import { NextRequest, NextResponse } from 'next/server';
import { authbootBaseUrl } from '@/lib/auth';

export async function POST(request: NextRequest) {
  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: 1, message: 'Invalid JSON body' }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ code: 1, message: 'Email is required' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${authbootBaseUrl()}/admin/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
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
      { code: data.code ?? 1, message: data.message ?? 'Failed to send the reset email' },
      { status: res.status >= 500 ? 502 : 400 }
    );
  }

  return NextResponse.json({
    code: 0,
    message: data.message ?? 'If the account exists, a reset email has been sent.'
  });
}

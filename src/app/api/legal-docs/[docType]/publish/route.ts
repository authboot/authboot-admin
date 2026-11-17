// ============================================================
// Route Handler — Legal Documents — BFF
// ============================================================
// POST → POST {BACKEND_URL}/api/v1/admin/organizations/{orgId}/legal-docs
//        Publishes a new immutable version (active or scheduled). Maps the
//        dashboard doc type (terms/privacy) to the backend canonical name
//        and passes ISO effectiveAt through as unix seconds.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';

type Params = { params: Promise<{ docType: string }> };

// dashboard doc type → backend canonical doc_type
function toBackendDocType(docType: string): string | null {
  switch (docType) {
    case 'terms':
      return 'user_agreement';
    case 'privacy':
      return 'privacy_policy';
    default:
      return null;
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { docType: rawDocType } = await params;
  const backendDocType = toBackendDocType(rawDocType);
  if (!backendDocType) {
    return NextResponse.json({ code: 1, message: 'Unknown document type' }, { status: 200 });
  }

  const token = await getAccessToken();
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);
  if (!token || !orgId) {
    return NextResponse.json({ code: 1, message: 'Not authenticated / no org' }, { status: 200 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.url !== 'string' || typeof body.changelog !== 'string') {
    return NextResponse.json({ code: 1, message: 'Invalid payload' }, { status: 200 });
  }

  const effectiveAt =
    typeof body.effectiveAt === 'string' && body.effectiveAt
      ? Math.floor(new Date(body.effectiveAt).getTime() / 1000)
      : 0;

  let res: Response;
  try {
    res = await fetch(`${authbootBaseUrl()}/admin/organizations/${orgId}/legal-docs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        organization_id: orgId,
        doc_type: backendDocType,
        url: body.url,
        changelog: body.changelog,
        // 0 = publish now; a future unix timestamp = scheduled. The backend
        // fetches the URL itself to archive the snapshot + hash.
        effective_at: effectiveAt
      })
    });
  } catch {
    return NextResponse.json({ code: 1, message: 'Failed to reach the backend' }, { status: 200 });
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload || payload.code !== 0) {
    return NextResponse.json(
      { code: payload?.code ?? 1, message: payload?.message ?? 'Publish failed' },
      { status: 200 }
    );
  }

  return NextResponse.json({
    code: 0,
    message: payload.message,
    version: payload.version
  });
}

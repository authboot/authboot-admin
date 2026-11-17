// ============================================================
// Route Handler — Public Legal Doc (current effective version) — BFF
// ============================================================
// GET /api/legal-docs/public/[docType]?version=N&include_content=true
//   → GET {BACKEND_URL}/api/v1/public/organizations/{orgId}/legal-docs
//     No auth required on the backend; this handler also works unauthenticated
//     on the dashboard side (used by login/signup pages). A matching client
//     version answers { unchanged: true } without the payload.

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authbootBaseUrl, getAccessToken } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, parseOrgId } from '@/lib/auth-shared';

type Params = { params: Promise<{ docType: string }> };

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

export async function GET(request: NextRequest, { params }: Params) {
  const { docType: rawDocType } = await params;
  const backendDocType = toBackendDocType(rawDocType);
  if (!backendDocType) {
    return NextResponse.json(
      { code: 1, message: 'Unknown document type', version: null, unchanged: false },
      { status: 200 }
    );
  }

  // Org id: active_org cookie first (signed-in admins), then ?org_id= (public pages).
  const cookieStore = await cookies();
  const orgId =
    parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value) ??
    parseOrgId(request.nextUrl.searchParams.get('org_id'));
  if (!orgId) {
    return NextResponse.json(
      { code: 1, message: 'No organization specified', version: null, unchanged: false },
      { status: 200 }
    );
  }

  const version = Number(request.nextUrl.searchParams.get('version') ?? 0);
  const includeContent = request.nextUrl.searchParams.get('include_content') === 'true';

  // Token is optional: the backend route is public, so unsigned visitors still
  // read the current effective version.
  const token = await getAccessToken();

  const query = new URLSearchParams({
    doc_type: backendDocType,
    version: String(Number.isInteger(version) && version > 0 ? version : 0),
    include_content: includeContent ? 'true' : 'false'
  });

  let res: Response;
  try {
    res = await fetch(
      `${authbootBaseUrl()}/public/organizations/${orgId}/legal-docs?${query.toString()}`,
      token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
    );
  } catch {
    return NextResponse.json(
      { code: 1, message: 'Failed to reach the backend', version: null, unchanged: false },
      { status: 200 }
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0) {
    return NextResponse.json(
      {
        code: body?.code ?? 1,
        message: body?.message ?? 'Failed to load document',
        version: null,
        unchanged: false
      },
      { status: 200 }
    );
  }

  return NextResponse.json({
    code: 0,
    message: body.message,
    version: body.version ?? null,
    unchanged: Boolean(body.unchanged)
  });
}

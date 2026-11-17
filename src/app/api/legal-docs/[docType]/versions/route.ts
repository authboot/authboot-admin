// ============================================================
// Route Handler — Legal Versions (list) — BFF
// ============================================================
// GET /api/legal-docs/[docType]/versions
//   → GET {BACKEND_URL}/api/v1/admin/organizations/{orgId}/legal-docs/versions
//     Returns the immutable version history, newest first, without content.

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

export async function GET(_request: NextRequest, { params }: Params) {
  const { docType: rawDocType } = await params;
  const backendDocType = toBackendDocType(rawDocType);
  if (!backendDocType) {
    return NextResponse.json(
      { code: 1, message: 'Unknown document type', versions: [] },
      { status: 200 }
    );
  }

  const token = await getAccessToken();
  const cookieStore = await cookies();
  const orgId = parseOrgId(cookieStore.get(ACTIVE_ORG_COOKIE)?.value);
  if (!token || !orgId) {
    return NextResponse.json(
      { code: 1, message: 'Not authenticated / no org', versions: [] },
      { status: 200 }
    );
  }

  let res: Response;
  try {
    res = await fetch(
      `${authbootBaseUrl()}/admin/organizations/${orgId}/legal-docs/versions?doc_type=${backendDocType}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    return NextResponse.json(
      { code: 1, message: 'Failed to reach the backend', versions: [] },
      { status: 200 }
    );
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.code !== 0) {
    return NextResponse.json(
      { code: body?.code ?? 1, message: body?.message ?? 'Failed to load versions', versions: [] },
      { status: 200 }
    );
  }

  return NextResponse.json({
    code: 0,
    message: body.message,
    versions: body.versions ?? []
  });
}

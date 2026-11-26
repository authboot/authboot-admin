// ============================================================
// Route Handler — User addresses (list / create) — BFF
// ============================================================
// GET  → GET  {BACKEND_URL}/api/v1/admin/organizations/{orgId}/users/{id}/addresses
// POST → POST {BACKEND_URL}/api/v1/admin/organizations/{orgId}/users/{id}/addresses
//        (orgId from the active_org cookie)

import { NextRequest, NextResponse } from 'next/server';
import { proxyUserAddress } from '@/lib/bff-user-address';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyUserAddress(id, '', 'GET');
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  return proxyUserAddress(id, '', 'POST', body);
}

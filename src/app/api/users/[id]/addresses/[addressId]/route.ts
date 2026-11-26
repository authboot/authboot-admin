// ============================================================
// Route Handler — One user address (update / delete) — BFF
// ============================================================
// PUT    → PUT    .../users/{id}/addresses/{addressId}
// DELETE → DELETE .../users/{id}/addresses/{addressId}

import { NextRequest, NextResponse } from 'next/server';
import { proxyUserAddress } from '@/lib/bff-user-address';

type Params = { params: Promise<{ id: string; addressId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id, addressId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  return proxyUserAddress(id, `/${encodeURIComponent(addressId)}`, 'PUT', body);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id, addressId } = await params;
  return proxyUserAddress(id, `/${encodeURIComponent(addressId)}`, 'DELETE');
}

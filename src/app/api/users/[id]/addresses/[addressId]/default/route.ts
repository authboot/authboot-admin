// ============================================================
// Route Handler — Make a user address the default — BFF
// ============================================================
// PUT → PUT .../users/{id}/addresses/{addressId}/default

import { NextRequest } from 'next/server';
import { proxyUserAddress } from '@/lib/bff-user-address';

type Params = { params: Promise<{ id: string; addressId: string }> };

export async function PUT(_request: NextRequest, { params }: Params) {
  const { id, addressId } = await params;
  return proxyUserAddress(id, `/${encodeURIComponent(addressId)}/default`, 'PUT');
}

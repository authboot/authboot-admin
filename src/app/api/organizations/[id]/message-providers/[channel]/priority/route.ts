// ============================================================
// Route Handler — Organization message provider send order
// ============================================================
// PUT /api/organizations/:id/message-providers/:channel/priority
//   → PUT {BACKEND_URL}/api/v1/admin/organizations/:id/message-providers/:channel/priority
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string; channel: string }> };

const BASE = '/api/v1/admin/organizations';

export async function PUT(request: NextRequest, { params }: Params) {
  const { id, channel } = await params;
  return proxyToBackend(
    request,
    `${BASE}/${id}/message-providers/${encodeURIComponent(channel)}/priority`
  );
}

// ============================================================
// Route Handler — Organization message providers (saved configs)
// ============================================================
// GET /api/organizations/:id/message-providers?channel=email
//   → GET {BACKEND_URL}/api/v1/admin/organizations/:id/message-providers
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

const BASE = '/api/v1/admin/organizations';

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const channel = request.nextUrl.searchParams.get('channel');
  const qs = channel ? `?channel=${encodeURIComponent(channel)}` : '';
  return proxyToBackend(request, `${BASE}/${id}/message-providers${qs}`);
}

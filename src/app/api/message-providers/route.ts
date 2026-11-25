// ============================================================
// Route Handler — Message provider catalog
// ============================================================
// GET /api/message-providers?channel=email
//   → GET {BACKEND_URL}/api/v1/admin/message-providers?channel=email
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

export async function GET(request: NextRequest) {
  const channel = request.nextUrl.searchParams.get('channel');
  const qs = channel ? `?channel=${encodeURIComponent(channel)}` : '';
  return proxyToBackend(request, `/api/v1/admin/message-providers${qs}`);
}

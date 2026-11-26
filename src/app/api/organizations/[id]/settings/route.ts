// ============================================================
// Route Handler — Organization settings (token TTL, login methods, maintenance)
// ============================================================
// GET /api/organizations/:id/settings
//   → GET {BACKEND_URL}/api/v1/admin/organizations/:id/settings
// PUT /api/organizations/:id/settings   (whole-object replace)
//   → PUT {BACKEND_URL}/api/v1/admin/organizations/:id/settings
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(request, `/api/v1/admin/organizations/${id}/settings`);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(request, `/api/v1/admin/organizations/${id}/settings`);
}

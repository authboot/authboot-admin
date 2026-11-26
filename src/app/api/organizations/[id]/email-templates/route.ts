// ============================================================
// Route Handler — Organization email template overrides
// ============================================================
// GET /api/organizations/:id/email-templates
//   → GET {BACKEND_URL}/api/v1/admin/organizations/:id/email-templates
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(request, `/api/v1/admin/organizations/${id}/email-templates`);
}

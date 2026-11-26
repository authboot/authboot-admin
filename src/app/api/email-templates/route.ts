// ============================================================
// Route Handler — Email template catalog
// ============================================================
// GET /api/email-templates
//   → GET {BACKEND_URL}/api/v1/admin/email-templates
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/email-templates');
}

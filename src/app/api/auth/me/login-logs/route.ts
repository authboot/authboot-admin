// GET /api/auth/me/login-logs → GET {BACKEND_URL}/api/v1/admin/me/login-logs (query forwarded)
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, `/api/v1/admin/me/login-logs${request.nextUrl.search}`);
}

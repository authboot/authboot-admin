// GET /api/organizations/:id/user-login-logs → app-user sign-in attempts (query forwarded)
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/organizations/${id}/user-login-logs${request.nextUrl.search}`
  );
}

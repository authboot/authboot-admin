// GET /api/organizations/:id/audit-logs → admin audit logs of the organization (query forwarded)
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/organizations/${id}/audit-logs${request.nextUrl.search}`
  );
}

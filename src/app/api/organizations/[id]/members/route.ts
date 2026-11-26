// GET /api/organizations/:id/members → workspace admins (memberships joined with accounts)
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/organizations/${id}/members${request.nextUrl.search}`
  );
}

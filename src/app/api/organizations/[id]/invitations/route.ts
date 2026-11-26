// GET  /api/organizations/:id/invitations → invitations of the workspace
// POST /api/organizations/:id/invitations → invite an admin by email
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/organizations/${id}/invitations${request.nextUrl.search}`
  );
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(request, `/api/v1/admin/organizations/${id}/invitations`);
}

// PUT /api/organizations/:id/members/:membershipId/role → change a member's role
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string; membershipId: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id, membershipId } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/organizations/${id}/members/${encodeURIComponent(membershipId)}/role`
  );
}

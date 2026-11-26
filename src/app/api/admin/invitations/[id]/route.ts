// DELETE /api/admin/invitations/:id → revoke a pending invitation
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(request, `/api/v1/admin/invitations/${encodeURIComponent(id)}`);
}

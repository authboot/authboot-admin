// POST /api/admin/invitations/:id/resend → rotate token, extend expiry, re-send email
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  return proxyToBackend(request, `/api/v1/admin/invitations/${encodeURIComponent(id)}/resend`, {
    timeoutMs: 30_000
  });
}

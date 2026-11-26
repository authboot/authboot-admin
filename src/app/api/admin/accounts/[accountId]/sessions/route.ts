// GET /api/admin/accounts/:accountId/sessions → admin sessions of one platform account
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ accountId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { accountId } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/sessions${request.nextUrl.search}`
  );
}

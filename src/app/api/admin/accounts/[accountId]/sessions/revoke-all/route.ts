// POST /api/admin/accounts/:accountId/sessions/revoke-all → end every session of the account
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ accountId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { accountId } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/accounts/${encodeURIComponent(accountId)}/sessions/revoke-all`
  );
}

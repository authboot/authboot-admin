// POST /api/admin/sessions/:sessionId/revoke → end one admin session
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { sessionId } = await params;
  return proxyToBackend(request, `/api/v1/admin/sessions/${encodeURIComponent(sessionId)}/revoke`);
}

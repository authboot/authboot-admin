// ============================================================
// Route Handler — Organization message provider (single provider)
// ============================================================
// PUT    /api/organizations/:id/message-providers/:channel/:provider
//   → validates with a real test send, then saves. Longer timeout: the
//     backend contacts the vendor before replying.
// DELETE /api/organizations/:id/message-providers/:channel/:provider
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string; channel: string; provider: string }> };

const BASE = '/api/v1/admin/organizations';

function path(id: string, channel: string, provider: string): string {
  return `${BASE}/${id}/message-providers/${encodeURIComponent(channel)}/${encodeURIComponent(provider)}`;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id, channel, provider } = await params;
  return proxyToBackend(request, path(id, channel, provider), { timeoutMs: 30_000 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, channel, provider } = await params;
  return proxyToBackend(request, path(id, channel, provider));
}

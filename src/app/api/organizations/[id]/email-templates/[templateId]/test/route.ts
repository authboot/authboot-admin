// ============================================================
// Route Handler — Send a test email from a template draft
// ============================================================
// POST /api/organizations/:id/email-templates/:templateId/test
//   Longer timeout: the backend delivers through the vendor before replying.
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string; templateId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id, templateId } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/organizations/${id}/email-templates/${encodeURIComponent(templateId)}/test`,
    { timeoutMs: 30_000 }
  );
}

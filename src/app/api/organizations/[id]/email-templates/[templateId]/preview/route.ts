// ============================================================
// Route Handler — Render an email template with sample values
// ============================================================
// POST /api/organizations/:id/email-templates/:templateId/preview
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string; templateId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id, templateId } = await params;
  return proxyToBackend(
    request,
    `/api/v1/admin/organizations/${id}/email-templates/${encodeURIComponent(templateId)}/preview`
  );
}

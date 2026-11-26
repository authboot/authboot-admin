// ============================================================
// Route Handler — Organization email template override (single)
// ============================================================
// PUT    /api/organizations/:id/email-templates/:templateId  → save override
// DELETE /api/organizations/:id/email-templates/:templateId  → reset to default
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

type Params = { params: Promise<{ id: string; templateId: string }> };

function path(id: string, templateId: string): string {
  return `/api/v1/admin/organizations/${id}/email-templates/${encodeURIComponent(templateId)}`;
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id, templateId } = await params;
  return proxyToBackend(request, path(id, templateId));
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id, templateId } = await params;
  return proxyToBackend(request, path(id, templateId));
}

// ============================================================
// Route Handler — signed-in admin's preferences (flat string map)
// ============================================================
// GET /api/auth/me/settings → GET {BACKEND_URL}/api/v1/admin/me/settings
// PUT /api/auth/me/settings → PUT {BACKEND_URL}/api/v1/admin/me/settings
// ============================================================

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/bff';

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/me/settings');
}

export async function PUT(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/me/settings');
}

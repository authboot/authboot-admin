// ============================================================
// Account sessions — Data Access Layer (static mock)
// ============================================================
// The auth service does not expose a session list yet, so this returns fake
// data. When the endpoint ships, replace the body with an `apiClient` call
// (e.g. `/auth/sessions`) — the query layer and components stay unchanged.

import type { SessionsResponse } from './types';

// Fixed timestamps keep server and client renders identical (no hydration
// drift from `Date.now()`).
const MOCK_SESSIONS: SessionsResponse = {
  sessions: [
    {
      id: 'session-current',
      device_name: 'MacBook Pro',
      browser: 'Chrome 131',
      os: 'macOS 14.6',
      ip: '10.99.64.82',
      location: 'Hangzhou, CN',
      last_active_at: '2026-11-12T09:42:00Z',
      created_at: '2026-11-09T02:15:00Z',
      current: true
    },
    {
      id: 'session-iphone',
      device_name: 'iPhone 15',
      browser: 'Safari 18',
      os: 'iOS 18.1',
      ip: '10.99.64.90',
      location: 'Hangzhou, CN',
      last_active_at: '2026-11-12T07:10:00Z',
      created_at: '2026-11-11T13:05:00Z',
      current: false
    },
    {
      id: 'session-windows',
      device_name: 'Office Desktop',
      browser: 'Edge 131',
      os: 'Windows 11',
      ip: '10.99.65.12',
      location: 'Shanghai, CN',
      last_active_at: '2026-11-11T18:26:00Z',
      created_at: '2026-10-28T08:40:00Z',
      current: false
    }
  ]
};

export async function getSessions(): Promise<SessionsResponse> {
  return MOCK_SESSIONS;
}

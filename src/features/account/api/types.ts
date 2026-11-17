// ============================================================
// Account sessions — Type Contract
// ============================================================
// Mirrors the session shape the auth service is expected to expose. The UI
// only depends on this contract, so wiring the backend later is a change to
// `service.ts` alone.

export type SessionDevice = {
  id: string;
  /** Human readable device label, e.g. "MacBook Pro". */
  device_name: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  /** ISO timestamp of the last request from this device. */
  last_active_at: string;
  /** ISO timestamp of when the session was created. */
  created_at: string;
  /** Marks the session that issued the current request. */
  current: boolean;
};

export type SessionsResponse = {
  sessions: SessionDevice[];
};

// ============================================================
// Legal documents — backend-backed types (authboot-server)
// ============================================================
// Documents are immutable append-only version lists served by the backend
// (idl/legal_doc.proto). Publishing appends a new version and retires the
// previously active one; scheduled versions become active automatically when
// their effective time arrives (status is derived server-side at read time).
//
// doc_type: the dashboard calls them terms / privacy; the BFF maps to the
// backend canonical names user_agreement / privacy_policy.

export type LegalDocType = 'terms' | 'privacy';

export type LegalVersionStatus = 'active' | 'scheduled' | 'retired';

export type LegalVersion = {
  /** Monotonic per document, assigned by the backend at publish time. */
  version: number;
  /** Canonical backend doc type (user_agreement / privacy_policy). */
  doc_type: string;
  /** Public URL of the document at publish time. */
  url: string;
  /** What changed in this version — shown in the history table. */
  changelog: string;
  status: LegalVersionStatus;
  /** Unix seconds when this version becomes/became effective. */
  effective_at: number;
  published_by: string;
  published_at: number;
  /** Hash of the archived snapshot (compliance evidence). */
  content_hash: string;
  has_snapshot: boolean;
  /** Archived snapshot text — only on detail/public reads that request it. */
  content?: string;
};

export type LegalPublishInput = {
  url: string;
  changelog: string;
  /** ISO timestamp when this version becomes effective; now = publish now. */
  effectiveAt: string;
  // The snapshot content is fetched server-side from the URL at publish time
  // (SSRF-guarded, 10s timeout, 256KB cap) — the client never submits it.
};

export type LegalVersionsResponse = {
  code: number;
  message: string;
  versions: LegalVersion[];
};

export type LegalPublishResponse = {
  code: number;
  message: string;
  version: LegalVersion | null;
};

export type LegalVersionResponse = {
  code: number;
  message: string;
  version: LegalVersion | null;
};

export type LegalPublicResponse = {
  code: number;
  message: string;
  version: LegalVersion | null;
  unchanged: boolean;
};

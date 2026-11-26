// ============================================================
// Organizations — Type Contract
// ============================================================
// Generated from organization.proto (OrganizationHandler service).
// Backend routes live under /api/v1/admin/organizations; the BFF route
// handlers in src/app/api/organizations/ proxy to them and return the
// shapes below. Field names are snake_case to match the Go/protobuf JSON.
// ============================================================

// Mirrors backend common.Status. Kept as a numeric code — align the exact
// values with common.proto if you need named constants.
export type OrganizationStatus = number;

export type Organization = {
  id: number;
  name: string;
  code: string;
  logo: string;
  status: OrganizationStatus;
  created_at: number;
  updated_at: number;
};

export type OrganizationFilters = {
  page?: number;
  page_size?: number;
  search?: string;
};

// ---- Mutation payloads ----

export type CreateOrganizationPayload = {
  name: string;
  code: string;
  logo?: string;
};

export type UpdateOrganizationPayload = {
  name?: string;
  code?: string;
  logo?: string;
  status?: OrganizationStatus;
};

// ---- Response shapes ----

export type OrganizationResponse = {
  code: number;
  message: string;
  organization: Organization;
};

export type ListOrganizationsResponse = {
  code: number;
  message: string;
  organizations: Organization[];
  total: number;
};

export type DeleteOrganizationResponse = {
  code: number;
  message: string;
};

export type UploadOrganizationLogoResponse = {
  code: number;
  message: string;
  logo: string;
  organization: Organization;
};

export type LeaveOrganizationResponse = {
  code: number;
  message: string;
};

// ---- Organization login methods (OAuth provider configs) ----
// Mirrors oauth.proto. `settings` holds provider-specific credentials; the
// backend masks sensitive values (containing '*') on read.
export type OAuthProviderConfig = {
  organization_id: number;
  provider: string;
  settings: Record<string, string>;
  enabled: boolean;
  created_at: number;
  updated_at: number;
};

export type OAuthConfigPayload = {
  settings: Record<string, string>;
  enabled: boolean;
};

export type ListOAuthConfigsResponse = {
  code: number;
  message: string;
  configs: OAuthProviderConfig[];
  total: number;
};

export type OAuthConfigResponse = {
  code: number;
  message: string;
  config: OAuthProviderConfig;
};

export type DeleteOAuthConfigResponse = {
  code: number;
  message: string;
};

// ---- Message delivery providers (email / sms) ----
// Mirrors message_provider.proto. The catalog is served by the backend
// registry; saved configs hold per-organization credentials with secret
// fields masked on read.
export type MessageChannelId = 'email' | 'sms';

export type MessageProviderField = {
  name: string;
  label: string;
  secret: boolean;
  required: boolean;
  placeholder: string;
  type: 'text' | 'password' | 'number' | 'boolean';
};

export type MessageProviderDescriptor = {
  channel: MessageChannelId;
  provider: string;
  name: string;
  description: string;
  fields: MessageProviderField[];
  platform_default: boolean;
};

/**
 * A saved provider. `priority` is the send order: 1 = default provider,
 * 2.. = fallbacks tried in turn, 0 = saved but not used for sending.
 */
export type MessageProviderConfig = {
  organization_id: number;
  channel: MessageChannelId;
  provider: string;
  settings: Record<string, string>;
  enabled: boolean;
  priority: number;
  verified_at: number;
  created_at: number;
  updated_at: number;
};

export type ListMessageProviderCatalogResponse = {
  code: number;
  message: string;
  providers: MessageProviderDescriptor[];
};

export type ListMessageProviderConfigsResponse = {
  code: number;
  message: string;
  configs: MessageProviderConfig[];
  total: number;
};

/** Secret fields left empty keep the stored value. */
export type SetMessageProviderPayload = {
  settings: Record<string, string>;
  /** Where the validation message goes; empty = the current admin's email. */
  test_recipient?: string;
};

export type SetMessageProviderResponse = {
  code: number;
  message: string;
  config: MessageProviderConfig;
};

export type SetMessageProviderPriorityPayload = {
  primary: string;
  fallbacks: string[];
};

export type SetMessageProviderPriorityResponse = {
  code: number;
  message: string;
  configs: MessageProviderConfig[];
};

export type DeleteMessageProviderResponse = {
  code: number;
  message: string;
};

// ---- Email templates (per-organization overrides) ----
// Mirrors email_template.proto. The catalog is the backend registry with the
// built-in default wording; an override replaces subject and body for one
// organization. Both use Go html/template syntax.
export type EmailTemplateVariableDto = {
  name: string;
  description: string;
  sample: string;
  required: boolean;
};

export type EmailTemplateDescriptor = {
  template_id: string;
  name: string;
  trigger: string;
  variables: EmailTemplateVariableDto[];
  default_subject: string;
  default_body: string;
};

export type EmailTemplateOverride = {
  organization_id: number;
  template_id: string;
  subject: string;
  body: string;
  created_at: number;
  updated_at: number;
};

export type ListEmailTemplateCatalogResponse = {
  code: number;
  message: string;
  templates: EmailTemplateDescriptor[];
};

export type ListEmailTemplateOverridesResponse = {
  code: number;
  message: string;
  overrides: EmailTemplateOverride[];
};

export type SetEmailTemplatePayload = {
  subject: string;
  body: string;
};

export type SetEmailTemplateResponse = {
  code: number;
  message: string;
  override: EmailTemplateOverride;
};

export type ResetEmailTemplateResponse = {
  code: number;
  message: string;
};

export type PreviewEmailTemplatePayload = {
  subject?: string;
  body?: string;
};

export type PreviewEmailTemplateResponse = {
  code: number;
  message: string;
  subject: string;
  html: string;
};

export type SendTestEmailTemplatePayload = {
  subject?: string;
  body?: string;
  recipient?: string;
};

export type SendTestEmailTemplateResponse = {
  code: number;
  message: string;
};

// ---- Organization settings (tb_organization.settings JSON) ----
// Mirrors organization.proto. PUT replaces the whole object, so callers read
// the current settings, change one block and send everything back.
export type OrganizationLoginMethods = {
  email_password: boolean;
  email_code: boolean;
  phone_code: boolean;
  oauth_providers: string[];
};

export type OrganizationMaintenance = {
  enabled: boolean;
  title: string;
  message: string;
  /** Unix seconds; 0 = not set. */
  expected_end: number;
  /** Unix seconds, stamped by the server when maintenance turns on; 0 when off. */
  started_at: number;
};

export type OrganizationSettings = {
  admin_token_ttl_seconds: number;
  login_methods: OrganizationLoginMethods;
  maintenance: OrganizationMaintenance;
  /** Absent from responses of backends older than the policy feature. */
  password_policy?: OrganizationPasswordPolicy;
};

export type OrganizationSettingsResponse = {
  code: number;
  message: string;
  settings: OrganizationSettings;
};

/** Mirrors organization.proto PasswordPolicy; max length is fixed at 72 server-side. */
export type OrganizationPasswordPolicy = {
  min_length: number;
  require_lowercase: boolean;
  require_uppercase: boolean;
  require_digit: boolean;
  require_symbol: boolean;
  /** Shown to users when a password is rejected; empty = server-generated. */
  hint: string;
};

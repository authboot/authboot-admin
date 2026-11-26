import { Icons, type Icon } from '@/components/icons';

// ============================================================
// Email templates — the emails a workspace sends to its users
// ============================================================
// The catalog (ids, variables, default wording) comes from the backend
// registry via GET /api/email-templates; this file holds the presentation
// types and the icon per template. Variables use Go template syntax
// ({{.Name}}), the same syntax the server renders with.

export type EmailTemplateId = string;

export type EmailTemplateVariable = {
  /** Used as {{.Name}} in the subject and body. */
  name: string;
  description: string;
  /** Stands in for the real value in the preview and in test emails. */
  sample: string;
  /** The email is useless without it, so the body must contain it. */
  required?: boolean;
};

export type EmailTemplateDefinition = {
  id: EmailTemplateId;
  name: string;
  /** When the email is sent, in one sentence. */
  trigger: string;
  icon: Icon;
  variables: EmailTemplateVariable[];
  defaultSubject: string;
  /** HTML. */
  defaultBody: string;
};

/** Icon per template id; unknown ids from a newer backend fall back to mail. */
export const EMAIL_TEMPLATE_ICONS: Record<string, Icon> = {
  verification_code: Icons.key,
  invitation: Icons.userPlus,
  security_alert: Icons.shieldCheck
};

export function emailTemplateIcon(id: string): Icon {
  return EMAIL_TEMPLATE_ICONS[id] ?? Icons.mail;
}

export const EMAIL_SUBJECT_MAX = 120;
export const EMAIL_BODY_MAX = 20000;

/** The address shown as the recipient in the preview. */
export const EMAIL_PREVIEW_RECIPIENT = 'alex@example.com';

import {
  EMAIL_BODY_MAX,
  EMAIL_SUBJECT_MAX,
  type EmailTemplateDefinition
} from '../constants/email-templates';

export type EmailTemplateContent = {
  subject: string;
  /** HTML. */
  body: string;
};

export type EmailTemplateIssues = Record<keyof EmailTemplateContent, string[]>;

// Everything between a pair of double braces. Templates are limited to plain
// variables — {{.Name}} — so anything else found in here is reported.
const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;
const VARIABLE = /^\s*\.([A-Za-z][A-Za-z0-9_]*)\s*$/;

export function variableToken(name: string): string {
  return `{{.${name}}}`;
}

export function defaultEmailTemplateContent(
  template: EmailTemplateDefinition
): EmailTemplateContent {
  return { subject: template.defaultSubject, body: template.defaultBody };
}

export function isSameEmailTemplateContent(
  a: EmailTemplateContent,
  b: EmailTemplateContent
): boolean {
  return a.subject === b.subject && a.body === b.body;
}

/** Names of the variables `text` uses, whether or not the template has them. */
export function usedVariables(text: string): Set<string> {
  const names = new Set<string>();
  for (const match of text.matchAll(PLACEHOLDER)) {
    const name = VARIABLE.exec(match[1])?.[1];
    if (name) names.add(name);
  }
  return names;
}

function placeholderIssues(text: string, template: EmailTemplateDefinition): string[] {
  const known = new Set(template.variables.map((variable) => variable.name));
  const issues = new Set<string>();

  for (const match of text.matchAll(PLACEHOLDER)) {
    const name = VARIABLE.exec(match[1])?.[1];
    if (!name) {
      issues.add(`${match[0]} is not supported — only the variables listed below can be used.`);
    } else if (!known.has(name)) {
      issues.add(`${variableToken(name)} is not a variable of this email.`);
    }
  }

  // Whatever "{{" is left once the complete pairs are gone was never closed.
  if (text.replace(PLACEHOLDER, '').includes('{{')) {
    issues.add('A "{{" is never closed with "}}".');
  }

  return [...issues];
}

/** Why a template cannot be saved, per field. Empty lists mean it is valid. */
export function getEmailTemplateIssues(
  template: EmailTemplateDefinition,
  content: EmailTemplateContent
): EmailTemplateIssues {
  const subject: string[] = [];
  const body: string[] = [];

  if (!content.subject.trim()) {
    subject.push('Add a subject line.');
  } else if (content.subject.length > EMAIL_SUBJECT_MAX) {
    subject.push(`Keep the subject under ${EMAIL_SUBJECT_MAX} characters.`);
  }
  subject.push(...placeholderIssues(content.subject, template));

  if (!content.body.trim()) {
    body.push('Add the email body.');
  } else if (content.body.length > EMAIL_BODY_MAX) {
    body.push(`Keep the body under ${EMAIL_BODY_MAX.toLocaleString('en-US')} characters.`);
  }
  body.push(...placeholderIssues(content.body, template));

  const inBody = usedVariables(content.body);
  for (const variable of template.variables) {
    if (variable.required && !inBody.has(variable.name)) {
      body.push(
        `The body must include ${variableToken(variable.name)} — the email is of no use without it.`
      );
    }
  }

  return { subject, body };
}

export function hasEmailTemplateIssues(issues: EmailTemplateIssues): boolean {
  return issues.subject.length > 0 || issues.body.length > 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Fills the template's variables with their sample values. Values are
 * HTML-escaped for the body, as the server does when it renders the email.
 * Anything that is not a known variable is left as written.
 */
export function renderEmailTemplate(
  text: string,
  template: EmailTemplateDefinition,
  target: keyof EmailTemplateContent
): string {
  const samples = new Map(template.variables.map((variable) => [variable.name, variable.sample]));

  return text.replace(PLACEHOLDER, (raw, inner: string) => {
    const name = VARIABLE.exec(inner)?.[1];
    const sample = name === undefined ? undefined : samples.get(name);
    if (sample === undefined) return raw;
    return target === 'body' ? escapeHtml(sample) : sample;
  });
}

/**
 * Wraps a rendered body in a standalone document for the preview frame. The
 * frame is sandboxed, so nothing in the body can run or reach the dashboard;
 * links are made inert so a click cannot navigate the preview away.
 */
export function buildEmailPreviewDocument(bodyHtml: string): string {
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    '<style>',
    'body{margin:0;padding:20px;background:#fff;color:#18181b;font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif;overflow-wrap:anywhere}',
    'img{max-width:100%}',
    'a{pointer-events:none}',
    '</style>',
    '</head>',
    `<body>${bodyHtml}</body>`,
    '</html>'
  ].join('');
}

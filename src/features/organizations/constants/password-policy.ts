// ============================================================
// Workspace password policy — structured rules and presets
// ============================================================
// The policy is a minimum length plus four character-class flags, stored in
// the organization's settings (`password_policy`) and enforced by the backend
// when users register, change or reset a password. Structured rules (not a
// regex) keep the server check trivial and let the UI render a checklist.

import type { OrganizationPasswordPolicy } from '../api/types';

/** bcrypt ignores everything past 72 bytes, so the server rejects longer passwords. */
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_MIN_LENGTH_FLOOR = 8;
export const PASSWORD_HINT_MAX = 200;

export const CUSTOM_PASSWORD_POLICY = 'custom';

/** The rule part of a policy, without the hint. */
export type PasswordRules = Omit<OrganizationPasswordPolicy, 'hint'>;

export type PasswordPolicyPreset = {
  id: string;
  name: string;
  description: string;
  rules: PasswordRules;
};

export const PASSWORD_POLICY_PRESETS: PasswordPolicyPreset[] = [
  {
    // Same rule the server applies when no policy is saved (8–72 characters).
    id: 'basic',
    name: 'Basic',
    description: 'Length only. Easiest for users, weakest protection.',
    rules: {
      min_length: 8,
      require_lowercase: false,
      require_uppercase: false,
      require_digit: false,
      require_symbol: false
    }
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Letters and numbers. A sensible default for most products.',
    rules: {
      min_length: 8,
      require_lowercase: true,
      require_uppercase: false,
      require_digit: true,
      require_symbol: false
    }
  },
  {
    id: 'strong',
    name: 'Strong',
    description: 'Mixed case, numbers and symbols. For finance or admin-heavy products.',
    rules: {
      min_length: 10,
      require_lowercase: true,
      require_uppercase: true,
      require_digit: true,
      require_symbol: true
    }
  }
];

export const DEFAULT_PASSWORD_POLICY_ID = 'basic';

/**
 * What the server enforces when an organization has no saved policy. Also the
 * fallback when a response predates the field (older backend / cached data).
 */
export const DEFAULT_PASSWORD_POLICY: OrganizationPasswordPolicy = {
  ...PASSWORD_POLICY_PRESETS[0].rules,
  hint: ''
};

export function isSameRules(a: PasswordRules, b: PasswordRules): boolean {
  return (
    a.min_length === b.min_length &&
    a.require_lowercase === b.require_lowercase &&
    a.require_uppercase === b.require_uppercase &&
    a.require_digit === b.require_digit &&
    a.require_symbol === b.require_symbol
  );
}

/** The preset whose rules equal `rules`, or 'custom'. */
export function presetIdFor(rules: PasswordRules): string {
  return (
    PASSWORD_POLICY_PRESETS.find((p) => isSameRules(p.rules, rules))?.id ?? CUSTOM_PASSWORD_POLICY
  );
}

export type PasswordRequirement = {
  label: string;
  test: (value: string) => boolean;
};

/** The checklist shown in the tester, derived from the rules. */
export function requirementsFor(rules: PasswordRules): PasswordRequirement[] {
  const out: PasswordRequirement[] = [
    {
      label: `${rules.min_length}–${PASSWORD_MAX_LENGTH} characters`,
      test: (v) => v.length >= rules.min_length && v.length <= PASSWORD_MAX_LENGTH
    }
  ];
  if (rules.require_lowercase)
    out.push({ label: 'A lowercase letter', test: (v) => /\p{Ll}/u.test(v) });
  if (rules.require_uppercase)
    out.push({ label: 'An uppercase letter', test: (v) => /\p{Lu}/u.test(v) });
  if (rules.require_digit) out.push({ label: 'A number', test: (v) => /\p{Nd}/u.test(v) });
  if (rules.require_symbol) {
    out.push({ label: 'A symbol', test: (v) => /[^\p{L}\p{Nd}]/u.test(v) });
  }
  return out;
}

/** Same sentence the server generates when the admin leaves the hint empty. */
export function defaultHintFor(rules: PasswordRules): string {
  const parts: string[] = [];
  if (rules.require_lowercase) parts.push('a lowercase letter');
  if (rules.require_uppercase) parts.push('an uppercase letter');
  if (rules.require_digit) parts.push('a number');
  if (rules.require_symbol) parts.push('a symbol');
  let msg = `Use at least ${rules.min_length} characters`;
  if (parts.length > 0) msg += `, including ${parts.join(', ')}`;
  return `${msg}.`;
}

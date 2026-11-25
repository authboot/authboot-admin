// ============================================================
// Workspace password policy — presets
// ============================================================
// The policy is stored as a regular expression plus the hint shown to users
// when a password is rejected. Presets cover the common cases so admins don't
// have to write a regex; "custom" lets them enter their own.

/** bcrypt ignores everything past 72 bytes, so the server rejects longer passwords. */
export const PASSWORD_MAX_LENGTH = 72;

export const CUSTOM_PASSWORD_POLICY = 'custom';

export type PasswordRequirement = {
  label: string;
  test: (value: string) => boolean;
};

export type PasswordPolicyPreset = {
  id: string;
  name: string;
  description: string;
  /** Must match the whole password. */
  pattern: string;
  /** Shown to users when their password is rejected. */
  hint: string;
  /** The pattern broken down for the checklist in the tester. */
  requirements: PasswordRequirement[];
};

const hasLowercase = (value: string) => /[a-z]/.test(value);
const hasUppercase = (value: string) => /[A-Z]/.test(value);
const hasLetter = (value: string) => /[A-Za-z]/.test(value);
const hasDigit = (value: string) => /\d/.test(value);
const hasSymbol = (value: string) => /[^A-Za-z0-9]/.test(value);
const lengthBetween = (min: number) => (value: string) =>
  value.length >= min && value.length <= PASSWORD_MAX_LENGTH;

export const PASSWORD_POLICY_PRESETS: PasswordPolicyPreset[] = [
  {
    // Same rule the server applies today (8–72 characters).
    id: 'basic',
    name: 'Basic',
    description: 'Length only. Easiest for users, weakest protection.',
    pattern: `^.{8,${PASSWORD_MAX_LENGTH}}$`,
    hint: 'Use at least 8 characters.',
    requirements: [{ label: `8–${PASSWORD_MAX_LENGTH} characters`, test: lengthBetween(8) }]
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Letters and numbers. A sensible default for most products.',
    pattern: `^(?=.*[A-Za-z])(?=.*\\d).{8,${PASSWORD_MAX_LENGTH}}$`,
    hint: 'Use at least 8 characters, including a letter and a number.',
    requirements: [
      { label: `8–${PASSWORD_MAX_LENGTH} characters`, test: lengthBetween(8) },
      { label: 'A letter', test: hasLetter },
      { label: 'A number', test: hasDigit }
    ]
  },
  {
    id: 'strong',
    name: 'Strong',
    description: 'Mixed case, numbers and symbols. For finance or admin-heavy products.',
    pattern: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{10,${PASSWORD_MAX_LENGTH}}$`,
    hint: 'Use at least 10 characters, with upper and lower case letters, a number and a symbol.',
    requirements: [
      { label: `10–${PASSWORD_MAX_LENGTH} characters`, test: lengthBetween(10) },
      { label: 'A lowercase letter', test: hasLowercase },
      { label: 'An uppercase letter', test: hasUppercase },
      { label: 'A number', test: hasDigit },
      { label: 'A symbol', test: hasSymbol }
    ]
  }
];

export const DEFAULT_PASSWORD_POLICY_ID = 'basic';

export const PASSWORD_POLICY_PRESET_BY_ID = new Map(
  PASSWORD_POLICY_PRESETS.map((preset) => [preset.id, preset])
);

import * as z from 'zod';

// ============================================================
// Workspace policies — maintenance notice and verification codes
// ============================================================

export const MAINTENANCE_TITLE_MAX = 60;
export const MAINTENANCE_MESSAGE_MAX = 300;

export const maintenanceNoticeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Add a title for the notice')
    .max(MAINTENANCE_TITLE_MAX, `Keep the title under ${MAINTENANCE_TITLE_MAX} characters`),
  message: z
    .string()
    .trim()
    .min(1, 'Tell users what is happening')
    .max(MAINTENANCE_MESSAGE_MAX, `Keep the message under ${MAINTENANCE_MESSAGE_MAX} characters`),
  // A `datetime-local` value, or '' when the end time is unknown.
  expectedEnd: z
    .string()
    .refine((value) => value === '' || new Date(value).getTime() > Date.now(), {
      message: 'Pick a time in the future, or leave it empty'
    })
});

export type MaintenanceNotice = z.infer<typeof maintenanceNoticeSchema>;

export const DEFAULT_MAINTENANCE_NOTICE: MaintenanceNotice = {
  title: "We'll be back soon",
  message:
    'We are carrying out scheduled maintenance, so signing in is temporarily unavailable. Please try again later.',
  expectedEnd: ''
};

// Allowed ranges for the verification-code rules. The lower bound on the
// cooldown stops a resend button from being used to flood a recipient.
export const VERIFICATION_CODE_LIMITS = {
  ttlMinutes: { min: 1, max: 30 },
  cooldownSeconds: { min: 30, max: 600 },
  hourlyLimit: { min: 1, max: 30 }
} as const;

const wholeNumber = (min: number, max: number, unit: string) =>
  z
    .number({ error: 'Enter a number' })
    .int('Use a whole number')
    .min(min, `Must be at least ${min} ${unit}`)
    .max(max, `Must be at most ${max} ${unit}`);

export const verificationCodeSchema = z.object({
  /** How long a code stays valid after it is sent. */
  ttlMinutes: wholeNumber(
    VERIFICATION_CODE_LIMITS.ttlMinutes.min,
    VERIFICATION_CODE_LIMITS.ttlMinutes.max,
    'min'
  ),
  /** Minimum wait before the same recipient can request another code. */
  cooldownSeconds: wholeNumber(
    VERIFICATION_CODE_LIMITS.cooldownSeconds.min,
    VERIFICATION_CODE_LIMITS.cooldownSeconds.max,
    'sec'
  ),
  /** Maximum codes one recipient can be sent per hour. */
  hourlyLimit: wholeNumber(
    VERIFICATION_CODE_LIMITS.hourlyLimit.min,
    VERIFICATION_CODE_LIMITS.hourlyLimit.max,
    'per hour'
  )
});

export type VerificationCodeRules = z.infer<typeof verificationCodeSchema>;

// What the server does today: 5-minute codes, one per minute, ten per hour.
export const DEFAULT_VERIFICATION_CODE_RULES: VerificationCodeRules = {
  ttlMinutes: 5,
  cooldownSeconds: 60,
  hourlyLimit: 10
};

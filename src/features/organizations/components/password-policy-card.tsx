'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/icons';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import {
  CUSTOM_PASSWORD_POLICY,
  DEFAULT_PASSWORD_POLICY_ID,
  PASSWORD_MAX_LENGTH,
  PASSWORD_POLICY_PRESET_BY_ID,
  PASSWORD_POLICY_PRESETS
} from '../constants/password-policy';

type PasswordPolicy = {
  /** A preset id, or 'custom'. */
  mode: string;
  /** Only used in custom mode — presets carry their own pattern and hint. */
  customPattern: string;
  customHint: string;
};

const DEFAULT_POLICY: PasswordPolicy = {
  mode: DEFAULT_PASSWORD_POLICY_ID,
  customPattern: '',
  customHint: ''
};

const POLICY_OPTIONS = [
  ...PASSWORD_POLICY_PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.name,
    description: preset.description
  })),
  {
    id: CUSTOM_PASSWORD_POLICY,
    name: 'Custom',
    description: 'Write your own regular expression.'
  }
];

function compilePattern(pattern: string): { regex: RegExp | null; error: string | null } {
  if (!pattern) return { regex: null, error: null };
  try {
    return { regex: new RegExp(pattern), error: null };
  } catch (error) {
    return {
      regex: null,
      error: error instanceof Error ? error.message : 'Invalid regular expression'
    };
  }
}

function isSamePolicy(a: PasswordPolicy, b: PasswordPolicy): boolean {
  return a.mode === b.mode && a.customPattern === b.customPattern && a.customHint === b.customHint;
}

/**
 * Password rule for accounts in the active workspace: one of the presets or a
 * custom regular expression, the hint shown when a password is rejected, and
 * a tester to try the rule before saving it.
 *
 * Static version — the policy lives in this component and is not sent to the
 * backend yet.
 */
export function PasswordPolicyCard() {
  const [saved, setSaved] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [draft, setDraft] = useState<PasswordPolicy>(DEFAULT_POLICY);
  const [sample, setSample] = useState('');

  const isCustom = draft.mode === CUSTOM_PASSWORD_POLICY;
  const preset = PASSWORD_POLICY_PRESET_BY_ID.get(draft.mode);
  const pattern = isCustom ? draft.customPattern.trim() : (preset?.pattern ?? '');
  const hint = isCustom ? draft.customHint.trim() : (preset?.hint ?? '');
  const { regex, error: patternError } = compilePattern(pattern);

  const isDirty = !isSamePolicy(draft, saved);
  const canSave = isDirty && (!isCustom || (regex !== null && hint.length > 0));

  const tooLong = sample.length > PASSWORD_MAX_LENGTH;
  const sampleAccepted = regex !== null && !tooLong && regex.test(sample);

  function handleSave() {
    setSaved(draft);
    toast.success('Password policy saved');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.key className='size-5' />
          Password policy
        </CardTitle>
        <CardDescription>
          The rule a new password must meet when users sign up, reset or change their password.
          Existing passwords keep working until they are changed.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <RadioGroup
          value={draft.mode}
          aria-label='Password rule'
          className='grid gap-2 sm:grid-cols-2'
          onValueChange={(value) => setDraft((prev) => ({ ...prev, mode: String(value) }))}
        >
          {POLICY_OPTIONS.map((option) => (
            <FieldLabel key={option.id} htmlFor={`password-policy-${option.id}`}>
              <Field orientation='horizontal'>
                <FieldContent>
                  <FieldTitle>{option.name}</FieldTitle>
                  <FieldDescription className='text-xs'>{option.description}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={option.id} id={`password-policy-${option.id}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>

        {isCustom ? (
          <div className='space-y-4'>
            <Field data-invalid={Boolean(patternError)}>
              <FieldLabel htmlFor='password-policy-pattern'>Regular expression</FieldLabel>
              <Input
                id='password-policy-pattern'
                value={draft.customPattern}
                placeholder='^(?=.*[A-Za-z])(?=.*\d).{8,72}$'
                className='font-mono text-xs'
                autoComplete='off'
                spellCheck={false}
                aria-invalid={Boolean(patternError)}
                aria-describedby={patternError ? 'password-policy-pattern-error' : undefined}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, customPattern: event.target.value }))
                }
              />
              {patternError ? (
                <FieldError id='password-policy-pattern-error'>{patternError}</FieldError>
              ) : (
                <FieldDescription>
                  It must match the whole password — start with ^ and end with $.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor='password-policy-hint'>Hint shown to users</FieldLabel>
              <Input
                id='password-policy-hint'
                value={draft.customHint}
                maxLength={120}
                placeholder='Use at least 8 characters, including a letter and a number.'
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, customHint: event.target.value }))
                }
              />
              <FieldDescription>
                Shown when a password is rejected. Describe the rule in plain words — users never
                see the regular expression.
              </FieldDescription>
            </Field>
          </div>
        ) : (
          <dl className='space-y-3 text-sm'>
            <div>
              <dt className='text-muted-foreground text-xs'>Regular expression</dt>
              <dd className='bg-muted mt-1 rounded-md px-3 py-2 font-mono text-xs break-all'>
                {pattern}
              </dd>
            </div>
            <div>
              <dt className='text-muted-foreground text-xs'>Hint shown to users</dt>
              <dd className='mt-1'>{hint}</dd>
            </div>
          </dl>
        )}

        <div className='space-y-3 rounded-lg border p-3'>
          <Field>
            <FieldLabel htmlFor='password-policy-sample'>Try a password</FieldLabel>
            <div className='flex items-center gap-2'>
              <Input
                id='password-policy-sample'
                value={sample}
                placeholder='Type a password to test the rule'
                autoComplete='off'
                spellCheck={false}
                className='font-mono'
                onChange={(event) => setSample(event.target.value)}
              />
              {sample && regex && (
                <StatusBadge
                  status={sampleAccepted ? 'accepted' : 'rejected'}
                  tone={sampleAccepted ? 'success' : 'danger'}
                />
              )}
            </div>
            <FieldDescription>
              The test runs in your browser — nothing you type here is saved or sent.
            </FieldDescription>
          </Field>

          {!isCustom && preset && (
            <ul className='grid gap-1.5 text-sm sm:grid-cols-2'>
              {preset.requirements.map((requirement) => {
                const met = sample.length > 0 && requirement.test(sample);
                return (
                  <li
                    key={requirement.label}
                    className={cn(
                      'flex items-center gap-2',
                      met ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
                    )}
                  >
                    {met ? (
                      <Icons.circleCheck className='size-4 shrink-0' />
                    ) : (
                      <Icons.circle className='size-4 shrink-0' />
                    )}
                    {requirement.label}
                  </li>
                );
              })}
            </ul>
          )}

          {tooLong && (
            <p className='text-destructive text-xs'>
              Passwords longer than {PASSWORD_MAX_LENGTH} characters are always rejected.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <Button type='button' variant='ghost' disabled={!isDirty} onClick={() => setDraft(saved)}>
          Discard changes
        </Button>
        <Button type='button' disabled={!canSave} onClick={handleSave}>
          Save policy
        </Button>
      </CardFooter>
    </Card>
  );
}

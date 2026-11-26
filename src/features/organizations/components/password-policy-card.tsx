'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/icons';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import {
  CUSTOM_PASSWORD_POLICY,
  DEFAULT_PASSWORD_POLICY,
  PASSWORD_HINT_MAX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH_FLOOR,
  PASSWORD_POLICY_PRESETS,
  defaultHintFor,
  presetIdFor,
  requirementsFor,
  type PasswordRules
} from '../constants/password-policy';
import { organizationSettingsQueryOptions } from '../api/queries';
import { updateOrganizationSettingsMutation } from '../api/mutations';
import type { OrganizationPasswordPolicy } from '../api/types';

type PasswordPolicyCardProps = {
  orgId: number;
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
    description: 'Pick the length and character classes yourself.'
  }
];

const FLAGS: { key: keyof Omit<PasswordRules, 'min_length'>; label: string }[] = [
  { key: 'require_lowercase', label: 'A lowercase letter' },
  { key: 'require_uppercase', label: 'An uppercase letter' },
  { key: 'require_digit', label: 'A number' },
  { key: 'require_symbol', label: 'A symbol' }
];

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

function isSamePolicy(a: OrganizationPasswordPolicy, b: OrganizationPasswordPolicy): boolean {
  return (
    a.min_length === b.min_length &&
    a.require_lowercase === b.require_lowercase &&
    a.require_uppercase === b.require_uppercase &&
    a.require_digit === b.require_digit &&
    a.require_symbol === b.require_symbol &&
    a.hint.trim() === b.hint.trim()
  );
}

/**
 * Password rule for accounts in the active workspace: a preset or custom
 * combination of minimum length and required character classes, the hint
 * shown when a password is rejected, and a tester. Saved in the
 * organization's settings and enforced by the backend on register, change
 * and reset.
 */
export function PasswordPolicyCard({ orgId }: PasswordPolicyCardProps) {
  const { data } = useSuspenseQuery(organizationSettingsQueryOptions(orgId));
  const settings = data.settings;
  // Older backends / cached responses may lack the field; fall back to the server default.
  const saved = settings.password_policy ?? DEFAULT_PASSWORD_POLICY;

  const [draft, setDraft] = useState<OrganizationPasswordPolicy>(saved);
  const [sample, setSample] = useState('');
  const mutation = useMutation(updateOrganizationSettingsMutation);

  const presetId = presetIdFor(draft);
  const requirements = requirementsFor(draft);
  const effectiveHint = draft.hint.trim() || defaultHintFor(draft);

  const minLengthInvalid =
    !Number.isInteger(draft.min_length) ||
    draft.min_length < PASSWORD_MIN_LENGTH_FLOOR ||
    draft.min_length > PASSWORD_MAX_LENGTH;
  const isDirty = !isSamePolicy(draft, saved);
  const canSave = isDirty && !minLengthInvalid && draft.hint.length <= PASSWORD_HINT_MAX;

  const tooLong = sample.length > PASSWORD_MAX_LENGTH;
  const sampleAccepted = !tooLong && requirements.every((r) => r.test(sample));

  function selectPreset(id: string) {
    if (id === CUSTOM_PASSWORD_POLICY) return; // keep current rules, just unlock editing
    const preset = PASSWORD_POLICY_PRESETS.find((p) => p.id === id);
    if (preset) setDraft((prev) => ({ ...prev, ...preset.rules }));
  }

  async function handleSave() {
    try {
      // PUT replaces the whole settings object; only the policy changes here.
      await mutation.mutateAsync({
        id: orgId,
        settings: { ...settings, password_policy: { ...draft, hint: draft.hint.trim() } }
      });
      toast.success('Password policy saved');
    } catch (error) {
      toast.error(errorMessage(error));
    }
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
          value={presetId}
          aria-label='Password rule'
          className='grid gap-2 sm:grid-cols-2'
          onValueChange={(value) => selectPreset(String(value))}
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

        <div className='grid gap-4 sm:grid-cols-2'>
          <Field data-invalid={minLengthInvalid}>
            <FieldLabel htmlFor='password-policy-min-length'>Minimum length</FieldLabel>
            <Input
              id='password-policy-min-length'
              type='number'
              min={PASSWORD_MIN_LENGTH_FLOOR}
              max={PASSWORD_MAX_LENGTH}
              value={draft.min_length}
              aria-invalid={minLengthInvalid}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, min_length: Number(event.target.value) }))
              }
            />
            {minLengthInvalid ? (
              <FieldError>
                Between {PASSWORD_MIN_LENGTH_FLOOR} and {PASSWORD_MAX_LENGTH}.
              </FieldError>
            ) : (
              <FieldDescription>
                Maximum is always {PASSWORD_MAX_LENGTH} (bcrypt limit).
              </FieldDescription>
            )}
          </Field>

          <fieldset className='space-y-2'>
            <legend className='text-sm font-medium'>Must include</legend>
            {FLAGS.map((flag) => (
              <label key={flag.key} className='flex items-center gap-2 text-sm'>
                <Checkbox
                  checked={draft[flag.key]}
                  onCheckedChange={(checked) =>
                    setDraft((prev) => ({ ...prev, [flag.key]: checked === true }))
                  }
                />
                {flag.label}
              </label>
            ))}
          </fieldset>
        </div>

        <Field>
          <FieldLabel htmlFor='password-policy-hint'>Hint shown to users</FieldLabel>
          <Input
            id='password-policy-hint'
            value={draft.hint}
            maxLength={PASSWORD_HINT_MAX}
            placeholder={defaultHintFor(draft)}
            onChange={(event) => setDraft((prev) => ({ ...prev, hint: event.target.value }))}
          />
          <FieldDescription>
            Shown when a password is rejected. Leave empty to use the generated sentence: &ldquo;
            {defaultHintFor(draft)}&rdquo;
          </FieldDescription>
        </Field>

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
              {sample && (
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

          <ul className='grid gap-1.5 text-sm sm:grid-cols-2'>
            {requirements.map((requirement) => {
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

          {sample && !sampleAccepted && (
            <p className='text-muted-foreground text-xs'>
              Users would see: &ldquo;{effectiveHint}&rdquo;
            </p>
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
        <LoadingButton
          type='button'
          loading={mutation.isPending}
          loadingLabel='Saving…'
          disabled={!canSave}
          onClick={() => void handleSave()}
        >
          Save policy
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}

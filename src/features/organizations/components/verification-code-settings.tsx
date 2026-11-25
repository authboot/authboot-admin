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
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText
} from '@/components/ui/input-group';
import { useAppForm } from '@/lib/form';
import { useFieldContext, useFieldInvalid } from '@/lib/form-context';
import {
  MESSAGE_CHANNEL_ORDER,
  MESSAGE_CHANNELS,
  type ActiveProviders,
  type MessageChannel
} from '../constants/message-providers';
import {
  DEFAULT_VERIFICATION_CODE_RULES,
  VERIFICATION_CODE_LIMITS,
  verificationCodeSchema,
  type VerificationCodeRules
} from '../schemas/workspace-policies';

type VerificationCodeSettingsProps = {
  activeProviders: ActiveProviders;
  /** Opens the delivery settings, where the sending provider is chosen. */
  onManageDelivery: () => void;
};

const CODE_CARDS: Record<MessageChannel, { title: string; description: string }> = {
  email: {
    title: 'Email code',
    description: 'One-time codes sent by email for sign-in, sign-up and password reset.'
  },
  sms: {
    title: 'Phone code',
    description: 'One-time codes sent by SMS for sign-in, sign-up and password reset.'
  }
};

/** Number input with a unit suffix. Rendered inside `form.AppField`. */
function UnitNumberField({
  idPrefix,
  label,
  unit,
  description,
  min,
  max
}: {
  idPrefix: string;
  label: string;
  unit: string;
  description: string;
  min: number;
  max: number;
}) {
  const field = useFieldContext<number | undefined>();
  const isInvalid = useFieldInvalid();
  // Both channel cards use the same field names, so ids are scoped per card.
  const id = `${idPrefix}-${field.name}`;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={id}
          type='number'
          inputMode='numeric'
          min={min}
          max={max}
          step={1}
          value={field.state.value ?? ''}
          onBlur={field.handleBlur}
          onChange={(event) =>
            field.handleChange(event.target.value === '' ? undefined : Number(event.target.value))
          }
          aria-invalid={isInvalid}
          aria-describedby={`${id}-${isInvalid ? 'error' : 'description'}`}
        />
        <InputGroupAddon align='inline-end'>
          <InputGroupText>{unit}</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      {isInvalid ? (
        <FieldError id={`${id}-error`} errors={field.state.meta.errors} />
      ) : (
        <FieldDescription id={`${id}-description`}>{description}</FieldDescription>
      )}
    </Field>
  );
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function plural(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'}`;
}

/** The rules in one sentence, plus a hint when the hourly limit can never be reached. */
function RulesSummary({ rules }: { rules: Partial<VerificationCodeRules> }) {
  const { ttlMinutes, cooldownSeconds, hourlyLimit } = rules;
  if (
    !isPositiveNumber(ttlMinutes) ||
    !isPositiveNumber(cooldownSeconds) ||
    !isPositiveNumber(hourlyLimit)
  ) {
    return null;
  }

  // With a cooldown between sends, only so many codes fit into one hour.
  const reachablePerHour = Math.floor(3600 / cooldownSeconds);

  return (
    <div className='bg-muted/50 text-muted-foreground space-y-1 rounded-lg px-3 py-2 text-sm'>
      <p>
        A code stays valid for {plural(ttlMinutes, 'minute')}. The same recipient can ask for a new
        one every {plural(cooldownSeconds, 'second')}, up to {plural(hourlyLimit, 'code')} per hour.
      </p>
      {hourlyLimit > reachablePerHour && (
        <p className='text-xs'>
          With this wait time at most {plural(reachablePerHour, 'code')} can be sent in an hour, so
          the hourly limit will never be reached.
        </p>
      )}
    </div>
  );
}

function CodeRulesCard({
  channel,
  activeProviderId,
  onManageDelivery
}: {
  channel: MessageChannel;
  activeProviderId: string | null;
  onManageDelivery: () => void;
}) {
  const definition = MESSAGE_CHANNELS[channel];
  const copy = CODE_CARDS[channel];
  const provider = activeProviderId ? { name: activeProviderId } : undefined;
  const formId = `${channel}-code-rules-form`;

  const [saved, setSaved] = useState<VerificationCodeRules>(DEFAULT_VERIFICATION_CODE_RULES);

  const form = useAppForm({
    defaultValues: saved,
    validators: { onChange: verificationCodeSchema },
    onSubmit: ({ value, formApi }) => {
      setSaved(value);
      formApi.reset(value);
      toast.success(`${copy.title} rules saved`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <definition.icon className='size-5' />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2'>
          <p className='text-sm'>
            <span className='text-muted-foreground'>Sent through </span>
            <span className='font-medium'>
              {provider ? provider.name : `the platform's default ${definition.noun} service`}
            </span>
          </p>
          <Button type='button' variant='outline' size='sm' onClick={onManageDelivery}>
            {provider ? 'Change' : 'Connect your own'}
          </Button>
        </div>

        <form
          id={formId}
          className='grid gap-4 sm:grid-cols-3'
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <form.AppField
            name='ttlMinutes'
            children={() => (
              <UnitNumberField
                idPrefix={channel}
                label='Valid for'
                unit='min'
                description={`${VERIFICATION_CODE_LIMITS.ttlMinutes.min}–${VERIFICATION_CODE_LIMITS.ttlMinutes.max} minutes`}
                {...VERIFICATION_CODE_LIMITS.ttlMinutes}
              />
            )}
          />
          <form.AppField
            name='cooldownSeconds'
            children={() => (
              <UnitNumberField
                idPrefix={channel}
                label='Wait before resending'
                unit='sec'
                description={`${VERIFICATION_CODE_LIMITS.cooldownSeconds.min}–${VERIFICATION_CODE_LIMITS.cooldownSeconds.max} seconds`}
                {...VERIFICATION_CODE_LIMITS.cooldownSeconds}
              />
            )}
          />
          <form.AppField
            name='hourlyLimit'
            children={() => (
              <UnitNumberField
                idPrefix={channel}
                label='Limit per recipient'
                unit='/ hour'
                description={`${VERIFICATION_CODE_LIMITS.hourlyLimit.min}–${VERIFICATION_CODE_LIMITS.hourlyLimit.max} codes per hour`}
                {...VERIFICATION_CODE_LIMITS.hourlyLimit}
              />
            )}
          />
        </form>

        <form.Subscribe selector={(state) => state.values}>
          {(values) => <RulesSummary rules={values} />}
        </form.Subscribe>
      </CardContent>
      <CardFooter className='justify-end gap-2'>
        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const isDirty =
              values.ttlMinutes !== saved.ttlMinutes ||
              values.cooldownSeconds !== saved.cooldownSeconds ||
              values.hourlyLimit !== saved.hourlyLimit;
            return (
              <>
                <Button
                  type='button'
                  variant='ghost'
                  disabled={!isDirty}
                  onClick={() => form.reset()}
                >
                  Discard changes
                </Button>
                <Button type='submit' form={formId} disabled={!isDirty}>
                  Save changes
                </Button>
              </>
            );
          }}
        </form.Subscribe>
      </CardFooter>
    </Card>
  );
}

/**
 * Verification-code rules per channel: how long a code is valid and how often
 * one recipient can request another.
 *
 * Static version — each card keeps its rules in memory; nothing is sent to
 * the backend yet.
 */
export function VerificationCodeSettings({
  activeProviders,
  onManageDelivery
}: VerificationCodeSettingsProps) {
  return (
    <div className='space-y-4'>
      {MESSAGE_CHANNEL_ORDER.map((channel) => (
        <CodeRulesCard
          key={channel}
          channel={channel}
          activeProviderId={activeProviders[channel]}
          onManageDelivery={onManageDelivery}
        />
      ))}
    </div>
  );
}

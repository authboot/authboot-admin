'use client';

import { useState } from 'react';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  MESSAGE_CHANNEL_ORDER,
  MESSAGE_CHANNELS,
  MESSAGE_VENDORS,
  SUMMARY_FIELDS,
  vendorOf,
  type ActiveProviders,
  type MessageChannel
} from '../constants/message-providers';
import { messageProviderCatalogQueryOptions, messageProvidersQueryOptions } from '../api/queries';
import {
  deleteMessageProviderMutation,
  setMessageProviderMutation,
  setMessageProviderPriorityMutation
} from '../api/mutations';
import type {
  MessageProviderConfig,
  MessageProviderDescriptor,
  SetMessageProviderPayload
} from '../api/types';

type ProviderSettings = Record<string, string>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Request failed';
}

/**
 * Display name of the default sender per channel (priority 1), derived from
 * the saved configs. Used by the verification tab; not suspenseful so the
 * other tabs never block on it.
 */
export function useActiveProviders(orgId: number): ActiveProviders {
  const { data: catalog } = useQuery(messageProviderCatalogQueryOptions());
  const { data } = useQuery(messageProvidersQueryOptions(orgId));
  const active: ActiveProviders = { email: null, sms: null };
  for (const config of data?.configs ?? []) {
    if (config.priority !== 1) continue;
    const descriptor = catalog?.providers.find((d) => d.provider === config.provider);
    active[config.channel] = descriptor?.name ?? config.provider;
  }
  return active;
}

function VendorMark({ providerId }: { providerId: string }) {
  const vendor = MESSAGE_VENDORS[vendorOf(providerId)];
  return (
    <div
      aria-hidden='true'
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-semibold',
        vendor.className
      )}
    >
      {vendor.mark}
    </div>
  );
}

function summaryOf(settings: ProviderSettings, fallback: string): string {
  for (const key of SUMMARY_FIELDS) {
    if (settings[key]) return settings[key];
  }
  return fallback;
}

/**
 * Masked credentials as stored on the server (e.g. "re******"). The backend
 * never returns the full secret; this shows which key is configured.
 */
function maskedSecrets(
  descriptor: MessageProviderDescriptor,
  settings: ProviderSettings
): { label: string; value: string }[] {
  return descriptor.fields
    .filter((field) => field.secret && settings[field.name])
    .map((field) => ({ label: field.label, value: settings[field.name] }));
}

function roleBadge(priority: number, fallbackCount: number) {
  if (priority === 1) return <StatusBadge status='active' label='Default' />;
  if (priority > 1) {
    return (
      <StatusBadge
        status='connected'
        tone='neutral'
        label={fallbackCount > 1 ? `Fallback #${priority - 1}` : 'Fallback'}
      />
    );
  }
  return <StatusBadge status='connected' tone='neutral' label='Not in use' />;
}

/** A provider this workspace has connected. */
function ConnectedProviderRow({
  descriptor,
  config,
  fallbackCount,
  busy,
  onView,
  onEdit,
  onMakeDefault,
  onMakeFallback,
  onPause,
  onTest,
  onRemove
}: {
  descriptor: MessageProviderDescriptor;
  config: MessageProviderConfig;
  fallbackCount: number;
  busy: boolean;
  onView: () => void;
  onEdit: () => void;
  onMakeDefault: () => void;
  onMakeFallback: () => void;
  onPause: () => void;
  onTest: () => void;
  onRemove: () => void;
}) {
  const isDefault = config.priority === 1;
  return (
    <div className='flex flex-wrap items-center gap-3 px-3 py-3'>
      <VendorMark providerId={descriptor.provider} />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-medium'>{descriptor.name}</p>
        <p className='text-muted-foreground truncate text-xs'>
          {summaryOf(config.settings, descriptor.description)}
        </p>
        {maskedSecrets(descriptor, config.settings).map((secret) => (
          <p key={secret.label} className='text-muted-foreground truncate font-mono text-xs'>
            {secret.label}: {secret.value}
          </p>
        ))}
      </div>
      {roleBadge(config.priority, fallbackCount)}

      <div className='flex shrink-0 items-center gap-1'>
        {isDefault ? (
          <Button type='button' variant='outline' size='sm' disabled={busy} onClick={onTest}>
            <Icons.send />
            Send test
          </Button>
        ) : (
          <Button type='button' variant='outline' size='sm' disabled={busy} onClick={onMakeDefault}>
            Set as default
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon-sm'
                disabled={busy}
                aria-label={`More actions for ${descriptor.name}`}
              />
            }
          >
            <Icons.ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='min-w-44'>
            <DropdownMenuItem onClick={onView}>
              <Icons.eye />
              View configuration
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Icons.edit />
              Edit configuration
            </DropdownMenuItem>
            {!isDefault && (
              <DropdownMenuItem onClick={onTest}>
                <Icons.send />
                Send test
              </DropdownMenuItem>
            )}
            {config.priority === 0 && (
              <DropdownMenuItem onClick={onMakeFallback}>
                <Icons.add />
                Use as fallback
              </DropdownMenuItem>
            )}
            {config.priority > 0 && (
              <DropdownMenuItem onClick={onPause}>
                <Icons.circleX />
                Stop using
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant='destructive' onClick={onRemove}>
              <Icons.trash />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/** Step 1 of the sheet: the searchable list of providers the backend supports. */
function ProviderCatalog({
  providers,
  connectedIds,
  onSelect
}: {
  providers: MessageProviderDescriptor[];
  connectedIds: Set<string>;
  onSelect: (provider: MessageProviderDescriptor) => void;
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const matches = query
    ? providers.filter((provider) =>
        `${provider.name} ${provider.description}`.toLowerCase().includes(query)
      )
    : providers;

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4'>
      <div className='relative'>
        <Icons.search className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2' />
        <Input
          type='search'
          value={search}
          placeholder='Search providers'
          aria-label='Search providers'
          className='pl-8'
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <p className='text-muted-foreground text-xs'>
        {matches.length} of {providers.length} supported{' '}
        {providers.length === 1 ? 'provider' : 'providers'}
      </p>

      {matches.length > 0 ? (
        <ul className='flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto'>
          {matches.map((provider) => (
            <li key={provider.provider}>
              <button
                type='button'
                className='hover:bg-accent focus-visible:ring-ring/50 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-3'
                onClick={() => onSelect(provider)}
              >
                <VendorMark providerId={provider.provider} />
                <span className='min-w-0 flex-1'>
                  <span className='block truncate text-sm font-medium'>{provider.name}</span>
                  <span className='text-muted-foreground block truncate text-xs'>
                    {provider.description}
                  </span>
                </span>
                {connectedIds.has(provider.provider) && (
                  <StatusBadge status='connected' tone='neutral' label='Connected' />
                )}
                <Icons.chevronRight className='text-muted-foreground size-4 shrink-0' />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className='text-muted-foreground rounded-lg border border-dashed px-3 py-8 text-center text-sm'>
          {providers.length === 0
            ? 'The backend does not support any provider for this channel yet.'
            : `No provider matches “${search.trim()}”.`}
        </p>
      )}
    </div>
  );
}

/**
 * Step 2 of the sheet: the provider's configuration. Submitting sends the
 * settings to the backend, which delivers a test message with them and only
 * then saves — a provider can never be connected with credentials that don't
 * work.
 */
function ProviderConfigForm({
  orgId,
  provider,
  config,
  isFirst,
  onBack,
  onSaved,
  onBusyChange
}: {
  orgId: number;
  provider: MessageProviderDescriptor;
  /** Existing config when editing a connected provider. */
  config?: MessageProviderConfig;
  /** No provider is connected on this channel yet, so this one becomes the default. */
  isFirst: boolean;
  /** Back to the catalog. Absent when the sheet was opened to edit. */
  onBack?: () => void;
  onSaved: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const channel = MESSAGE_CHANNELS[provider.channel];
  const editing = Boolean(config);
  // Saved secrets are never shown again: their inputs start empty, and an
  // empty secret means "keep the current one".
  const [values, setValues] = useState<ProviderSettings>(() =>
    Object.fromEntries(
      provider.fields.map((field) => [
        field.name,
        field.secret ? '' : (config?.settings[field.name] ?? '')
      ])
    )
  );
  const [recipient, setRecipient] = useState('');
  const [failure, setFailure] = useState<string | null>(null);

  const mutation = useMutation({
    ...setMessageProviderMutation,
    onMutate: () => onBusyChange(true),
    onSettled: () => onBusyChange(false)
  });

  const complete = provider.fields.every((field) => {
    if (!field.required || (field.secret && editing)) return true;
    return (values[field.name] ?? '').trim().length > 0;
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!complete || mutation.isPending) return;

    const settings: ProviderSettings = {};
    for (const field of provider.fields) {
      settings[field.name] = (values[field.name] ?? '').trim();
    }
    const payload: SetMessageProviderPayload = { settings };
    if (recipient.trim()) payload.test_recipient = recipient.trim();

    setFailure(null);
    try {
      await mutation.mutateAsync({
        id: orgId,
        channel: provider.channel,
        provider: provider.provider,
        values: payload
      });
      onSaved();
    } catch (error) {
      setFailure(errorMessage(error));
    }
  }

  const testing = mutation.isPending;

  return (
    <form onSubmit={handleSubmit} className='flex min-h-0 flex-1 flex-col'>
      <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4'>
        {onBack && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-muted-foreground -ml-2 w-fit'
            disabled={testing}
            onClick={onBack}
          >
            <Icons.chevronLeft />
            All providers
          </Button>
        )}

        <div className='flex items-center gap-3 rounded-lg border p-3'>
          <VendorMark providerId={provider.provider} />
          <div className='min-w-0'>
            <p className='truncate text-sm font-medium'>{provider.name}</p>
            <p className='text-muted-foreground truncate text-xs'>{provider.description}</p>
          </div>
        </div>

        <fieldset disabled={testing} className='grid gap-3'>
          {provider.fields.map((field) => {
            const id = `provider-${provider.provider}-${field.name}`;
            return (
              <div key={field.name} className='grid gap-1.5'>
                <Label htmlFor={id}>
                  {field.label}
                  {!field.required && (
                    <span className='text-muted-foreground font-normal'>(optional)</span>
                  )}
                </Label>
                <Input
                  id={id}
                  type={field.secret ? 'password' : field.type === 'number' ? 'number' : 'text'}
                  value={values[field.name] ?? ''}
                  placeholder={
                    field.secret && editing
                      ? config?.settings[field.name]
                        ? `Current: ${config.settings[field.name]} — leave empty to keep`
                        : 'Leave empty to keep the current one'
                      : field.placeholder
                  }
                  autoComplete='off'
                  spellCheck={false}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                  }
                />
                {field.type === 'boolean' && (
                  <p className='text-muted-foreground text-xs'>Enter true or false.</p>
                )}
              </div>
            );
          })}

          <div className='grid gap-1.5'>
            <Label htmlFor={`provider-${provider.provider}-recipient`}>
              Send the test {channel.noun} to
              <span className='text-muted-foreground font-normal'>(optional)</span>
            </Label>
            <Input
              id={`provider-${provider.provider}-recipient`}
              type={channel.recipientInputType}
              value={recipient}
              placeholder='Your admin email by default'
              autoComplete='off'
              onChange={(event) => setRecipient(event.target.value)}
            />
          </div>
        </fieldset>

        {failure && (
          <Alert variant='destructive'>
            <Icons.alertCircle />
            <AlertTitle>Connection failed</AlertTitle>
            <AlertDescription>
              {failure} Nothing was changed — {channel.noun} is still sent the same way as before.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <SheetFooter className='border-t'>
        <p className='text-muted-foreground text-xs' aria-live='polite'>
          {testing
            ? `Sending a test ${channel.noun} through ${provider.name}…`
            : editing
              ? 'A test message is sent again before your changes are saved.'
              : isFirst
                ? `A test message is sent first. If it arrives, ${provider.name} becomes the default ${channel.noun} provider for this workspace.`
                : `A test message is sent first. If it arrives, ${provider.name} is added as a fallback; you can make it the default afterwards.`}
        </p>
        <LoadingButton
          type='submit'
          loading={testing}
          loadingLabel='Checking connection…'
          disabled={!complete}
        >
          {editing ? 'Test & save' : 'Test & connect'}
        </LoadingButton>
      </SheetFooter>
    </form>
  );
}

/**
 * Side sheet for connecting a provider: pick one from the catalog, then fill
 * in its configuration. Opened with `initialProvider` it skips the catalog and
 * edits that provider.
 */
function ProviderSheet({
  orgId,
  channel,
  catalog,
  configs,
  initialProvider,
  onClose
}: {
  orgId: number;
  channel: MessageChannel;
  catalog: MessageProviderDescriptor[];
  configs: MessageProviderConfig[];
  initialProvider?: MessageProviderDescriptor;
  onClose: () => void;
}) {
  const definition = MESSAGE_CHANNELS[channel];
  const [selected, setSelected] = useState<MessageProviderDescriptor | null>(
    initialProvider ?? null
  );
  const [busy, setBusy] = useState(false);

  const config = selected ? configs.find((c) => c.provider === selected.provider) : undefined;
  const editing = Boolean(config);

  return (
    <Sheet
      open
      // A running connection check finishes before the sheet can be closed, so
      // a provider is never switched on behind a closed sheet.
      onOpenChange={(open) => !open && !busy && onClose()}
    >
      <SheetContent className='data-[side=right]:sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>
            {selected
              ? `${editing ? 'Edit' : 'Connect'} ${selected.name}`
              : `Add ${definition.noun} provider`}
          </SheetTitle>
          <SheetDescription>
            {selected
              ? `Use credentials that are only allowed to send ${definition.noun}.`
              : `Choose the service that sends ${definition.noun} for this workspace.`}
          </SheetDescription>
        </SheetHeader>

        {selected ? (
          <ProviderConfigForm
            key={selected.provider}
            orgId={orgId}
            provider={selected}
            config={config}
            isFirst={configs.length === 0}
            onBack={initialProvider ? undefined : () => setSelected(null)}
            onBusyChange={setBusy}
            onSaved={() => {
              toast.success(
                editing
                  ? `${selected.name} configuration saved`
                  : configs.length === 0
                    ? `${selected.name} connected — it now sends ${definition.noun} for this workspace`
                    : `${selected.name} connected as a fallback`
              );
              onClose();
            }}
          />
        ) : (
          <ProviderCatalog
            providers={catalog}
            connectedIds={new Set(configs.map((c) => c.provider))}
            onSelect={setSelected}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Read-only view of a saved provider as the backend returns it: every setting
 * with secrets masked, plus when it was last verified. The full secret is
 * never sent to the browser.
 */
function ProviderDetailsDialog({
  descriptor,
  config,
  onClose,
  onEdit
}: {
  descriptor: MessageProviderDescriptor;
  config: MessageProviderConfig;
  onClose: () => void;
  onEdit: () => void;
}) {
  const role =
    config.priority === 1
      ? 'Default provider'
      : config.priority > 1
        ? `Fallback #${config.priority - 1}`
        : 'Saved, not in use';
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3'>
            <VendorMark providerId={descriptor.provider} />
            {descriptor.name}
          </DialogTitle>
          <DialogDescription>
            {role}. Secrets are shown masked; the server never returns them in full.
          </DialogDescription>
        </DialogHeader>

        <dl className='divide-y rounded-lg border text-sm'>
          {descriptor.fields.map((field) => {
            const value = config.settings[field.name];
            return (
              <div key={field.name} className='grid grid-cols-[9rem_1fr] gap-3 px-3 py-2'>
                <dt className='text-muted-foreground'>{field.label}</dt>
                <dd className={cn('min-w-0 break-all', field.secret && 'font-mono')}>
                  {value ? value : <span className='text-muted-foreground'>—</span>}
                </dd>
              </div>
            );
          })}
          <div className='grid grid-cols-[9rem_1fr] gap-3 px-3 py-2'>
            <dt className='text-muted-foreground'>Last verified</dt>
            <dd>
              {config.verified_at ? formatDate(config.verified_at * 1000, dateOptions) : 'Never'}
            </dd>
          </div>
          <div className='grid grid-cols-[9rem_1fr] gap-3 px-3 py-2'>
            <dt className='text-muted-foreground'>Last updated</dt>
            <dd>{formatDate(config.updated_at * 1000, dateOptions)}</dd>
          </div>
        </dl>

        <DialogFooter>
          <DialogClose render={<Button type='button' variant='outline' />}>Close</DialogClose>
          <Button type='button' onClick={onEdit}>
            <Icons.edit />
            Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Re-runs the backend validation for a connected provider with its stored
 * credentials (secrets are sent empty so the saved ones are kept) and a
 * recipient of the admin's choosing.
 */
function TestMessageDialog({
  orgId,
  descriptor,
  config,
  onClose
}: {
  orgId: number;
  descriptor: MessageProviderDescriptor;
  config: MessageProviderConfig;
  onClose: () => void;
}) {
  const channel = MESSAGE_CHANNELS[descriptor.channel];
  const [recipient, setRecipient] = useState('');
  const mutation = useMutation(setMessageProviderMutation);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const target = recipient.trim();
    if (!target || mutation.isPending) return;

    const settings: ProviderSettings = {};
    for (const field of descriptor.fields) {
      settings[field.name] = field.secret ? '' : (config.settings[field.name] ?? '');
    }
    try {
      await mutation.mutateAsync({
        id: orgId,
        channel: descriptor.channel,
        provider: descriptor.provider,
        values: { settings, test_recipient: target }
      });
      toast.success(`Test ${channel.noun} sent to ${target}`);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !mutation.isPending && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} className='grid gap-4'>
          <DialogHeader>
            <DialogTitle>Send a test {channel.noun}</DialogTitle>
            <DialogDescription>
              Sends a test message through {descriptor.name} so you can check delivery.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-1.5'>
            <Label htmlFor={`test-${descriptor.provider}-recipient`}>
              {channel.recipientLabel}
            </Label>
            <Input
              id={`test-${descriptor.provider}-recipient`}
              type={channel.recipientInputType}
              value={recipient}
              placeholder={channel.recipientPlaceholder}
              autoComplete='off'
              required
              disabled={mutation.isPending}
              onChange={(event) => setRecipient(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type='button' variant='outline' />}>Cancel</DialogClose>
            <LoadingButton
              type='submit'
              loading={mutation.isPending}
              loadingLabel='Sending…'
              disabled={!recipient.trim()}
            >
              Send test
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type SheetState = { channel: MessageChannel; provider?: MessageProviderDescriptor };
type RowTarget = { descriptor: MessageProviderDescriptor; config: MessageProviderConfig };

type MessageProviderSettingsProps = {
  orgId: number;
};

/** Active (priority > 0) configs of a channel, default first. */
function sendOrder(configs: MessageProviderConfig[]): MessageProviderConfig[] {
  return configs.filter((c) => c.priority > 0).toSorted((a, b) => a.priority - b.priority);
}

/**
 * Email and SMS delivery for a workspace. Each channel lists the providers the
 * workspace has connected; "Add provider" opens the catalog the backend
 * supports. A provider is connected only after the backend's test send
 * passes. One provider per channel is the default sender, the rest can be
 * fallbacks tried in order; with none the platform's default service is used.
 */
export function MessageProviderSettings({ orgId }: MessageProviderSettingsProps) {
  const { data: catalogData } = useSuspenseQuery(messageProviderCatalogQueryOptions());
  const { data: configData } = useSuspenseQuery(messageProvidersQueryOptions(orgId));
  const catalog = catalogData.providers;
  const configs = configData.configs;
  const descriptorById = new Map(catalog.map((d) => [d.provider, d]));

  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [viewing, setViewing] = useState<RowTarget | null>(null);
  const [testing, setTesting] = useState<RowTarget | null>(null);
  const [removing, setRemoving] = useState<RowTarget | null>(null);

  const priorityMutation = useMutation(setMessageProviderPriorityMutation);
  const deleteMutation = useMutation(deleteMessageProviderMutation);
  const busy = priorityMutation.isPending || deleteMutation.isPending;

  async function applyOrder(channel: MessageChannel, order: string[], success: string) {
    try {
      await priorityMutation.mutateAsync({
        id: orgId,
        channel,
        values: { primary: order[0] ?? '', fallbacks: order.slice(1) }
      });
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function handleMakeDefault({ descriptor, config }: RowTarget) {
    const channelConfigs = configs.filter((c) => c.channel === config.channel);
    const rest = sendOrder(channelConfigs)
      .filter((c) => c.provider !== config.provider)
      .map((c) => c.provider);
    void applyOrder(
      config.channel,
      [config.provider, ...rest],
      `${descriptor.name} now sends ${MESSAGE_CHANNELS[config.channel].noun} for this workspace`
    );
  }

  function handleMakeFallback({ descriptor, config }: RowTarget) {
    const channelConfigs = configs.filter((c) => c.channel === config.channel);
    const order = sendOrder(channelConfigs).map((c) => c.provider);
    void applyOrder(
      config.channel,
      [...order, config.provider],
      `${descriptor.name} added as a fallback`
    );
  }

  function handlePause({ descriptor, config }: RowTarget) {
    const channelConfigs = configs.filter((c) => c.channel === config.channel);
    const order = sendOrder(channelConfigs)
      .filter((c) => c.provider !== config.provider)
      .map((c) => c.provider);
    const noun = MESSAGE_CHANNELS[config.channel].noun;
    void applyOrder(
      config.channel,
      order,
      order.length === 0
        ? `Stopped using ${descriptor.name} — back on the platform's default ${noun} service`
        : `Stopped using ${descriptor.name}`
    );
  }

  async function handleRemove({ descriptor, config }: RowTarget) {
    setRemoving(null);
    try {
      await deleteMutation.mutateAsync({
        id: orgId,
        channel: config.channel,
        provider: config.provider
      });
      toast.success(`${descriptor.name} disconnected`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className='space-y-4'>
      {MESSAGE_CHANNEL_ORDER.map((channelId) => {
        const channel = MESSAGE_CHANNELS[channelId];
        const channelCatalog = catalog.filter((d) => d.channel === channelId);
        const connected = configs
          .filter((c) => c.channel === channelId)
          .map((config) => ({ config, descriptor: descriptorById.get(config.provider) }))
          .filter((row): row is RowTarget => Boolean(row.descriptor))
          .toSorted((a, b) => {
            // Default, then fallbacks in order, then unused.
            const pa = a.config.priority || Number.MAX_SAFE_INTEGER;
            const pb = b.config.priority || Number.MAX_SAFE_INTEGER;
            return pa - pb;
          });
        const active = sendOrder(connected.map((r) => r.config));
        const fallbackCount = Math.max(active.length - 1, 0);

        return (
          <Card key={channelId}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <channel.icon className='size-5' />
                {channel.deliveryTitle}
              </CardTitle>
              <CardDescription>{channel.deliveryDescription}</CardDescription>
              <CardAction>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={channelCatalog.length === 0}
                  onClick={() => setSheet({ channel: channelId })}
                >
                  <Icons.add />
                  Add provider
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className='space-y-3'>
              {connected.length > 0 ? (
                <div className='divide-y rounded-lg border'>
                  {connected.map((row) => (
                    <ConnectedProviderRow
                      key={row.config.provider}
                      descriptor={row.descriptor}
                      config={row.config}
                      fallbackCount={fallbackCount}
                      busy={busy}
                      onView={() => setViewing(row)}
                      onEdit={() => setSheet({ channel: channelId, provider: row.descriptor })}
                      onMakeDefault={() => handleMakeDefault(row)}
                      onMakeFallback={() => handleMakeFallback(row)}
                      onPause={() => handlePause(row)}
                      onTest={() => setTesting(row)}
                      onRemove={() => setRemoving(row)}
                    />
                  ))}
                </div>
              ) : (
                <div className='flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-8 text-center'>
                  <div className='bg-muted mb-1 flex size-9 items-center justify-center rounded-md'>
                    <channel.icon className='text-muted-foreground size-4' />
                  </div>
                  <p className='text-sm font-medium'>No provider connected</p>
                  <p className='text-muted-foreground max-w-sm text-xs'>
                    {channelCatalog.length === 0
                      ? `The backend does not support custom ${channel.noun} providers yet; the platform's default service is used.`
                      : `This workspace sends ${channel.noun} through the platform's default service. Add a provider to send from your own account.`}
                  </p>
                </div>
              )}

              {connected.length > 0 && active.length === 0 && (
                <p className='text-muted-foreground flex items-start gap-2 text-xs'>
                  <Icons.info className='mt-0.5 size-4 shrink-0' />
                  No connected provider is in use, so {channel.noun} goes through the
                  platform&apos;s default service.
                </p>
              )}
              {fallbackCount > 0 && (
                <p className='text-muted-foreground flex items-start gap-2 text-xs'>
                  <Icons.info className='mt-0.5 size-4 shrink-0' />
                  If the default provider fails, fallbacks are tried in the order shown.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {sheet && (
        <ProviderSheet
          key={`${sheet.channel}-${sheet.provider?.provider ?? 'catalog'}`}
          orgId={orgId}
          channel={sheet.channel}
          catalog={catalog.filter((d) => d.channel === sheet.channel)}
          configs={configs.filter((c) => c.channel === sheet.channel)}
          initialProvider={sheet.provider}
          onClose={() => setSheet(null)}
        />
      )}

      {viewing && (
        <ProviderDetailsDialog
          descriptor={viewing.descriptor}
          config={viewing.config}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setSheet({ channel: viewing.config.channel, provider: viewing.descriptor });
            setViewing(null);
          }}
        />
      )}

      {testing && (
        <TestMessageDialog
          orgId={orgId}
          descriptor={testing.descriptor}
          config={testing.config}
          onClose={() => setTesting(null)}
        />
      )}

      {removing && (
        <AlertDialog open onOpenChange={(open) => !open && setRemoving(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect {removing.descriptor.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Its saved configuration is removed.
                {removing.config.priority === 1
                  ? sendOrder(configs.filter((c) => c.channel === removing.config.channel)).length >
                    1
                    ? ' The first fallback becomes the default provider.'
                    : ` This workspace goes back to the platform's default ${MESSAGE_CHANNELS[removing.config.channel].noun} service.`
                  : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant='destructive' onClick={() => void handleRemove(removing)}>
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

'use client';

import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  LOGIN_METHOD_BY_PROVIDER,
  LOGIN_METHODS,
  OAUTH_CREDENTIAL_FIELDS,
  OAUTH_MASTER_METHOD,
  OAUTH_MASTER_PROVIDER,
  REGISTRATION_IDENTIFIERS,
  type LoginMethodDefinition,
  type RegistrationIdentifier
} from '../constants/login-methods';

// Static version: all switch state lives in this component — nothing is sent
// to the backend yet. When the oauth config API is ready, replace these maps
// with `oauthConfigsQueryOptions` + the mutations in `../api/mutations`.
const INITIAL_ENABLED: Record<string, boolean> = Object.fromEntries(
  LOGIN_METHODS.map((method) => [method.provider, method.kind === 'builtin'])
);

// Only the top-level rows are sortable; OAuth providers stay nested under the
// third-party row and move together with it.
const DEFAULT_ROW_ORDER: string[] = [
  ...LOGIN_METHODS.filter((method) => method.kind === 'builtin').map((method) => method.provider),
  OAUTH_MASTER_PROVIDER
];

function MethodRow({
  method,
  enabled,
  configured = false,
  showStatus = true,
  identifierStatus,
  dragHandle,
  onToggle
}: {
  method: LoginMethodDefinition;
  enabled: boolean;
  configured?: boolean;
  /** Hide the credentials badge — used by the third-party master row. */
  showStatus?: boolean;
  /** Registration role of this method — shown as a Required / Optional badge. */
  identifierStatus?: 'primary' | 'optional';
  /** Sortable handle — only top-level rows get one. */
  dragHandle?: ReactNode;
  onToggle: (method: LoginMethodDefinition, enabled: boolean) => void;
}) {
  return (
    <div className='flex items-center gap-3 py-3'>
      {dragHandle}
      <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-md'>
        <method.icon className='size-4' />
      </div>
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm font-medium'>{method.name}</span>
          {identifierStatus && (
            <Badge variant={identifierStatus === 'primary' ? 'default' : 'outline'}>
              {identifierStatus === 'primary' ? 'Required' : 'Optional'}
            </Badge>
          )}
          {showStatus && method.kind === 'oauth' && (
            <Badge variant={configured ? 'outline' : 'secondary'}>
              {configured ? 'Configured' : 'No credentials'}
            </Badge>
          )}
        </div>
        <p className='text-muted-foreground text-xs'>{method.description}</p>
      </div>
      <Switch
        checked={enabled}
        aria-label={`${enabled ? 'Disable' : 'Enable'} ${method.name} sign-in`}
        onCheckedChange={(checked) => onToggle(method, checked)}
      />
    </div>
  );
}

function SortableMethodRow({
  method,
  enabled,
  configured,
  showStatus,
  identifierStatus,
  children,
  onToggle
}: {
  method: LoginMethodDefinition;
  enabled: boolean;
  configured?: boolean;
  showStatus?: boolean;
  identifierStatus?: 'primary' | 'optional';
  children?: ReactNode;
  onToggle: (method: LoginMethodDefinition, enabled: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: method.provider
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // The dragged source (row + expanded providers) is hidden and replaced by
      // the compact DragOverlay preview, so the tall block never floats around.
      className={cn(isDragging && 'opacity-0')}
    >
      <MethodRow
        method={method}
        enabled={enabled}
        configured={configured}
        showStatus={showStatus}
        identifierStatus={identifierStatus}
        dragHandle={
          <button
            type='button'
            aria-label={`Reorder ${method.name}`}
            className='text-muted-foreground hover:text-foreground -ml-1 flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md transition-colors active:cursor-grabbing'
            {...attributes}
            {...listeners}
          >
            <Icons.gripVertical className='size-4' />
          </button>
        }
        onToggle={onToggle}
      />
      {children}
    </div>
  );
}

function OAuthConfigDialog({
  method,
  onClose,
  onSave
}: {
  method: LoginMethodDefinition;
  onClose: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const fields = OAUTH_CREDENTIAL_FIELDS[method.provider] ?? [];
  const [values, setValues] = useState<Record<string, string>>({});
  const complete = fields.every((field) => (values[field.name] ?? '').trim().length > 0);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {method.name} sign-in</DialogTitle>
          <DialogDescription>
            Enter the OAuth credentials for {method.name}. Once saved, {method.name} sign-in is
            enabled for this workspace.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-3 py-4'>
          {fields.map((field) => (
            <div key={field.name} className='grid gap-1.5'>
              <Label htmlFor={`oauth-${method.provider}-${field.name}`}>{field.label}</Label>
              <Input
                id={`oauth-${method.provider}-${field.name}`}
                type={field.secret ? 'password' : 'text'}
                value={values[field.name] ?? ''}
                placeholder={field.placeholder}
                autoComplete='off'
                onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type='button' variant='outline' />}>Cancel</DialogClose>
          <Button type='button' disabled={!complete} onClick={() => onSave(values)}>
            Save &amp; enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LoginMethodsSettings() {
  // Enabled flags per provider; the third-party master row uses 'oauth'.
  const [enabledMethods, setEnabledMethods] = useState<Record<string, boolean>>({
    ...INITIAL_ENABLED,
    [OAUTH_MASTER_PROVIDER]: false
  });
  // Provider credentials collected from the dialog (kept in memory only).
  const [credentials, setCredentials] = useState<Record<string, Record<string, string>>>({});
  const [configMethod, setConfigMethod] = useState<LoginMethodDefinition | null>(null);
  // Exactly one method is the primary registration identifier (required and
  // unique at signup). The others stay optional.
  const [primaryIdentifier, setPrimaryIdentifier] = useState<RegistrationIdentifier>('password');
  // Drag-to-reorder for the top-level rows (providers + third-party switch).
  const [rowOrder, setRowOrder] = useState<string[]>(DEFAULT_ROW_ORDER);
  // Id + width of the row being dragged, used by the overlay preview.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | undefined>(undefined);

  const sensors = useSensors(
    // A small activation distance keeps the row switches clickable.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const masterEnabled = enabledMethods[OAUTH_MASTER_PROVIDER] ?? false;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setActiveWidth(event.active.rect.current.initial?.width);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setRowOrder((prev) => {
      const from = prev.indexOf(String(active.id));
      const to = prev.indexOf(String(over.id));
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
  }

  function handleToggle(method: LoginMethodDefinition, enabled: boolean) {
    // Master switch — its only job is revealing/hiding the provider list.
    if (method.provider === OAUTH_MASTER_PROVIDER) {
      setEnabledMethods((prev) => ({ ...prev, [method.provider]: enabled }));
      return;
    }

    // The primary identifier can't be turned off — pick another primary first.
    if (!enabled && method.provider === primaryIdentifier) {
      toast.error(
        `${method.name} is the primary registration identifier. Choose another primary first.`
      );
      return;
    }

    // OAuth providers need credentials before they can be turned on.
    if (method.kind === 'oauth' && enabled && !credentials[method.provider]) {
      setConfigMethod(method);
      return;
    }

    setEnabledMethods((prev) => ({ ...prev, [method.provider]: enabled }));
    toast.success(`${method.name} sign-in ${enabled ? 'enabled' : 'disabled'}`);
  }

  function handleSaveCredentials(values: Record<string, string>) {
    if (!configMethod) return;
    setCredentials((prev) => ({ ...prev, [configMethod.provider]: values }));
    setEnabledMethods((prev) => ({ ...prev, [configMethod.provider]: true }));
    toast.success(`${configMethod.name} sign-in enabled`);
    setConfigMethod(null);
  }

  const oauthMethods = LOGIN_METHODS.filter((method) => method.kind === 'oauth');
  // Row definitions in the user-defined order; the third-party row uses the
  // synthetic master definition.
  const orderedRows = rowOrder
    .map((provider) =>
      provider === OAUTH_MASTER_PROVIDER
        ? OAUTH_MASTER_METHOD
        : LOGIN_METHOD_BY_PROVIDER.get(provider)
    )
    .filter((method): method is LoginMethodDefinition => Boolean(method));

  // Row rendered in the drag preview — never the expanded provider list.
  const activeMethod =
    activeId === OAUTH_MASTER_PROVIDER
      ? OAUTH_MASTER_METHOD
      : activeId
        ? LOGIN_METHOD_BY_PROVIDER.get(activeId)
        : undefined;

  function identifierStatusOf(provider: string): 'primary' | 'optional' | undefined {
    if (provider === OAUTH_MASTER_PROVIDER) return undefined;
    return provider === primaryIdentifier ? 'primary' : 'optional';
  }

  return (
    <div className='max-w-3xl space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.login className='size-5' />
            Login methods
          </CardTitle>
          <CardDescription>
            Choose which sign-in methods are available to users in this workspace. Drag the handle
            to reorder them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Primary registration identifier — required and unique at signup.
              Options belonging to a disabled method can't be selected. */}
          <section className='border-b pb-4'>
            <h3 className='text-sm font-medium'>Registration identity</h3>
            <p className='text-muted-foreground mt-0.5 text-xs'>
              The primary identifier is required and unique at signup. Other enabled methods can be
              used to sign in or verify.
            </p>
            <RadioGroup
              value={primaryIdentifier}
              onValueChange={(value) => setPrimaryIdentifier(value as RegistrationIdentifier)}
              className='mt-3 flex flex-wrap gap-x-6 gap-y-2'
            >
              {REGISTRATION_IDENTIFIERS.map((option) => (
                <Field key={option.provider} orientation='horizontal' className='w-auto'>
                  <RadioGroupItem
                    value={option.provider}
                    id={`primary-${option.provider}`}
                    disabled={!enabledMethods[option.provider]}
                  />
                  <FieldLabel htmlFor={`primary-${option.provider}`} className='font-normal'>
                    {option.label}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
            {REGISTRATION_IDENTIFIERS.some((option) => !enabledMethods[option.provider]) && (
              <p className='text-muted-foreground mt-2 text-xs'>
                Enable a method below to use it as the primary identifier.
              </p>
            )}
          </section>

          {/* Sortable top-level rows: built-in methods + the third-party master
              switch. OAuth providers are nested under the master row and move
              together with it. */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={rowOrder} strategy={verticalListSortingStrategy}>
              <div className='divide-y'>
                {orderedRows.map((method) => {
                  const isMaster = method.provider === OAUTH_MASTER_PROVIDER;
                  return (
                    <SortableMethodRow
                      key={method.provider}
                      method={method}
                      enabled={enabledMethods[method.provider] ?? false}
                      configured={Boolean(credentials[method.provider])}
                      showStatus={!isMaster}
                      identifierStatus={identifierStatusOf(method.provider)}
                      onToggle={handleToggle}
                    >
                      {isMaster && masterEnabled && (
                        <div className='divide-y border-t pl-22'>
                          {oauthMethods.map((oauthMethod) => (
                            <MethodRow
                              key={oauthMethod.provider}
                              method={oauthMethod}
                              enabled={enabledMethods[oauthMethod.provider] ?? false}
                              configured={Boolean(credentials[oauthMethod.provider])}
                              onToggle={handleToggle}
                            />
                          ))}
                        </div>
                      )}
                    </SortableMethodRow>
                  );
                })}
              </div>
            </SortableContext>

            {/* Compact preview: shows only the dragged row, so an expanded
                provider list never distorts the layout while dragging. */}
            <DragOverlay dropAnimation={null}>
              {activeMethod && (
                <div
                  className='bg-card rounded-lg border shadow-lg'
                  style={activeWidth ? { width: activeWidth } : undefined}
                >
                  <MethodRow
                    method={activeMethod}
                    enabled={enabledMethods[activeMethod.provider] ?? false}
                    showStatus={activeMethod.provider !== OAUTH_MASTER_PROVIDER}
                    identifierStatus={identifierStatusOf(activeMethod.provider)}
                    onToggle={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      <div className={cn('text-muted-foreground flex items-start gap-2 px-1 text-xs')}>
        <Icons.info className='mt-0.5 size-4 shrink-0' />
        <p>
          Third-party providers need their credentials before they can be enabled. This screen is
          currently static — the master switch and provider flags are not persisted yet.
        </p>
      </div>

      {configMethod && (
        <OAuthConfigDialog
          method={configMethod}
          onClose={() => setConfigMethod(null)}
          onSave={handleSaveCredentials}
        />
      )}
    </div>
  );
}

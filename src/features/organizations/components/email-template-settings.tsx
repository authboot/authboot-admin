'use client';

import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Icons } from '@/components/icons';
import { StatusBadge } from '@/components/status-badge';
import { cn } from '@/lib/utils';
import {
  EMAIL_PREVIEW_RECIPIENT,
  EMAIL_SUBJECT_MAX,
  EMAIL_TEMPLATES,
  type EmailTemplateDefinition,
  type EmailTemplateId
} from '../constants/email-templates';
import {
  buildEmailPreviewDocument,
  defaultEmailTemplateContent,
  getEmailTemplateIssues,
  hasEmailTemplateIssues,
  isSameEmailTemplateContent,
  renderEmailTemplate,
  usedVariables,
  variableToken,
  type EmailTemplateContent
} from '../utils/email-template';

type EmailTemplateSettingsProps = {
  /** Opens the delivery settings, where SMS templates are referenced. */
  onManageDelivery: () => void;
};

/** A template the workspace has changed from the built-in default. */
type CustomTemplate = EmailTemplateContent & { updatedAt: Date };

type CustomTemplates = Partial<Record<EmailTemplateId, CustomTemplate>>;

type TemplateField = keyof EmailTemplateContent;

type PreviewDevice = 'desktop' | 'mobile';

function TemplateRow({
  template,
  custom,
  onEdit
}: {
  template: EmailTemplateDefinition;
  custom: CustomTemplate | undefined;
  onEdit: () => void;
}) {
  const subject = custom?.subject ?? template.defaultSubject;

  return (
    <div className='flex flex-wrap items-start gap-3 px-3 py-3'>
      <div className='bg-muted flex size-9 shrink-0 items-center justify-center rounded-md'>
        <template.icon className='text-muted-foreground size-4' />
      </div>
      <div className='min-w-0 flex-1 basis-56 space-y-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <p className='text-sm font-medium'>{template.name}</p>
          {custom ? (
            <StatusBadge status='customized' tone='success' label='Customized' />
          ) : (
            <StatusBadge status='default' tone='neutral' label='Default' />
          )}
        </div>
        <p className='text-muted-foreground text-xs'>{template.trigger}</p>
        <p className='truncate text-xs'>
          <span className='text-muted-foreground'>Subject: </span>
          {subject}
        </p>
        {custom && (
          <p className='text-muted-foreground text-xs'>
            Edited {format(custom.updatedAt, 'MMM d, yyyy, h:mm a')}
          </p>
        )}
      </div>
      <Button
        type='button'
        variant='outline'
        size='sm'
        aria-label={`Edit the ${template.name} email`}
        onClick={onEdit}
      >
        <Icons.edit />
        Edit
      </Button>
    </div>
  );
}

function FieldIssues({ id, issues }: { id: string; issues: string[] }) {
  if (issues.length === 0) return null;
  return (
    <ul id={id} role='alert' className='text-destructive space-y-1 text-xs'>
      {issues.map((issue) => (
        <li key={issue}>{issue}</li>
      ))}
    </ul>
  );
}

/** The variables of a template; a click inserts one at the cursor. */
function VariableList({
  template,
  content,
  target,
  onInsert
}: {
  template: EmailTemplateDefinition;
  content: EmailTemplateContent;
  target: TemplateField;
  onInsert: (name: string) => void;
}) {
  const used = usedVariables(`${content.subject}\n${content.body}`);

  return (
    <div className='space-y-2'>
      <div>
        <p className='text-sm font-medium'>Variables</p>
        <p className='text-muted-foreground text-xs'>
          Replaced with the real value when the email is sent. Click one to insert it into the{' '}
          {target} at the cursor.
        </p>
      </div>
      <ul className='divide-y rounded-lg border'>
        {template.variables.map((variable) => (
          <li key={variable.name} className='flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2'>
            <button
              type='button'
              // Keeps the caret in the subject / body while the chip is clicked.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onInsert(variable.name)}
              aria-label={`Insert ${variableToken(variable.name)} into the ${target}`}
              className='bg-muted hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 rounded-md border px-1.5 py-0.5 font-mono text-xs outline-none focus-visible:ring-3'
            >
              {variableToken(variable.name)}
            </button>
            <p className='text-muted-foreground min-w-0 flex-1 basis-40 text-xs'>
              {variable.description}
              {variable.required && (
                <span className='text-foreground font-medium'> Required in the body.</span>
              )}
            </p>
            {used.has(variable.name) && (
              <span className='text-muted-foreground flex items-center gap-1 text-xs'>
                <Icons.check className='size-3.5' />
                Used
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The draft as a recipient would see it, with sample values for the variables. */
function TemplatePreview({
  template,
  content
}: {
  template: EmailTemplateDefinition;
  content: EmailTemplateContent;
}) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const subject = renderEmailTemplate(content.subject, template, 'subject').trim();
  const body = renderEmailTemplate(content.body, template, 'body');

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between gap-2'>
        <div>
          <p className='text-sm font-medium'>Preview</p>
          <p className='text-muted-foreground text-xs'>Variables are filled with sample values.</p>
        </div>
        <ToggleGroup
          variant='outline'
          size='sm'
          spacing={0}
          value={[device]}
          onValueChange={(next) => {
            // Ignore the "nothing selected" state a second click would produce.
            const value = next[0];
            if (value === 'desktop' || value === 'mobile') setDevice(value);
          }}
          aria-label='Preview width'
        >
          <ToggleGroupItem value='desktop' aria-label='Desktop width'>
            <Icons.laptop />
          </ToggleGroupItem>
          <ToggleGroupItem value='mobile' aria-label='Phone width'>
            <Icons.mobile />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div
        className={cn(
          'bg-background mx-auto w-full overflow-hidden rounded-lg border shadow-xs',
          device === 'mobile' && 'max-w-[375px]'
        )}
      >
        <div className='space-y-0.5 border-b px-4 py-3'>
          <p className='text-sm font-semibold break-words'>{subject || 'Subject line'}</p>
          <p className='text-muted-foreground text-xs'>To: {EMAIL_PREVIEW_RECIPIENT}</p>
        </div>
        {/*
          The body is admin-written HTML, so it is shown in a fully sandboxed
          frame: scripts cannot run and it has no access to the dashboard.
        */}
        <iframe
          title={`${template.name} email preview`}
          sandbox=''
          srcDoc={buildEmailPreviewDocument(body)}
          className='block h-96 w-full bg-white'
        />
      </div>
    </div>
  );
}

function TestEmailDialog({
  template,
  onClose
}: {
  template: EmailTemplateDefinition;
  onClose: () => void;
}) {
  const [recipient, setRecipient] = useState('');

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const target = recipient.trim();
    if (!target) return;
    // Static version: there is no send endpoint yet, so say so instead of
    // claiming an email went out.
    toast.info(`Preview only — no email was sent to ${target}.`);
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit} className='grid gap-4'>
          <DialogHeader>
            <DialogTitle>Send a test email</DialogTitle>
            <DialogDescription>
              Sends this draft of the {template.name} email, filled with sample values, so you can
              check it in a real inbox. The draft is not saved.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-1.5'>
            <Label htmlFor={`test-template-${template.id}-recipient`}>Recipient email</Label>
            <Input
              id={`test-template-${template.id}-recipient`}
              type='email'
              value={recipient}
              placeholder='you@example.com'
              autoComplete='off'
              required
              onChange={(event) => setRecipient(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button type='button' variant='outline' />}>Cancel</DialogClose>
            <Button type='submit' disabled={!recipient.trim()}>
              Send test
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TemplateEditorSheet({
  template,
  initial,
  onClose,
  onSave
}: {
  template: EmailTemplateDefinition;
  /** What is saved now: the customized template, or the default. */
  initial: EmailTemplateContent;
  onClose: () => void;
  onSave: (content: EmailTemplateContent) => void;
}) {
  const [draft, setDraft] = useState<EmailTemplateContent>(initial);
  // Where a clicked variable goes: the field that last had the cursor.
  const [target, setTarget] = useState<TemplateField>('body');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const formId = `email-template-${template.id}-form`;
  const subjectId = `email-template-${template.id}-subject`;
  const bodyId = `email-template-${template.id}-body`;

  const issues = getEmailTemplateIssues(template, draft);
  const invalid = hasEmailTemplateIssues(issues);
  const dirty = !isSameEmailTemplateContent(draft, initial);
  const isDefault = isSameEmailTemplateContent(draft, defaultEmailTemplateContent(template));

  function handleInsert(name: string) {
    const element = target === 'subject' ? subjectRef.current : bodyRef.current;
    const current = draft[target];
    const start = element?.selectionStart ?? current.length;
    const end = element?.selectionEnd ?? current.length;
    const token = variableToken(name);
    setDraft({ ...draft, [target]: current.slice(0, start) + token + current.slice(end) });

    // Put the caret right after the inserted variable once the value is in.
    const caret = start + token.length;
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(caret, caret);
    });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (invalid || !dirty) return;
    onSave(draft);
  }

  function handleCloseRequest() {
    if (dirty) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  }

  return (
    <Sheet open onOpenChange={(open) => !open && handleCloseRequest()}>
      <SheetContent className='gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-5xl'>
        <SheetHeader className='border-b pr-12'>
          <SheetTitle>Edit the {template.name} email</SheetTitle>
          <SheetDescription>{template.trigger}</SheetDescription>
        </SheetHeader>

        {/* One scrolling column on small screens; editor and preview side by side on large. */}
        <div className='grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden'>
          <form id={formId} onSubmit={handleSubmit} className='space-y-5 p-4 lg:overflow-y-auto'>
            <div className='grid gap-1.5'>
              <div className='flex items-baseline justify-between gap-2'>
                <Label htmlFor={subjectId}>Subject</Label>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {draft.subject.length}/{EMAIL_SUBJECT_MAX}
                </span>
              </div>
              <Input
                ref={subjectRef}
                id={subjectId}
                value={draft.subject}
                autoComplete='off'
                aria-invalid={issues.subject.length > 0}
                aria-describedby={issues.subject.length > 0 ? `${subjectId}-issues` : undefined}
                onFocus={() => setTarget('subject')}
                onChange={(event) => setDraft({ ...draft, subject: event.target.value })}
              />
              <FieldIssues id={`${subjectId}-issues`} issues={issues.subject} />
            </div>

            <div className='grid gap-1.5'>
              <Label htmlFor={bodyId}>Body (HTML)</Label>
              <Textarea
                ref={bodyRef}
                id={bodyId}
                value={draft.body}
                spellCheck={false}
                aria-invalid={issues.body.length > 0}
                aria-describedby={`${bodyId}-${issues.body.length > 0 ? 'issues' : 'description'}`}
                className='max-h-96 min-h-56 font-mono text-xs leading-relaxed md:text-xs'
                onFocus={() => setTarget('body')}
                onChange={(event) => setDraft({ ...draft, body: event.target.value })}
              />
              {issues.body.length > 0 ? (
                <FieldIssues id={`${bodyId}-issues`} issues={issues.body} />
              ) : (
                <p id={`${bodyId}-description`} className='text-muted-foreground text-xs'>
                  Mail clients ignore scripts and most external stylesheets, so keep to simple
                  markup with inline styles.
                </p>
              )}
            </div>

            <VariableList
              template={template}
              content={draft}
              target={target}
              onInsert={handleInsert}
            />
          </form>

          <div className='bg-muted/40 border-t p-4 lg:overflow-y-auto lg:border-t-0 lg:border-l'>
            <TemplatePreview template={template} content={draft} />
          </div>
        </div>

        <SheetFooter className='flex-row flex-wrap items-center justify-between border-t'>
          <Button
            type='button'
            variant='ghost'
            disabled={isDefault}
            onClick={() => setDraft(defaultEmailTemplateContent(template))}
          >
            <Icons.restore />
            Restore default
          </Button>
          <div className='flex flex-wrap items-center gap-2'>
            <Button
              type='button'
              variant='outline'
              disabled={invalid}
              onClick={() => setTestOpen(true)}
            >
              <Icons.send />
              Send test
            </Button>
            <Button type='submit' form={formId} disabled={invalid || !dirty}>
              Save template
            </Button>
          </div>
        </SheetFooter>

        {testOpen && <TestEmailDialog template={template} onClose={() => setTestOpen(false)} />}

        <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
              <AlertDialogDescription>
                The {template.name} email has changes that are not saved. Closing the editor now
                loses them.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep editing</AlertDialogCancel>
              <AlertDialogAction variant='destructive' onClick={onClose}>
                Discard changes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}

/**
 * The emails this workspace sends to its users. Each one starts on the
 * built-in default and can be given its own subject and HTML body, built from
 * the variables the server fills in when it sends that email.
 *
 * Static version — templates live in this component; nothing is sent to the
 * backend yet.
 */
export function EmailTemplateSettings({ onManageDelivery }: EmailTemplateSettingsProps) {
  const [custom, setCustom] = useState<CustomTemplates>({});
  const [editing, setEditing] = useState<EmailTemplateDefinition | null>(null);

  function handleSave(template: EmailTemplateDefinition, content: EmailTemplateContent) {
    const restored = isSameEmailTemplateContent(content, defaultEmailTemplateContent(template));
    // A template saved with the default wording is simply not customized.
    setCustom((prev) => ({
      ...prev,
      [template.id]: restored ? undefined : { ...content, updatedAt: new Date() }
    }));
    setEditing(null);
    toast.success(
      restored
        ? `${template.name} email restored to the default`
        : `${template.name} email template saved`
    );
  }

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.mail className='size-5' />
            Email templates
          </CardTitle>
          <CardDescription>
            The emails this workspace sends to its users. Change the subject and content of each
            one, or leave it on the default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='divide-y rounded-lg border'>
            {EMAIL_TEMPLATES.map((template) => (
              <TemplateRow
                key={template.id}
                template={template}
                custom={custom[template.id]}
                onEdit={() => setEditing(template)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className='text-muted-foreground flex items-start gap-2 px-1 text-xs'>
        <Icons.phone className='mt-0.5 size-4 shrink-0' />
        <p>
          SMS wording is not edited here. SMS providers only send text they have approved, so it
          comes from the template whose code is set on the provider in{' '}
          <button
            type='button'
            className='text-foreground font-medium underline underline-offset-2'
            onClick={onManageDelivery}
          >
            Delivery
          </button>
          .
        </p>
      </div>

      {editing && (
        <TemplateEditorSheet
          key={editing.id}
          template={editing}
          initial={custom[editing.id] ?? defaultEmailTemplateContent(editing)}
          onClose={() => setEditing(null)}
          onSave={(content) => handleSave(editing, content)}
        />
      )}
    </div>
  );
}

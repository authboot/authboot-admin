'use client';

import { useState } from 'react';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';
import { createUserNoteMutation, deleteUserNoteMutation } from '../api/mutations';
import { userNotesOptions } from '../api/queries';

type UserNotesProps = {
  userId: number;
};

/**
 * Internal admin notes for a user. Notes are visible to admins only and are
 * never surfaced in the user's own profile.
 */
export function UserNotes({ userId }: UserNotesProps) {
  const { data } = useSuspenseQuery(userNotesOptions(userId));
  const notes = data?.notes ?? [];
  const [body, setBody] = useState('');

  const createMutation = useMutation(createUserNoteMutation);
  const deleteMutation = useMutation(deleteUserNoteMutation);

  const handleAdd = async () => {
    const value = body.trim();
    if (!value) return;

    try {
      await createMutation.mutateAsync({ id: userId, values: { body: value } });
      setBody('');
      toast.success('Note added');
    } catch {
      toast.error("Couldn't add the note. Try again.");
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await deleteMutation.mutateAsync({ id: userId, noteId });
      toast.success('Note deleted');
    } catch {
      toast.error("Couldn't delete the note. Try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icons.post className='size-5' />
          Notes
          {notes.length > 0 && <Badge variant='secondary'>{notes.length}</Badge>}
        </CardTitle>
        <CardDescription>
          Shared context for admins — visible internally only, never to the user.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Composer */}
        <div className='space-y-2'>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault();
                void handleAdd();
              }
            }}
            placeholder='Add context for other admins — decisions, follow-ups, verification steps…'
            rows={3}
            maxLength={1000}
          />
          <div className='flex items-center justify-between gap-3'>
            <p className='text-muted-foreground text-xs'>{body.length}/1000 · ⌘/Ctrl + Enter</p>
            <LoadingButton
              type='button'
              size='sm'
              onClick={() => void handleAdd()}
              loading={createMutation.isPending}
              disabled={!body.trim()}
            >
              <Icons.add className='size-4' />
              Add note
            </LoadingButton>
          </div>
        </div>

        {/* Note list */}
        {notes.length === 0 ? (
          <div className='text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm'>
            <Icons.post className='size-6' />
            <p>No notes yet. Add the first one above.</p>
          </div>
        ) : (
          <div className='divide-y rounded-lg border'>
            {notes.map((note) => (
              <article key={note.id} className='flex gap-3 px-4 py-3'>
                <div className='bg-muted flex size-8 shrink-0 items-center justify-center rounded-full'>
                  <Icons.account className='size-4' />
                </div>
                <div className='min-w-0 flex-1 space-y-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-sm font-medium'>{note.author || 'Admin'}</span>
                    <span className='text-muted-foreground text-xs'>
                      {formatDate(note.created_at, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className='text-sm break-words whitespace-pre-wrap'>{note.body}</p>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='text-muted-foreground hover:text-destructive h-8 w-8 shrink-0 p-0'
                  aria-label='Delete note'
                  disabled={deleteMutation.isPending}
                  onClick={() => void handleDelete(note.id)}
                >
                  <Icons.trash className='size-4' />
                </Button>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function UserNotesSkeleton() {
  return (
    <div className='bg-card space-y-3 rounded-xl p-4 ring-1 ring-foreground/10'>
      <Skeleton className='h-5 w-32' />
      <Skeleton className='h-4 w-64 max-w-full' />
      <Skeleton className='h-20 w-full rounded-lg' />
      <Skeleton className='h-16 w-full rounded-lg' />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDate } from '@/lib/format';
import type {
  LegalDocType,
  LegalPublishInput,
  LegalVersion,
  LegalVersionStatus
} from '../constants/legal-documents';
import { legalVersionsQueryOptions } from '../api/queries';
import { LegalPublishSheet } from './legal-publish-sheet';

function statusVariant(status: LegalVersionStatus) {
  if (status === 'active') return 'default' as const;
  if (status === 'scheduled') return 'outline' as const;
  return 'secondary' as const;
}

function statusLabel(status: LegalVersionStatus) {
  return status === 'active' ? 'Active' : status === 'scheduled' ? 'Scheduled' : 'Retired';
}

function formatUnix(value: number) {
  if (!value) return '—';
  return formatDate(new Date(value * 1000), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * One legal document: the currently effective version plus its immutable
 * version history, fetched from the backend. Publishing only appends —
 * published rows have no edit or delete action.
 */
export function LegalDocumentPanel({
  docType,
  title,
  description,
  versionsQuery,
  onPublish,
  publishing = false
}: {
  docType: LegalDocType;
  title: string;
  description: string;
  versionsQuery: ReturnType<typeof legalVersionsQueryOptions>;
  onPublish: (input: LegalPublishInput) => void;
  publishing?: boolean;
}) {
  const [publishingSheetOpen, setPublishingSheetOpen] = useState(false);
  const { data } = useSuspenseQuery(versionsQuery);
  const versions: LegalVersion[] = data?.versions ?? [];

  // Newest first for the history table; the active version drives the top card.
  const sorted = versions.toSorted((a, b) => b.version - a.version);
  const active = versions.find((version) => version.status === 'active') ?? sorted[0];
  const scheduled = versions.find((version) => version.status === 'scheduled');

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='space-y-1'>
              <CardTitle className='flex items-center gap-2'>
                <Icons.shieldCheck className='size-5' />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <Button size='sm' onClick={() => setPublishingSheetOpen(true)}>
              <Icons.add className='size-4' />
              Publish new version
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {active ? (
            <>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline'>v{active.version}</Badge>
                <Badge variant={statusVariant(active.status)}>{statusLabel(active.status)}</Badge>
                {active.has_snapshot && <Badge variant='secondary'>Snapshot archived</Badge>}
              </div>

              <a
                href={active.url}
                target='_blank'
                rel='noreferrer'
                className='text-primary inline-flex max-w-full items-center gap-1 truncate text-sm hover:underline'
              >
                {active.url}
                <Icons.chevronRight className='size-3.5 shrink-0' />
              </a>

              <div className='grid gap-4 sm:grid-cols-3'>
                <div>
                  <p className='text-muted-foreground text-xs'>Effective since</p>
                  <p className='text-sm font-medium'>{formatUnix(active.effective_at)}</p>
                </div>
                <div>
                  <p className='text-muted-foreground text-xs'>Published by</p>
                  <p className='text-sm font-medium'>{active.published_by || '—'}</p>
                </div>
                <div className='min-w-0'>
                  <p className='text-muted-foreground text-xs'>Content hash</p>
                  <p className='truncate font-mono text-xs'>{active.content_hash || '—'}</p>
                </div>
              </div>

              <div className='bg-muted/40 rounded-lg border p-3'>
                <p className='text-muted-foreground text-xs'>Change summary</p>
                <p className='text-sm'>{active.changelog}</p>
              </div>

              {scheduled && (
                <div className='flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm'>
                  <Icons.clock className='text-muted-foreground mt-0.5 size-4 shrink-0' />
                  <p>
                    <span className='font-medium'>v{scheduled.version}</span> is scheduled to take
                    effect on {formatUnix(scheduled.effective_at)}.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className='text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm'>
              <Icons.shieldCheck className='size-6' />
              <p>No version published yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icons.clock className='size-5' />
            Version history
          </CardTitle>
          <CardDescription>
            Published versions are immutable. Older versions stay available for audit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-hidden rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective</TableHead>
                  <TableHead>Change summary</TableHead>
                  <TableHead>Snapshot</TableHead>
                  <TableHead>Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <p className='text-muted-foreground py-6 text-center text-sm'>
                        No versions published yet.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  sorted.map((version, index) => {
                    // The next newer version's effective date ends this one's range.
                    const nextEffectiveAt = index > 0 ? sorted[index - 1].effective_at : null;

                    return (
                      <TableRow key={version.version}>
                        <TableCell className='font-medium whitespace-nowrap'>
                          v{version.version}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(version.status)}>
                            {statusLabel(version.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
                          {formatUnix(version.effective_at)}
                          {nextEffectiveAt ? ` → ${formatUnix(nextEffectiveAt)}` : ' → now'}
                        </TableCell>
                        <TableCell className='max-w-64'>
                          <p className='truncate text-sm' title={version.changelog}>
                            {version.changelog}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            by {version.published_by || '—'} · {formatUnix(version.published_at)}
                          </p>
                        </TableCell>
                        <TableCell>
                          {version.has_snapshot ? (
                            <Badge variant='outline' title={version.content_hash}>
                              Archived
                            </Badge>
                          ) : (
                            <span className='text-muted-foreground text-xs'>—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <a
                            href={version.url}
                            target='_blank'
                            rel='noreferrer'
                            className='text-primary text-sm hover:underline'
                          >
                            Open
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {publishingSheetOpen && (
        <LegalPublishSheet
          title={title}
          submitting={publishing}
          onClose={() => setPublishingSheetOpen(false)}
          onPublish={onPublish}
        />
      )}
    </div>
  );
}

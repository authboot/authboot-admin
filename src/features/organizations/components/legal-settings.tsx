'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { type LegalDocType, type LegalPublishInput } from '../constants/legal-documents';
import { organizationKeys, legalVersionsQueryOptions } from '../api/queries';
import { publishLegalVersion } from '../api/legal-service';
import { LegalDocumentPanel } from './legal-document-panel';

/**
 * Organization-level legal documents (Terms of Service / Privacy Policy),
 * backed by the authboot-server legal versions API. Each document is an
 * immutable version history: publishing appends a new version and retires the
 * previously active one (handled server-side inside one transaction).
 */
export function LegalSettings() {
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: ({ doc, input }: { doc: LegalDocType; input: LegalPublishInput }) =>
      publishLegalVersion(doc, input),
    onSuccess: (data, variables) => {
      // The publish response carries the appended version; refetch the
      // history (status flips: previous active → retired) from the backend.
      queryClient.invalidateQueries({ queryKey: organizationKeys.legal(variables.doc) });
      const label = variables.doc === 'terms' ? 'Terms of Service' : 'Privacy Policy';
      const verb =
        new Date(variables.input.effectiveAt).getTime() > Date.now() ? 'scheduled' : 'published';
      const version = data.version?.version;
      toast.success(version ? `v${version} of ${label} ${verb}` : `${label} ${verb}`);
    },
    onError: (error, variables) => {
      const label = variables.doc === 'terms' ? 'Terms of Service' : 'Privacy Policy';
      toast.error(`Failed to publish ${label}: ${(error as Error).message}`);
    }
  });

  function handlePublish(doc: LegalDocType, input: LegalPublishInput) {
    publishMutation.mutate({ doc, input });
  }

  return (
    <div className='max-w-4xl space-y-4'>
      <Tabs defaultValue='terms' className='gap-4'>
        <TabsList variant='line'>
          <TabsTrigger value='terms'>
            <Icons.page />
            Terms of Service
          </TabsTrigger>
          <TabsTrigger value='privacy'>
            <Icons.lock />
            Privacy Policy
          </TabsTrigger>
        </TabsList>

        <TabsContent value='terms'>
          <LegalDocumentPanel
            docType='terms'
            title='Terms of Service'
            description='Public link shown when users are asked to accept the terms.'
            versionsQuery={legalVersionsQueryOptions('terms')}
            onPublish={(input) => handlePublish('terms', input)}
            publishing={publishMutation.isPending && publishMutation.variables?.doc === 'terms'}
          />
        </TabsContent>

        <TabsContent value='privacy'>
          <LegalDocumentPanel
            docType='privacy'
            title='Privacy Policy'
            description='Public link describing how this workspace handles personal data.'
            versionsQuery={legalVersionsQueryOptions('privacy')}
            onPublish={(input) => handlePublish('privacy', input)}
            publishing={publishMutation.isPending && publishMutation.variables?.doc === 'privacy'}
          />
        </TabsContent>
      </Tabs>

      <div className='text-muted-foreground flex items-start gap-2 px-1 text-xs'>
        <Icons.info className='mt-0.5 size-4 shrink-0' />
        <p>
          Published versions are immutable and stay in the history for audit. When &quot;archive
          snapshot&quot; is on, an immutable copy with a SHA-256 hash is stored server-side as
          compliance evidence.
        </p>
      </div>
    </div>
  );
}

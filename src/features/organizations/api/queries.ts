import { queryOptions } from '@tanstack/react-query';
import {
  getOrganizations,
  getOrganizationById,
  getOAuthConfigs,
  getMessageProviderCatalog,
  getMessageProviderConfigs,
  getEmailTemplateCatalog,
  getEmailTemplateOverrides,
  getOrganizationSettings
} from './service';
import { listLegalVersions } from './legal-service';
import type { LegalDocType } from '../constants/legal-documents';
import type { MessageChannelId, Organization, OrganizationFilters } from './types';

export type { Organization };

export const organizationKeys = {
  all: ['organizations'] as const,
  list: (filters: OrganizationFilters) => [...organizationKeys.all, 'list', filters] as const,
  detail: (id: number) => [...organizationKeys.all, 'detail', id] as const,
  oauth: (id: number) => [...organizationKeys.all, 'oauth', id] as const,
  settings: (id: number) => [...organizationKeys.all, 'settings', id] as const,
  // Message delivery: the provider catalog is global (backend registry); the
  // saved configs are per organization.
  messageProviderCatalog: (channel?: MessageChannelId) =>
    ['message-providers', 'catalog', channel ?? 'all'] as const,
  messageProviders: (id: number) => [...organizationKeys.all, 'message-providers', id] as const,
  emailTemplateCatalog: () => ['email-templates', 'catalog'] as const,
  emailTemplates: (id: number) => [...organizationKeys.all, 'email-templates', id] as const,
  // Legal documents: immutable version history per doc type, served by the
  // backend. Publishing invalidates ['organizations','legal'] wholesale.
  legal: (docType: LegalDocType) => [...organizationKeys.all, 'legal', docType] as const
};

export const legalVersionsQueryOptions = (docType: LegalDocType) =>
  queryOptions({
    queryKey: organizationKeys.legal(docType),
    queryFn: () => listLegalVersions(docType)
  });

export const organizationsQueryOptions = (filters: OrganizationFilters) =>
  queryOptions({
    queryKey: organizationKeys.list(filters),
    queryFn: () => getOrganizations(filters)
  });

export const organizationQueryOptions = (id: number) =>
  queryOptions({
    queryKey: organizationKeys.detail(id),
    queryFn: () => getOrganizationById(id)
  });

export const oauthConfigsQueryOptions = (id: number) =>
  queryOptions({
    queryKey: organizationKeys.oauth(id),
    queryFn: () => getOAuthConfigs(id)
  });

export const messageProviderCatalogQueryOptions = (channel?: MessageChannelId) =>
  queryOptions({
    queryKey: organizationKeys.messageProviderCatalog(channel),
    queryFn: () => getMessageProviderCatalog(channel),
    // The catalog only changes with a backend deploy.
    staleTime: 5 * 60 * 1000
  });

export const messageProvidersQueryOptions = (id: number) =>
  queryOptions({
    queryKey: organizationKeys.messageProviders(id),
    queryFn: () => getMessageProviderConfigs(id)
  });

export const emailTemplateCatalogQueryOptions = () =>
  queryOptions({
    queryKey: organizationKeys.emailTemplateCatalog(),
    queryFn: () => getEmailTemplateCatalog(),
    staleTime: 5 * 60 * 1000
  });

export const emailTemplatesQueryOptions = (id: number) =>
  queryOptions({
    queryKey: organizationKeys.emailTemplates(id),
    queryFn: () => getEmailTemplateOverrides(id)
  });

export const organizationSettingsQueryOptions = (id: number) =>
  queryOptions({
    queryKey: organizationKeys.settings(id),
    queryFn: () => getOrganizationSettings(id)
  });

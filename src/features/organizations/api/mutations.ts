import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  leaveOrganization,
  setOAuthConfig,
  deleteOAuthConfig,
  setMessageProvider,
  setMessageProviderPriority,
  deleteMessageProvider,
  setEmailTemplate,
  resetEmailTemplate,
  sendTestEmailTemplate,
  updateOrganizationSettings
} from './service';
import { organizationKeys } from './queries';
import type {
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
  OAuthConfigPayload,
  MessageChannelId,
  SetMessageProviderPayload,
  SetMessageProviderPriorityPayload,
  SetEmailTemplatePayload,
  SendTestEmailTemplatePayload,
  OrganizationSettings
} from './types';

export const createOrganizationMutation = mutationOptions({
  mutationFn: (data: CreateOrganizationPayload) => createOrganization(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.all });
  }
});

export const updateOrganizationMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: number; values: UpdateOrganizationPayload }) =>
    updateOrganization(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.all });
  }
});

export const deleteOrganizationMutation = mutationOptions({
  mutationFn: (id: number) => deleteOrganization(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.all });
  }
});

export const leaveOrganizationMutation = mutationOptions({
  mutationFn: (id: number) => leaveOrganization(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.all });
  }
});

export const setOAuthConfigMutation = mutationOptions({
  mutationFn: ({
    id,
    provider,
    values
  }: {
    id: number;
    provider: string;
    values: OAuthConfigPayload;
  }) => setOAuthConfig(id, provider, values),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.oauth(id) });
  }
});

export const deleteOAuthConfigMutation = mutationOptions({
  mutationFn: ({ id, provider }: { id: number; provider: string }) =>
    deleteOAuthConfig(id, provider),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.oauth(id) });
  }
});

// ---- Message delivery providers ----

export const setMessageProviderMutation = mutationOptions({
  mutationFn: ({
    id,
    channel,
    provider,
    values
  }: {
    id: number;
    channel: MessageChannelId;
    provider: string;
    values: SetMessageProviderPayload;
  }) => setMessageProvider(id, channel, provider, values),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.messageProviders(id) });
  }
});

export const setMessageProviderPriorityMutation = mutationOptions({
  mutationFn: ({
    id,
    channel,
    values
  }: {
    id: number;
    channel: MessageChannelId;
    values: SetMessageProviderPriorityPayload;
  }) => setMessageProviderPriority(id, channel, values),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.messageProviders(id) });
  }
});

export const deleteMessageProviderMutation = mutationOptions({
  mutationFn: ({
    id,
    channel,
    provider
  }: {
    id: number;
    channel: MessageChannelId;
    provider: string;
  }) => deleteMessageProvider(id, channel, provider),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.messageProviders(id) });
  }
});

// ---- Email templates ----

export const setEmailTemplateMutation = mutationOptions({
  mutationFn: ({
    id,
    templateId,
    values
  }: {
    id: number;
    templateId: string;
    values: SetEmailTemplatePayload;
  }) => setEmailTemplate(id, templateId, values),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.emailTemplates(id) });
  }
});

export const resetEmailTemplateMutation = mutationOptions({
  mutationFn: ({ id, templateId }: { id: number; templateId: string }) =>
    resetEmailTemplate(id, templateId),
  onSuccess: (_data, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: organizationKeys.emailTemplates(id) });
  }
});

export const sendTestEmailTemplateMutation = mutationOptions({
  mutationFn: ({
    id,
    templateId,
    values
  }: {
    id: number;
    templateId: string;
    values: SendTestEmailTemplatePayload;
  }) => sendTestEmailTemplate(id, templateId, values)
});

// ---- Organization settings ----

export const updateOrganizationSettingsMutation = mutationOptions({
  mutationFn: ({ id, settings }: { id: number; settings: OrganizationSettings }) =>
    updateOrganizationSettings(id, settings),
  onSuccess: (data, { id }) => {
    // The response is the effective settings; seed the cache so the UI does not
    // flash the old state before the refetch lands.
    getQueryClient().setQueryData(organizationKeys.settings(id), data);
  }
});

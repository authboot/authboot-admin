import { Icons, type Icon } from '@/components/icons';

// ============================================================
// Message delivery — channels and cloud providers
// ============================================================
// Verification codes go out by email or SMS. Each channel can be connected to
// one of the supported cloud providers; when none is connected the workspace
// keeps sending through the platform's default service.
//
// The provider catalog comes from the backend registry
// (GET /api/message-providers); this file only holds channel presentation.

export type MessageChannel = 'email' | 'sms';

/** Display name of the default provider per channel, or null for the platform default. */
export type ActiveProviders = Record<MessageChannel, string | null>;

export type MessageChannelDefinition = {
  channel: MessageChannel;
  /** Lowercase noun used in sentences: "test email", "sending SMS". */
  noun: string;
  icon: Icon;
  deliveryTitle: string;
  deliveryDescription: string;
  recipientLabel: string;
  recipientPlaceholder: string;
  recipientInputType: 'email' | 'tel';
};

export const MESSAGE_CHANNELS: Record<MessageChannel, MessageChannelDefinition> = {
  email: {
    channel: 'email',
    noun: 'email',
    icon: Icons.mail,
    deliveryTitle: 'Email delivery',
    deliveryDescription: 'Sends verification codes and account emails from your own domain.',
    recipientLabel: 'Recipient email',
    recipientPlaceholder: 'you@example.com',
    recipientInputType: 'email'
  },
  sms: {
    channel: 'sms',
    noun: 'SMS',
    icon: Icons.phone,
    deliveryTitle: 'SMS delivery',
    deliveryDescription: 'Sends verification codes by text message under your own signature.',
    recipientLabel: 'Recipient phone number',
    recipientPlaceholder: '+8613800000000',
    recipientInputType: 'tel'
  }
};

export const MESSAGE_CHANNEL_ORDER: MessageChannel[] = ['email', 'sms'];

/**
 * Visual mark for a provider, keyed by the vendor prefix of its backend id
 * (`aliyun_dm` → aliyun, `tencent_ses` → tencent, `resend`, `smtp`).
 */
export type MessageProviderVendor = 'aliyun' | 'tencent' | 'resend' | 'smtp' | 'other';

export const MESSAGE_VENDORS: Record<MessageProviderVendor, { mark: string; className: string }> = {
  aliyun: {
    mark: 'A',
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
  },
  tencent: {
    mark: 'T',
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  resend: {
    mark: 'R',
    className: 'bg-zinc-900/10 text-zinc-900 dark:bg-zinc-100/10 dark:text-zinc-100'
  },
  smtp: {
    mark: '@',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  },
  other: {
    mark: '?',
    className: 'bg-muted text-muted-foreground'
  }
};

export function vendorOf(providerId: string): MessageProviderVendor {
  const prefix = providerId.split('_')[0];
  return prefix in MESSAGE_VENDORS ? (prefix as MessageProviderVendor) : 'other';
}

/** The setting shown under a connected provider's name, by preference. */
export const SUMMARY_FIELDS = ['from', 'sender_address', 'host', 'sign_name'] as const;

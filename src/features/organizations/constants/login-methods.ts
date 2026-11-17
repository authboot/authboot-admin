import { Icons, type Icon } from '@/components/icons';

export type LoginMethodKind = 'builtin' | 'oauth';

export type LoginMethodDefinition = {
  // Stored as the `provider` key of the organization OAuth config. Email/phone
  // are not OAuth vendors, but the config API is a generic (org, provider,
  // enabled, settings) store, so they use it as an org-level flag until the
  // backend enforces them at login time.
  provider: string;
  name: string;
  description: string;
  kind: LoginMethodKind;
  icon: Icon;
};

export const LOGIN_METHODS: LoginMethodDefinition[] = [
  {
    // Account + password sign-in — a separate built-in flag from email.
    provider: 'password',
    name: 'Account password',
    description: 'Sign in with the account name and password',
    kind: 'builtin',
    icon: Icons.lock
  },
  {
    provider: 'email',
    name: 'Email',
    description: 'Sign in with email address and password / verification code',
    kind: 'builtin',
    icon: Icons.mail
  },
  {
    provider: 'phone',
    name: 'Phone number',
    description: 'Sign in with a mobile number and verification code',
    kind: 'builtin',
    icon: Icons.phone
  },
  {
    provider: 'wechat',
    name: 'WeChat',
    description: 'WeChat OAuth (QR code / in-app authorization)',
    kind: 'oauth',
    icon: Icons.wechat
  },
  {
    provider: 'alipay',
    name: 'Alipay',
    description: 'Alipay OAuth authorization',
    kind: 'oauth',
    icon: Icons.alipay
  },
  {
    provider: 'google',
    name: 'Google',
    description: 'Google OAuth authorization',
    kind: 'oauth',
    icon: Icons.google
  },
  {
    provider: 'github',
    name: 'GitHub',
    description: 'GitHub OAuth authorization',
    kind: 'oauth',
    icon: Icons.github
  },
  {
    provider: 'apple',
    name: 'Apple',
    description: 'Sign in with Apple',
    kind: 'oauth',
    icon: Icons.apple
  }
];

export const LOGIN_METHOD_BY_PROVIDER = new Map(
  LOGIN_METHODS.map((method) => [method.provider, method])
);

// Primary registration identifier options. Exactly one is selected: it is
// required (and unique) at signup, while the other enabled methods stay
// optional and can be used for sign-in or verification.
export const REGISTRATION_IDENTIFIERS = [
  { provider: 'password', label: 'Account password', icon: Icons.lock },
  { provider: 'email', label: 'Email', icon: Icons.mail },
  { provider: 'phone', label: 'Phone number', icon: Icons.phone }
] as const;

export type RegistrationIdentifier = (typeof REGISTRATION_IDENTIFIERS)[number]['provider'];

// Provider key used to persist the third-party authorization master switch as
// an org-level flag — same generic (org, provider, enabled, settings) store
// the built-in email/phone flags use, so no extra backend surface is needed.
export const OAUTH_MASTER_PROVIDER = 'oauth';

// Row definition for the master switch. Rendered with the same anatomy as the
// built-in email/phone rows; the OAuth providers below are nested under it and
// only revealed once this switch is on.
export const OAUTH_MASTER_METHOD: LoginMethodDefinition = {
  provider: OAUTH_MASTER_PROVIDER,
  name: 'Third-party authorization',
  description: 'Sign in with WeChat, Alipay, Google, Apple, GitHub and other OAuth providers',
  kind: 'oauth',
  icon: Icons.shieldCheck
};

export type OAuthCredentialField = {
  /** Settings key sent to the backend (OAuthProviderConfig.settings). */
  name: string;
  label: string;
  placeholder?: string;
  /** Render as a password input. */
  secret?: boolean;
};

// Required credential inputs per OAuth provider. Collected when a provider is
// enabled for the first time; the backend masks these values on read.
export const OAUTH_CREDENTIAL_FIELDS: Record<string, OAuthCredentialField[]> = {
  wechat: [
    { name: 'app_id', label: 'App ID', placeholder: 'wx…' },
    { name: 'app_secret', label: 'App Secret', secret: true, placeholder: 'Enter the app secret' }
  ],
  alipay: [
    { name: 'app_id', label: 'App ID' },
    { name: 'private_key', label: 'App Private Key', secret: true }
  ],
  google: [
    { name: 'client_id', label: 'Client ID' },
    { name: 'client_secret', label: 'Client Secret', secret: true }
  ],
  github: [
    { name: 'client_id', label: 'Client ID' },
    { name: 'client_secret', label: 'Client Secret', secret: true }
  ],
  apple: [
    { name: 'client_id', label: 'Services ID' },
    { name: 'team_id', label: 'Team ID' },
    { name: 'key_id', label: 'Key ID' },
    { name: 'private_key', label: 'Private Key', secret: true }
  ]
};

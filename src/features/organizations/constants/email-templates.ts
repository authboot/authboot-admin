import { Icons, type Icon } from '@/components/icons';

// ============================================================
// Email templates — the emails a workspace sends to its users
// ============================================================
// One entry per email the backend sends. The defaults below are the wording
// the server uses today, so an untouched template previews exactly what users
// already receive.
//
// Variables use Go template syntax ({{.Name}}), the same syntax as the
// server's built-in templates in authboot-server/biz/mw/email/templates, and
// each list holds only the values the server has at hand when it sends that
// email. Once the backend exposes its templates, load this catalog from there.

export type EmailTemplateId = 'verification_code' | 'invitation' | 'security_alert';

export type EmailTemplateVariable = {
  /** Used as {{.Name}} in the subject and body. */
  name: string;
  description: string;
  /** Stands in for the real value in the preview and in test emails. */
  sample: string;
  /** The email is useless without it, so the body must contain it. */
  required?: boolean;
};

export type EmailTemplateDefinition = {
  id: EmailTemplateId;
  name: string;
  /** When the email is sent, in one sentence. */
  trigger: string;
  icon: Icon;
  variables: EmailTemplateVariable[];
  defaultSubject: string;
  /** HTML. */
  defaultBody: string;
};

export const EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  {
    id: 'verification_code',
    name: 'Verification code',
    trigger:
      'Sent when a user asks for an email code to sign in, sign up, bind an email address, reset a password or delete their account.',
    icon: Icons.key,
    variables: [
      {
        name: 'Code',
        description: 'The 6-digit one-time code.',
        sample: '482913',
        required: true
      },
      {
        name: 'ExpireMinutes',
        description: 'How many minutes the code stays valid.',
        sample: '5'
      }
    ],
    defaultSubject: '你的验证码',
    defaultBody: '<p>你的验证码是 <b>{{.Code}}</b>，{{.ExpireMinutes}} 分钟内有效。</p>'
  },
  {
    id: 'invitation',
    name: 'Workspace invitation',
    trigger: 'Sent to the email address an admin invites to join this workspace.',
    icon: Icons.userPlus,
    variables: [
      {
        name: 'Token',
        description: 'The invitation token the invitee uses to accept.',
        sample: 'b7f3c1e09a4d4f2e8c6a1d5e3f9b2a70',
        required: true
      },
      {
        name: 'ExpireAt',
        description: 'When the invitation expires.',
        sample: '2026-12-02 09:30:00'
      }
    ],
    defaultSubject: 'You have been invited to join an organization',
    defaultBody: [
      '<p>你好，</p>',
      '<p>你被邀请加入一个组织。请使用以下邀请令牌完成接受：</p>',
      '<p><b>{{.Token}}</b></p>',
      '<p>该邀请将于 {{.ExpireAt}} 过期。</p>'
    ].join('\n')
  },
  {
    id: 'security_alert',
    name: 'Sign-in security alert',
    trigger:
      'Sent to a user when a sign-in security event, such as a sign-in from a new device, is recorded on their account.',
    icon: Icons.shieldCheck,
    variables: [
      {
        name: 'Kind',
        description: 'The type of security event.',
        sample: 'new_device'
      },
      {
        name: 'Time',
        description: 'When the sign-in happened (UTC).',
        sample: '2026-11-25T09:58:00Z'
      },
      {
        name: 'IP',
        description: 'The IP address the sign-in came from.',
        sample: '203.0.113.24'
      },
      {
        name: 'Location',
        description: 'The approximate location of that IP address.',
        sample: 'Shanghai, China'
      }
    ],
    defaultSubject: '账户登录安全提醒',
    defaultBody: [
      '<p>您的账户出现登录安全事件（{{.Kind}}）。</p>',
      '<p>时间：{{.Time}}<br>IP：{{.IP}}<br>近似地区：{{.Location}}</p>',
      '<p>请登录 App 安全中心查看并确认是否本人；如非本人，请撤销会话并修改密码。</p>',
      '<p>本提醒为登录后风险提示，不代表已阻止登录。</p>'
    ].join('\n')
  }
];

export const EMAIL_SUBJECT_MAX = 120;
export const EMAIL_BODY_MAX = 20000;

/** The address shown as the recipient in the preview. */
export const EMAIL_PREVIEW_RECIPIENT = 'alex@example.com';

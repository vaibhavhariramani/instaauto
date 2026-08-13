export const InstagramAccountStatus = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  EXPIRED: 'EXPIRED',
  ERROR: 'ERROR',
} as const;
export type InstagramAccountStatus =
  (typeof InstagramAccountStatus)[keyof typeof InstagramAccountStatus];

export const MatchType = {
  EXACT: 'EXACT',
  CONTAINS: 'CONTAINS',
  ANY_KEYWORD: 'ANY_KEYWORD',
} as const;
export type MatchType = (typeof MatchType)[keyof typeof MatchType];

export const MessageStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
} as const;
export type MessageStatus = (typeof MessageStatus)[keyof typeof MessageStatus];

export const MessageDirection = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
} as const;
export type MessageDirection = (typeof MessageDirection)[keyof typeof MessageDirection];

export const TemplateCategory = {
  FREE_GUIDE: 'FREE_GUIDE',
  COURSE_LINK: 'COURSE_LINK',
  DISCOUNT_CODE: 'DISCOUNT_CODE',
  CONSULTATION: 'CONSULTATION',
  LEAD_MAGNET: 'LEAD_MAGNET',
  CUSTOM: 'CUSTOM',
} as const;
export type TemplateCategory = (typeof TemplateCategory)[keyof typeof TemplateCategory];

export const NotificationType = {
  AUTOMATION_STARTED: 'AUTOMATION_STARTED',
  INSTAGRAM_DISCONNECTED: 'INSTAGRAM_DISCONNECTED',
  DM_FAILED: 'DM_FAILED',
  DM_SENT: 'DM_SENT',
  WEBHOOK_RECEIVED: 'WEBHOOK_RECEIVED',
  KEYWORD_MATCHED: 'KEYWORD_MATCHED',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const SubscriptionPlan = {
  STARTER: 'STARTER',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SubscriptionStatus = {
  TRIALING: 'TRIALING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED',
  NONE: 'NONE',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const Theme = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  SYSTEM: 'SYSTEM',
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

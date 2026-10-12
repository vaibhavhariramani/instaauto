import type {
  InstagramAccountStatus,
  MatchType,
  MessageDirection,
  MessageStatus,
  NotificationType,
  SubscriptionPlan,
  SubscriptionStatus,
  TemplateCategory,
  Theme,
} from './enums.js';

export interface ApiErrorBody {
  error: {
    message: string;
    code?: string;
    fields?: Record<string, string>;
  };
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  timezone: string;
  theme: Theme;
  onboardingCompleted: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionCurrentPeriodEnd: string | null;
  emailOnDmFailed: boolean;
  emailOnDisconnect: boolean;
  emailWeeklyDigest: boolean;
  isAdmin: boolean;
  createdAt: string;
}

export interface InstagramAccountDto {
  id: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
  followersCount: number;
  status: InstagramAccountStatus;
  connectedAt: string;
  lastSyncedAt: string | null;
  tokenExpiresAt: string | null;
}

export interface ReelDto {
  id: string;
  thumbnailUrl: string;
  permalink: string;
  caption: string;
  commentsCount: number;
  likeCount: number;
  timestamp: string;
}

export interface RecentCommentDto {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  mediaId: string;
  mediaPermalink: string;
  mediaThumbnailUrl: string;
}

export interface AutomationDto {
  id: string;
  name: string;
  instagramAccountId: string;
  reelId: string;
  reelThumbnailUrl: string | null;
  reelPermalink: string | null;
  reelCaption: string | null;
  triggerKeywords: string[];
  matchType: MatchType;
  replyMessage: string;
  templateId: string | null;
  publicReplyEnabled: boolean;
  publicReplyMessage: string | null;
  dmOncePerUser: boolean;
  ignoreCreatorComments: boolean;
  isActive: boolean;
  totalTriggers: number;
  totalDMsSent: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateDto {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDto {
  id: string;
  automationId: string;
  automationName: string;
  recipientUsername: string;
  content: string;
  status: MessageStatus;
  errorMessage: string | null;
  retryCount: number;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ConversationDto {
  id: string;
  participantIgUserId: string;
  participantUsername: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageDirection: MessageDirection | null;
}

export interface DirectMessageDto {
  id: string;
  direction: MessageDirection;
  content: string;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DashboardStatsDto {
  totalAutomations: number;
  activeAutomations: number;
  messagesSent: number;
  commentsDetected: number;
  successRate: number;
  messagesTrend: { date: string; sent: number; failed: number }[];
  recentActivity: NotificationDto[];
}

export interface AnalyticsDto {
  range: 'daily' | 'weekly' | 'monthly';
  series: { label: string; commentsDetected: number; dmsSent: number; dmsFailed: number }[];
  topKeywords: { keyword: string; count: number }[];
  mostActiveReel: { reelId: string; thumbnailUrl: string | null; triggerCount: number } | null;
  conversionRate: number;
  totalCommentsDetected: number;
  totalDmsSent: number;
}

export interface AuthTokensDto {
  accessToken: string;
  user: UserDto;
}

// ─── Admin ──────────────────────────────────────────────────────────────
// Deliberately excludes anything secret or credential-shaped (no access tokens, no password
// hashes, no Stripe secret-side fields) - see apps/functions/src/utils/adminMappers.ts.

export interface AdminUserListItemDto {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  isAdmin: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  connectedAccountsCount: number;
  activeAutomationsCount: number;
  dmsSentThisPeriod: number;
}

export interface AdminUserListResponseDto {
  items: AdminUserListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminConnectedAccountDto {
  id: string;
  username: string;
  status: InstagramAccountStatus;
  connectedAt: string;
  followersCount: number;
}

export interface AdminAutomationSummaryDto {
  id: string;
  name: string;
  isActive: boolean;
  totalTriggers: number;
  totalDMsSent: number;
}

export interface AdminUsageDayDto {
  date: string;
  commentsDetected: number;
  dmsSent: number;
  dmsFailed: number;
}

export interface AdminInvoiceDto {
  id: string;
  amountPaid: number;
  currency: string;
  status: string | null;
  createdAt: string;
  hostedInvoiceUrl: string | null;
}

export interface AdminAuditEventDto {
  action: string;
  createdAt: string;
}

export interface AdminActionLogDto {
  action: string;
  reason: string;
  actorEmail: string;
  createdAt: string;
}

export interface AdminUserDetailDto {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
  isAdmin: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionCurrentPeriodStart: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  hasStripeCustomer: boolean;
  connectedAccounts: AdminConnectedAccountDto[];
  automations: AdminAutomationSummaryDto[];
  dmsSentThisPeriod: number;
  dmLimitPerMonth: number;
  usageHistory: AdminUsageDayDto[];
  recentInvoices: AdminInvoiceDto[];
  recentAuditEvents: AdminAuditEventDto[];
  recentAdminActions: AdminActionLogDto[];
}

export interface AdminDashboardDto {
  totalUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  planCounts: Record<SubscriptionPlan, number>;
  activePaidSubscriptions: number;
  pastDueSubscriptions: number;
  totalActiveAutomations: number;
  dmsSentLast30Days: number;
  /** Sum of priceMonthly across ACTIVE/TRIALING paid plans - an estimate, not verified revenue. */
  estimatedMrr: number;
}

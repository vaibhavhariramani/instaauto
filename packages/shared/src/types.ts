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

export interface AiReplySettingsDto {
  instagramAccountId: string;
  enabled: boolean;
  personaPrompt: string | null;
  serverConfigured: boolean;
}

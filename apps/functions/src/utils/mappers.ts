import type {
  Automation,
  Conversation,
  DirectMessage,
  InstagramAccount,
  Message,
  Notification,
  Template,
  User,
} from '@prisma/client';
import type {
  AutomationDto,
  ConversationDto,
  DirectMessageDto,
  InstagramAccountDto,
  MessageDto,
  NotificationDto,
  TemplateDto,
  UserDto,
} from '@instaauto/shared';

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    timezone: user.timezone,
    theme: user.theme,
    onboardingCompleted: user.onboardingCompleted,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
    emailOnDmFailed: user.emailOnDmFailed,
    emailOnDisconnect: user.emailOnDisconnect,
    emailWeeklyDigest: user.emailWeeklyDigest,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toInstagramAccountDto(account: InstagramAccount): InstagramAccountDto {
  return {
    id: account.id,
    username: account.username,
    name: account.name,
    profilePictureUrl: account.profilePictureUrl,
    followersCount: account.followersCount,
    status: account.status,
    connectedAt: account.connectedAt.toISOString(),
    lastSyncedAt: account.lastSyncedAt?.toISOString() ?? null,
    tokenExpiresAt: account.tokenExpiresAt?.toISOString() ?? null,
  };
}

export function toAutomationDto(automation: Automation): AutomationDto {
  return {
    id: automation.id,
    name: automation.name,
    instagramAccountId: automation.instagramAccountId,
    reelId: automation.reelId,
    reelThumbnailUrl: automation.reelThumbnailUrl,
    reelPermalink: automation.reelPermalink,
    reelCaption: automation.reelCaption,
    triggerKeywords: automation.triggerKeywords,
    matchType: automation.matchType,
    replyMessage: automation.replyMessage,
    templateId: automation.templateId,
    publicReplyEnabled: automation.publicReplyEnabled,
    publicReplyMessage: automation.publicReplyMessage,
    dmOncePerUser: automation.dmOncePerUser,
    ignoreCreatorComments: automation.ignoreCreatorComments,
    isActive: automation.isActive,
    totalTriggers: automation.totalTriggers,
    totalDMsSent: automation.totalDMsSent,
    createdAt: automation.createdAt.toISOString(),
    updatedAt: automation.updatedAt.toISOString(),
  };
}

export function toTemplateDto(template: Template): TemplateDto {
  return {
    id: template.id,
    name: template.name,
    category: template.category,
    content: template.content,
    isFavorite: template.isFavorite,
    usageCount: template.usageCount,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

export function toMessageDto(message: Message & { automation: { name: string } }): MessageDto {
  return {
    id: message.id,
    automationId: message.automationId,
    automationName: message.automation.name,
    recipientUsername: message.recipientUsername,
    content: message.content,
    status: message.status,
    errorMessage: message.errorMessage,
    retryCount: message.retryCount,
    sentAt: message.sentAt?.toISOString() ?? null,
    deliveredAt: message.deliveredAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
  };
}

export function toNotificationDto(n: Notification): NotificationDto {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    metadata: (n.metadata as Record<string, unknown> | null) ?? null,
    createdAt: n.createdAt.toISOString(),
  };
}

export function toConversationDto(c: Conversation): ConversationDto {
  return {
    id: c.id,
    participantIgUserId: c.participantIgUserId,
    participantUsername: c.participantUsername,
    lastMessageAt: c.lastMessageAt.toISOString(),
    lastMessagePreview: c.lastMessagePreview,
    lastMessageDirection: c.lastMessageDirection,
  };
}

export function toDirectMessageDto(m: DirectMessage): DirectMessageDto {
  return {
    id: m.id,
    direction: m.direction,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

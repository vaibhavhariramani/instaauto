import { z } from 'zod';
import { MatchType, TemplateCategory, Theme } from './enums.js';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const googleLoginSchema = z.object({
  idToken: z.string().min(10, 'Missing Google ID token'),
});
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long');

export const emailRegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: passwordSchema,
  name: z.string().trim().min(1, 'Name is required').max(80),
});
export type EmailRegisterInput = z.infer<typeof emailRegisterSchema>;

export const emailLoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;

export const replyToCommentSchema = z.object({
  message: z.string().trim().min(1, 'Reply message is required').max(2200, 'Reply is too long'),
});
export type ReplyToCommentInput = z.infer<typeof replyToCommentSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  timezone: z.string().min(1).max(100).optional(),
  theme: z.nativeEnum(Theme).optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const notificationPrefsSchema = z.object({
  emailOnDmFailed: z.boolean().optional(),
  emailOnDisconnect: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
});
export type NotificationPrefsInput = z.infer<typeof notificationPrefsSchema>;

const keywordSchema = z
  .string()
  .trim()
  .min(1, 'Keyword cannot be empty')
  .max(60, 'Keyword is too long')
  .toLowerCase();

const automationBaseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  instagramAccountId: z.string().min(1, 'Select an Instagram account'),
  reelId: z.string().min(1, 'Select a Reel'),
  reelThumbnailUrl: z.string().url().optional().nullable(),
  reelPermalink: z.string().url().optional().nullable(),
  reelCaption: z.string().max(2200).optional().nullable(),
  triggerKeywords: z
    .array(keywordSchema)
    .min(1, 'Add at least one trigger keyword')
    .max(20, 'Too many keywords'),
  matchType: z.nativeEnum(MatchType).default(MatchType.CONTAINS),
  replyMessage: z
    .string()
    .trim()
    .min(1, 'DM reply message is required')
    .max(1000, 'Message is too long (max 1000 characters)'),
  templateId: z.string().optional().nullable(),
  publicReplyEnabled: z.boolean().default(false),
  publicReplyMessage: z
    .string()
    .trim()
    .max(2200, 'Reply is too long (max 2200 characters)')
    .optional()
    .nullable(),
  dmOncePerUser: z.boolean().default(true),
  ignoreCreatorComments: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

// Saving publicReplyEnabled=true with no publicReplyMessage used to be silently accepted — the
// backend just skips posting a public reply when the message is empty, with no error surfaced
// anywhere, so the toggle looked "on" but never actually did anything until re-saved with text.
function requirePublicReplyMessageWhenEnabled(data: {
  publicReplyEnabled?: boolean;
  publicReplyMessage?: string | null;
}) {
  return (
    !data.publicReplyEnabled ||
    Boolean(data.publicReplyMessage && data.publicReplyMessage.trim().length > 0)
  );
}
const publicReplyRefinement = {
  message: 'Add a public reply message, or turn off "Reply to the comment publicly"',
  path: ['publicReplyMessage'],
};

export const automationSchema = automationBaseSchema.refine(
  requirePublicReplyMessageWhenEnabled,
  publicReplyRefinement,
);
export type AutomationInput = z.infer<typeof automationSchema>;
export const updateAutomationSchema = automationBaseSchema
  .partial()
  .refine(requirePublicReplyMessageWhenEnabled, publicReplyRefinement);
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;

export const templateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  category: z.nativeEnum(TemplateCategory).default(TemplateCategory.CUSTOM),
  content: z.string().trim().min(1, 'Content is required').max(1000),
  isFavorite: z.boolean().default(false),
});
export type TemplateInput = z.infer<typeof templateSchema>;
export const updateTemplateSchema = templateSchema.partial();
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export const messagesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ALL', 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING']).default('ALL'),
  automationId: z.string().optional(),
});
export type MessagesQuery = z.infer<typeof messagesQuerySchema>;

export const analyticsQuerySchema = z.object({
  range: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

export const instagramOAuthCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});
export type InstagramOAuthCallbackInput = z.infer<typeof instagramOAuthCallbackSchema>;

export const createCheckoutSessionSchema = z.object({
  plan: z.enum(['STARTER', 'PRO', 'BUSINESS']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
});
export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;

export const simulateCommentSchema = z.object({
  automationId: z.string().min(1),
  commenterUsername: z.string().trim().min(1).max(60).default('curious_follower'),
  commentText: z.string().trim().min(1).max(300),
});
export type SimulateCommentInput = z.infer<typeof simulateCommentSchema>;

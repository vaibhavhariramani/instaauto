import 'dotenv/config';
import {
  PrismaClient,
  MatchType,
  MessageStatus,
  TemplateCategory,
  NotificationType,
  InstagramAccountStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { encryptSecret } from '../src/lib/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const user = await prisma.user.upsert({
    where: { email: 'demo@instaauto.app' },
    update: {},
    create: {
      email: 'demo@instaauto.app',
      name: 'Demo Creator',
      googleId: 'demo-google-id-000',
      avatarUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=demo-creator',
      timezone: 'America/New_York',
      onboardingCompleted: true,
      subscriptionPlan: SubscriptionPlan.PRO,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      subscriptionCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const igAccount = await prisma.instagramAccount.upsert({
    where: { instagramBusinessId: 'mock-ig-business-17841400000000000' },
    update: {},
    create: {
      userId: user.id,
      instagramBusinessId: 'mock-ig-business-17841400000000000',
      facebookPageId: 'mock-fb-page-100000000000000',
      username: 'demo.creator',
      name: 'Demo Creator',
      profilePictureUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=demo-creator-ig',
      followersCount: 24831,
      accessTokenEncrypted: encryptSecret('mock-long-lived-token'),
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: InstagramAccountStatus.CONNECTED,
    },
  });

  const templates = await Promise.all(
    [
      {
        name: 'Free Guide Delivery',
        category: TemplateCategory.FREE_GUIDE,
        content:
          "Hey {{username}} 👋 Thanks for commenting! Here's the free guide you asked for: https://example.com/guide",
        isFavorite: true,
        usageCount: 128,
      },
      {
        name: 'Course Waitlist',
        category: TemplateCategory.COURSE_LINK,
        content:
          "Hi {{username}}! 🎉 You're on the list for the course. Grab early-bird pricing here: https://example.com/course",
        isFavorite: false,
        usageCount: 54,
      },
      {
        name: '20% Discount Code',
        category: TemplateCategory.DISCOUNT_CODE,
        content: 'Hey {{username}}, use code REEL20 for 20% off — https://example.com/shop',
        isFavorite: true,
        usageCount: 92,
      },
      {
        name: 'Book a Consultation',
        category: TemplateCategory.CONSULTATION,
        content: "Hi {{username}}! Let's chat — book a free 15-min call here: https://example.com/book",
        isFavorite: false,
        usageCount: 17,
      },
    ].map((t) => prisma.template.create({ data: { ...t, userId: user.id } })),
  );

  const automation = await prisma.automation.create({
    data: {
      userId: user.id,
      instagramAccountId: igAccount.id,
      name: 'Free Guide — Reel #1',
      reelId: 'mock-reel-18000000000000001',
      reelThumbnailUrl: 'https://picsum.photos/seed/reel1/400/700',
      reelPermalink: 'https://instagram.com/reel/mock1',
      reelCaption: 'The one habit that changed everything for my business 👇 comment "send me" for the guide',
      triggerKeywords: ['send me', 'guide'],
      matchType: MatchType.CONTAINS,
      replyMessage: templates[0]!.content,
      templateId: templates[0]!.id,
      totalTriggers: 342,
      totalDMsSent: 318,
    },
  });

  const automation2 = await prisma.automation.create({
    data: {
      userId: user.id,
      instagramAccountId: igAccount.id,
      name: 'Course Launch — Reel #2',
      reelId: 'mock-reel-18000000000000002',
      reelThumbnailUrl: 'https://picsum.photos/seed/reel2/400/700',
      reelPermalink: 'https://instagram.com/reel/mock2',
      reelCaption: 'My full course is finally here 🚀 comment "course" to get on the waitlist',
      triggerKeywords: ['course', 'waitlist'],
      matchType: MatchType.ANY_KEYWORD,
      replyMessage: templates[1]!.content,
      templateId: templates[1]!.id,
      totalTriggers: 156,
      totalDMsSent: 149,
    },
  });

  const usernames = [
    'traveler_jane', 'mike.codes', 'sunny.days22', 'bookwormbella', 'growth_guy',
    'wanderlust_kim', 'fit_with_farah', 'techie_tom', 'artsyamara', 'chef.carlos',
  ];

  const messageRows = [];
  for (let i = 0; i < 60; i += 1) {
    const isFailed = i % 11 === 0;
    const automationForRow = i % 2 === 0 ? automation : automation2;
    const daysAgo = Math.floor(i / 3);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - i * 60000);
    messageRows.push({
      userId: user.id,
      automationId: automationForRow.id,
      instagramAccountId: igAccount.id,
      recipientIgUserId: `mock-user-${i}`,
      recipientUsername: usernames[i % usernames.length]!,
      content: automationForRow.replyMessage.replace('{{username}}', usernames[i % usernames.length]!),
      status: isFailed ? MessageStatus.FAILED : MessageStatus.DELIVERED,
      errorMessage: isFailed ? 'Recipient has messaging restricted to non-followers.' : null,
      retryCount: isFailed ? 2 : 0,
      sentAt: isFailed ? null : createdAt,
      deliveredAt: isFailed ? null : createdAt,
      createdAt,
    });
  }
  await prisma.message.createMany({ data: messageRows });

  const today = new Date();
  const analyticsRows = Array.from({ length: 30 }).map((_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (29 - i));
    date.setHours(0, 0, 0, 0);
    const commentsDetected = 10 + Math.round(Math.random() * 25);
    const dmsFailed = Math.round(commentsDetected * 0.06);
    return {
      userId: user.id,
      date,
      commentsDetected,
      dmsSent: commentsDetected - dmsFailed,
      dmsFailed,
      uniqueUsersReached: Math.round(commentsDetected * 0.92),
    };
  });
  await prisma.analyticsDaily.createMany({ data: analyticsRows, skipDuplicates: true });

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: NotificationType.AUTOMATION_STARTED,
        title: 'Automation activated',
        message: `"${automation.name}" is now live and watching for comments.`,
      },
      {
        userId: user.id,
        type: NotificationType.KEYWORD_MATCHED,
        title: 'Keyword matched',
        message: `@${usernames[2]} commented "send me" on Reel #1.`,
      },
      {
        userId: user.id,
        type: NotificationType.DM_FAILED,
        title: 'DM delivery failed',
        message: `Could not message @${usernames[5]} — messaging restricted to non-followers.`,
      },
    ],
  });

  console.log('Seed complete:', { user: user.email, automations: 2, templates: templates.length, messages: messageRows.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

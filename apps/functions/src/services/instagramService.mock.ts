import { logger } from '../lib/logger';
import type {
  FacebookPage,
  IceBreakerInput,
  InstagramProfile,
  InstagramService,
  MessagingParticipant,
  RecentComment,
  ReelSummary,
  SendReplyResult,
  TokenResult,
} from '../types/instagram';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Deterministic in-memory Instagram integration used when INSTAGRAM_MOCK_MODE=true.
 * Lets the whole comment -> automation -> DM pipeline be demoed without a live Meta App.
 */
class MockInstagramService implements InstagramService {
  async exchangeCodeForToken(): Promise<TokenResult> {
    await wait(150);
    return { accessToken: 'mock-short-lived-token', expiresIn: 3600 };
  }

  async getLongLivedToken(): Promise<TokenResult> {
    await wait(150);
    return { accessToken: 'mock-long-lived-token', expiresIn: 60 * 24 * 60 * 60 };
  }

  async refreshLongLivedToken(): Promise<TokenResult> {
    await wait(100);
    return { accessToken: 'mock-long-lived-token-refreshed', expiresIn: 60 * 24 * 60 * 60 };
  }

  async getFacebookPages(): Promise<FacebookPage[]> {
    await wait(150);
    return [
      { id: 'mock-fb-page-100000000000000', name: 'Demo Creator', accessToken: 'mock-page-token' },
    ];
  }

  async getInstagramBusinessAccountId(): Promise<string | null> {
    await wait(100);
    return `mock-ig-business-${Date.now()}`;
  }

  async getInstagramProfile(igUserId: string): Promise<InstagramProfile> {
    await wait(150);
    return {
      igUserId,
      username: 'demo.creator',
      name: 'Demo Creator',
      profilePictureUrl: 'https://api.dicebear.com/9.x/notionists/svg?seed=demo-creator-ig',
      followersCount: 24831,
    };
  }

  async subscribePageToWebhooks(): Promise<void> {
    await wait(100);
    logger.info('[mock] Subscribed page to webhooks (no-op)');
  }

  async getReels(_igUserId: string): Promise<ReelSummary[]> {
    await wait(200);
    const captions = [
      'The one habit that changed everything for my business 👇 comment "send me" for the guide',
      'My full course is finally here 🚀 comment "course" to get on the waitlist',
      '3 pricing mistakes creators make (comment "pricing" for my rate card)',
      'This ebook sold out in 24 hours — comment "ebook" and I\'ll send it over',
    ];
    return captions.map((caption, i) => ({
      id: `mock-reel-1800000000000000${i + 1}`,
      thumbnailUrl: `https://picsum.photos/seed/reel${i + 1}/400/700`,
      permalink: `https://instagram.com/reel/mock${i + 1}`,
      caption,
      commentsCount: 50 + i * 37,
      likeCount: 1200 + i * 480,
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }

  async getRecentComments(
    _igUserId: string,
    _accessToken: string,
    limit = 20,
  ): Promise<RecentComment[]> {
    await wait(200);
    const usernames = [
      'traveler_jane',
      'growth.mike',
      'sara_builds',
      'devon.codes',
      'lena_travels',
    ];
    const texts = [
      'send me',
      'course please!',
      'pricing?',
      'ebook 🙏',
      'love this, send me the guide',
    ];
    const reels = [
      {
        id: 'mock-reel-18000000000000001',
        permalink: 'https://instagram.com/reel/mock1',
        thumbnailUrl: 'https://picsum.photos/seed/reel1/400/700',
      },
      {
        id: 'mock-reel-18000000000000002',
        permalink: 'https://instagram.com/reel/mock2',
        thumbnailUrl: 'https://picsum.photos/seed/reel2/400/700',
      },
    ];
    return Array.from({ length: limit }, (_, i) => {
      const reel = reels[i % reels.length]!;
      return {
        id: `mock-comment-${i + 1}`,
        text: texts[i % texts.length]!,
        username: usernames[i % usernames.length]!,
        timestamp: new Date(Date.now() - i * 3_600_000).toISOString(),
        mediaId: reel.id,
        mediaPermalink: reel.permalink,
        mediaThumbnailUrl: reel.thumbnailUrl,
      };
    });
  }

  async sendPrivateReply(commentId: string, message: string): Promise<SendReplyResult> {
    await wait(300 + Math.random() * 400);
    // Simulate an occasional realistic failure (e.g. recipient messaging restrictions).
    if (Math.random() < 0.05) {
      const err: Error & { code?: string } = new Error(
        'Recipient has messaging restricted to non-followers.',
      );
      throw err;
    }
    logger.info({ commentId, message }, '[mock] Private reply sent');
    return { externalMessageId: `mock-msg-${Date.now()}-${Math.round(Math.random() * 1e6)}` };
  }

  async replyToComment(commentId: string, message: string): Promise<SendReplyResult> {
    await wait(150 + Math.random() * 200);
    logger.info({ commentId, message }, '[mock] Public comment reply posted');
    return { externalMessageId: `mock-reply-${Date.now()}-${Math.round(Math.random() * 1e6)}` };
  }

  async getUserProfileByIgsid(): Promise<MessagingParticipant> {
    await wait(100);
    return { username: 'demo_follower' };
  }

  async syncIceBreakers(
    _igUserId: string,
    _accessToken: string,
    iceBreakers: IceBreakerInput[],
  ): Promise<void> {
    await wait(150);
    logger.info({ count: iceBreakers.length }, '[mock] Ice breakers synced');
  }
}

export const mockInstagramService = new MockInstagramService();

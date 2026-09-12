import axios from 'axios';
import { IG_GRAPH_BASE_URL, IG_GRAPH_OAUTH_BASE_URL, IG_OAUTH_TOKEN_URL } from '@instaauto/shared';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { ApiError } from '../middleware/errors';
import type {
  FacebookPage,
  InstagramProfile,
  InstagramService,
  MessagingParticipant,
  RecentComment,
  ReelSummary,
  SendReplyResult,
  TokenResult,
} from '../types/instagram';

/**
 * Real Instagram API (with Instagram Login) integration — direct business-account OAuth
 * against api.instagram.com / graph.instagram.com, no linked Facebook Page required.
 * Requires a reviewed Meta App with `instagram_business_basic`,
 * `instagram_business_manage_comments`, `instagram_business_manage_messages` permissions.
 */
class RealInstagramService implements InstagramService {
  private requireMetaCreds() {
    if (!config.META_APP_ID || !config.META_APP_SECRET) {
      throw ApiError.serviceUnavailable(
        'Meta App credentials are not configured on this server. Set META_APP_ID / META_APP_SECRET.',
      );
    }
    return { appId: config.META_APP_ID, appSecret: config.META_APP_SECRET };
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResult> {
    const { appId, appSecret } = this.requireMetaCreds();
    const body = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    });
    const { data } = await axios.post(IG_OAUTH_TOKEN_URL, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in ?? 3600,
      igUserId: String(data.user_id),
    };
  }

  async getLongLivedToken(shortLivedToken: string): Promise<TokenResult> {
    const { appSecret } = this.requireMetaCreds();
    const { data } = await axios.get(`${IG_GRAPH_OAUTH_BASE_URL}/access_token`, {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: appSecret,
        access_token: shortLivedToken,
      },
    });
    return { accessToken: data.access_token, expiresIn: data.expires_in ?? 60 * 24 * 60 * 60 };
  }

  async refreshLongLivedToken(currentToken: string): Promise<TokenResult> {
    const { data } = await axios.get(`${IG_GRAPH_OAUTH_BASE_URL}/refresh_access_token`, {
      params: { grant_type: 'ig_refresh_token', access_token: currentToken },
    });
    return { accessToken: data.access_token, expiresIn: data.expires_in ?? 60 * 24 * 60 * 60 };
  }

  async getFacebookPages(): Promise<FacebookPage[]> {
    // Not applicable under direct Instagram Login — the IG user id comes from the token exchange.
    return [];
  }

  async getInstagramBusinessAccountId(): Promise<string | null> {
    // Not applicable under direct Instagram Login — the IG user id comes from the token exchange.
    return null;
  }

  async getInstagramProfile(igUserId: string, accessToken: string): Promise<InstagramProfile> {
    // Query "me" rather than the numeric id path — under direct Instagram Login the token is
    // scoped to exactly one account, and "me" is the reliably-supported self-lookup alias.
    const { data } = await axios.get(`${IG_GRAPH_BASE_URL}/me`, {
      params: {
        fields: 'user_id,username,name,profile_picture_url,followers_count',
        access_token: accessToken,
      },
    });
    // Use the self-lookup's own user_id rather than the caller-supplied one — the id returned by
    // the OAuth token exchange has been observed to NOT match the id Instagram uses as entry.id
    // in webhook payloads, while this one does. Trusting the wrong id here silently breaks
    // webhook-to-account matching for every comment/message event.
    return {
      igUserId: data.user_id ? String(data.user_id) : igUserId,
      username: data.username,
      name: data.name ?? data.username,
      profilePictureUrl: data.profile_picture_url ?? null,
      followersCount: data.followers_count ?? 0,
    };
  }

  async subscribePageToWebhooks(_igUserId: string, accessToken: string): Promise<void> {
    // Opts this specific Instagram account into webhook delivery for the "comments" field.
    // The app-level webhook config alone does not deliver events — each connected account
    // must also call subscribed_apps with its own token (self-lookup via "me").
    await axios.post(`${IG_GRAPH_BASE_URL}/me/subscribed_apps`, null, {
      params: { subscribed_fields: 'comments,messages', access_token: accessToken },
    });
  }

  async getReels(_igUserId: string, accessToken: string): Promise<ReelSummary[]> {
    // "me/media" rather than "{id}/media" — same self-lookup requirement as getInstagramProfile.
    // Reels are mixed in with every other media type in this feed, so a single page of results
    // can easily miss older Reels — follow pagination up to a safety cap.
    type MediaItem = {
      id: string;
      media_product_type?: string;
      thumbnail_url?: string;
      permalink: string;
      caption?: string;
      comments_count?: number;
      like_count?: number;
      timestamp: string;
    };
    const allMedia: MediaItem[] = [];
    let url = `${IG_GRAPH_BASE_URL}/me/media`;
    let params: Record<string, string | number> | undefined = {
      fields:
        'id,media_type,media_product_type,thumbnail_url,permalink,caption,comments_count,like_count,timestamp',
      access_token: accessToken,
      limit: 50,
    };

    for (let page = 0; page < 6 && url; page++) {
      const { data } = await axios.get(url, { params });
      allMedia.push(...((data.data ?? []) as MediaItem[]));
      url = data.paging?.next ?? '';
      params = undefined; // pagination cursor URLs already include all query params
    }

    return allMedia
      .filter((m) => m.media_product_type === 'REELS')
      .map((m) => ({
        id: m.id,
        thumbnailUrl: m.thumbnail_url ?? '',
        permalink: m.permalink,
        caption: m.caption ?? '',
        commentsCount: m.comments_count ?? 0,
        likeCount: m.like_count ?? 0,
        timestamp: m.timestamp,
      }));
  }

  /**
   * Fetches the most recent comments across the account's recent media. The Graph API has no
   * single "all comments" endpoint, so this walks the most recent media items and their comment
   * edges, then merges and sorts client-side.
   */
  async getRecentComments(
    _igUserId: string,
    accessToken: string,
    limit = 20,
  ): Promise<RecentComment[]> {
    const { data: mediaData } = await axios.get(`${IG_GRAPH_BASE_URL}/me/media`, {
      params: {
        fields: 'id,permalink,thumbnail_url,media_url,comments_count',
        access_token: accessToken,
        limit: 15,
      },
    });

    const mediaItems = (mediaData.data ?? []) as Array<{
      id: string;
      permalink: string;
      thumbnail_url?: string;
      media_url?: string;
      comments_count?: number;
    }>;

    const commentLists = await Promise.all(
      mediaItems
        .filter((m) => (m.comments_count ?? 0) > 0)
        .map(async (media) => {
          try {
            const { data } = await axios.get(`${IG_GRAPH_BASE_URL}/${media.id}/comments`, {
              params: {
                fields: 'id,text,username,timestamp,from',
                access_token: accessToken,
                limit: 25,
              },
            });
            // The Graph API only populates the top-level `username` field for the connected
            // account's own comments — every other commenter's comment omits it entirely, even
            // though it's requested. `from.username` is populated for all commenters, so prefer it.
            const comments = (data.data ?? []) as Array<{
              id: string;
              text: string;
              username?: string;
              timestamp: string;
              from?: { username?: string };
            }>;
            return comments.map((c) => ({
              id: c.id,
              text: c.text ?? '',
              username: c.from?.username ?? c.username ?? 'unknown',
              timestamp: c.timestamp,
              mediaId: media.id,
              mediaPermalink: media.permalink,
              mediaThumbnailUrl: media.thumbnail_url ?? media.media_url ?? '',
            }));
          } catch (err) {
            logger.warn(
              { err: axios.isAxiosError(err) ? err.response?.data : err, mediaId: media.id },
              'Failed to fetch comments for media',
            );
            return [];
          }
        }),
    );

    return commentLists
      .flat()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Sends a DM in reply to a specific comment. `/{comment-id}/private_replies` is the legacy
   * Facebook Page / Messenger Platform edge and does not exist for direct Instagram Login
   * tokens — it returns a generic "object does not exist" error that looks like a permissions
   * problem but is really just the wrong endpoint. Under Instagram Login, private replies are
   * sent via POST /me/messages with the comment id nested in a JSON `recipient` object.
   */
  async sendPrivateReply(
    commentId: string,
    message: string,
    accessToken: string,
  ): Promise<SendReplyResult> {
    try {
      const { data } = await axios.post(
        `${IG_GRAPH_BASE_URL}/me/messages`,
        { recipient: { comment_id: commentId }, message: { text: message } },
        { params: { access_token: accessToken } },
      );
      return { externalMessageId: data.message_id ?? data.id ?? 'unknown' };
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.error?.message
        : (err as Error).message;
      logger.error({ err: detail, commentId }, 'Instagram private reply failed');
      throw ApiError.badRequest(
        `Instagram rejected the private reply: ${detail ?? 'unknown error'}`,
      );
    }
  }

  /**
   * Sends a freeform DM to a specific recipient (by their IG-scoped user id), not tied to any
   * comment — used for AI auto-replies and story-automation replies. Same `/me/messages` endpoint
   * as sendPrivateReply, just keyed by `recipient.id` instead of `recipient.comment_id`.
   */
  async sendTextDM(
    recipientIgUserId: string,
    message: string,
    accessToken: string,
  ): Promise<SendReplyResult> {
    try {
      const { data } = await axios.post(
        `${IG_GRAPH_BASE_URL}/me/messages`,
        { recipient: { id: recipientIgUserId }, message: { text: message } },
        { params: { access_token: accessToken } },
      );
      return { externalMessageId: data.message_id ?? data.id ?? 'unknown' };
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.error?.message
        : (err as Error).message;
      logger.error({ err: detail, recipientIgUserId }, 'Instagram text DM failed');
      throw ApiError.badRequest(
        `Instagram rejected the direct message: ${detail ?? 'unknown error'}`,
      );
    }
  }

  /**
   * Posts a public reply visible under the original comment — distinct from the private DM
   * sent via sendPrivateReply. Uses the comment moderation "replies" endpoint.
   */
  async replyToComment(
    commentId: string,
    message: string,
    accessToken: string,
  ): Promise<SendReplyResult> {
    try {
      const { data } = await axios.post(`${IG_GRAPH_BASE_URL}/${commentId}/replies`, null, {
        params: { message, access_token: accessToken },
      });
      return { externalMessageId: data.id ?? 'unknown' };
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.error?.message
        : (err as Error).message;
      logger.error({ err: detail, commentId }, 'Instagram public comment reply failed');
      throw ApiError.badRequest(
        `Instagram rejected the public reply: ${detail ?? 'unknown error'}`,
      );
    }
  }

  /**
   * Instagram's messaging webhook only gives numeric IG-scoped sender/recipient IDs, not
   * usernames — this looks up the human-readable username the first time a conversation with
   * that participant is seen.
   */
  async getUserProfileByIgsid(igsid: string, accessToken: string): Promise<MessagingParticipant> {
    try {
      const { data } = await axios.get(`${IG_GRAPH_BASE_URL}/${igsid}`, {
        params: { fields: 'username', access_token: accessToken },
      });
      return { username: data.username ?? 'unknown' };
    } catch (err) {
      logger.warn(
        { err: axios.isAxiosError(err) ? err.response?.data : err, igsid },
        'Failed to look up message participant profile',
      );
      return { username: 'unknown' };
    }
  }
}

export const realInstagramService = new RealInstagramService();

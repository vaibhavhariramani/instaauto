export interface TokenResult {
  accessToken: string;
  expiresIn: number;
  igUserId?: string;
}

export interface FacebookPage {
  id: string;
  name: string;
  accessToken: string;
}

export interface InstagramProfile {
  igUserId: string;
  username: string;
  name: string;
  profilePictureUrl: string | null;
  followersCount: number;
}

export interface ReelSummary {
  id: string;
  thumbnailUrl: string;
  permalink: string;
  caption: string;
  commentsCount: number;
  likeCount: number;
  timestamp: string;
}

export interface SendReplyResult {
  externalMessageId: string;
}

export interface RecentComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  mediaId: string;
  mediaPermalink: string;
  mediaThumbnailUrl: string;
}

export interface MessagingParticipant {
  username: string;
}

/** A button that fires a `postback` webhook event on tap (payload identifies which one) rather
 * than opening a URL. Renders inside the same button-template card as any web_url buttons on the
 * message, so it looks identical to them (boxed, full-width) - unlike a quick-reply chip, which
 * renders as a separate colored pill and was confirmed (by live testing) not to combine reliably
 * with a template attachment on the same message. Title capped at 20 characters. */
export interface PostbackButton {
  title: string;
  payload: string;
}

/** A real clickable button (opens `url`), rendered via a button-template attachment rather than
 * plain text with a pasted link. Up to 3 per message, title capped at 20 characters. */
export interface LinkButton {
  label: string;
  url: string;
}

export interface InstagramService {
  exchangeCodeForToken(code: string, redirectUri: string): Promise<TokenResult>;
  getLongLivedToken(shortLivedToken: string): Promise<TokenResult>;
  refreshLongLivedToken(currentToken: string): Promise<TokenResult>;
  getFacebookPages(userAccessToken: string): Promise<FacebookPage[]>;
  getInstagramBusinessAccountId(pageId: string, pageAccessToken: string): Promise<string | null>;
  getInstagramProfile(igUserId: string, accessToken: string): Promise<InstagramProfile>;
  subscribePageToWebhooks(pageId: string, pageAccessToken: string): Promise<void>;
  getReels(igUserId: string, accessToken: string): Promise<ReelSummary[]>;
  sendPrivateReply(
    commentId: string,
    message: string,
    accessToken: string,
    postbackButtons?: PostbackButton[],
    linkButtons?: LinkButton[],
  ): Promise<SendReplyResult>;
  replyToComment(commentId: string, message: string, accessToken: string): Promise<SendReplyResult>;
  getRecentComments(
    igUserId: string,
    accessToken: string,
    limit?: number,
  ): Promise<RecentComment[]>;
  getUserProfileByIgsid(igsid: string, accessToken: string): Promise<MessagingParticipant>;
  sendMessage(
    igsid: string,
    message: string,
    accessToken: string,
    postbackButtons?: PostbackButton[],
    linkButtons?: LinkButton[],
  ): Promise<SendReplyResult>;
  /**
   * Only succeeds once the participant has sent at least one inbound DM - Instagram gates this
   * lookup behind that same consent window as getUserProfileByIgsid. Callers must not invoke this
   * before an inbound message has been received from the participant.
   */
  getFollowStatus(igsid: string, accessToken: string): Promise<{ followsBusiness: boolean }>;
}

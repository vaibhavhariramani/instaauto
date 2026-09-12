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
  ): Promise<SendReplyResult>;
  replyToComment(commentId: string, message: string, accessToken: string): Promise<SendReplyResult>;
  sendTextDM(
    recipientIgUserId: string,
    message: string,
    accessToken: string,
  ): Promise<SendReplyResult>;
  getRecentComments(
    igUserId: string,
    accessToken: string,
    limit?: number,
  ): Promise<RecentComment[]>;
  getUserProfileByIgsid(igsid: string, accessToken: string): Promise<MessagingParticipant>;
}

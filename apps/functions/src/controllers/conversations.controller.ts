import type { Response } from 'express';
import type { SendMessageInput } from '@instaauto/shared';
import * as conversationService from '../services/conversationService';
import { toConversationDto, toDirectMessageDto } from '../utils/mappers';
import type { AuthedRequest } from '../middleware/auth';

export async function list(req: AuthedRequest, res: Response): Promise<void> {
  const conversations = await conversationService.listConversationsForAccount(
    req.userId,
    req.params.accountId!,
  );
  res.json(conversations.map(toConversationDto));
}

export async function messages(req: AuthedRequest, res: Response): Promise<void> {
  const { conversation, messages: directMessages } =
    await conversationService.listMessagesForConversation(
      req.userId,
      req.params.accountId!,
      req.params.conversationId!,
    );
  res.json({
    conversation: toConversationDto(conversation),
    messages: directMessages.map(toDirectMessageDto),
  });
}

export async function send(req: AuthedRequest, res: Response): Promise<void> {
  const { content } = req.body as SendMessageInput;
  const message = await conversationService.sendMessageToConversation(
    req.userId,
    req.params.accountId!,
    req.params.conversationId!,
    content,
  );
  res.json(toDirectMessageDto(message));
}

import axios from 'axios';
import { config, aiConfigured } from '../config/env';
import { logger } from '../lib/logger';

interface HistoryMessage {
  direction: 'INBOUND' | 'OUTBOUND';
  content: string;
}

interface GenerateReplyInput {
  personaPrompt: string | null;
  history: HistoryMessage[];
  incomingText: string;
}

const HOUSE_RULES = [
  'You are replying to an Instagram DM on behalf of the account owner.',
  'Keep replies short (1-3 sentences), human-like, and casual — never mention you are an AI.',
  'Match the language and tone of the incoming message (English, Hindi, Hinglish, etc.).',
  'Never invent prices, links, or promises the business has not stated.',
].join(' ');

export { aiConfigured };

/**
 * Calls an OpenAI-compatible chat-completions endpoint (Groq by default) to draft a fallback DM
 * reply. Returns null on any failure — a missing/failed AI reply should never break the inbound
 * message pipeline, it just means the conversation goes unanswered until a human replies.
 */
export async function generateReply({
  personaPrompt,
  history,
  incomingText,
}: GenerateReplyInput): Promise<string | null> {
  if (!aiConfigured) return null;

  const apiKey = config.GROQ_API_KEY ?? config.OPENAI_API_KEY;
  const systemPrompt = personaPrompt ? `${HOUSE_RULES} ${personaPrompt}` : HOUSE_RULES;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((m) => ({
      role: m.direction === 'INBOUND' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
    { role: 'user', content: incomingText },
  ];

  try {
    const { data } = await axios.post(
      config.AI_BASE_URL,
      { model: config.AI_MODEL, messages, temperature: 0.7, max_tokens: 150 },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 15_000,
      },
    );
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || null;
  } catch (err) {
    const detail = axios.isAxiosError(err) ? err.response?.data : (err as Error).message;
    logger.warn({ err: detail }, 'AI reply generation failed');
    return null;
  }
}

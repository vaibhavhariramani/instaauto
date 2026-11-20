import { logger } from './logger';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/** Sends an Expo push notification to each token; best-effort, never throws. */
export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  if (tokens.length === 0) return;

  const messages = tokens.map((to) => ({ to, title, body, sound: 'default', data }));

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'Expo push service returned a non-OK status');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to send push notification');
  }
}

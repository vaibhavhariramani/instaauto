import type { Request, Response } from 'express';
import * as webhookService from '../services/webhookService';
import * as stripeService from '../services/stripeService';
import { logger } from '../lib/logger';

/**
 * In Cloud Functions (firebase-functions' onRequest), the Functions Framework consumes the
 * request stream before Express middleware runs and exposes the original bytes via
 * `req.rawBody`. Express's own `raw()` middleware — which works fine for local dev's plain
 * `app.listen()` — sees an already-drained stream there, leaving `req.body` as the pre-parsed
 * JSON object. Prefer `req.rawBody` when present; fall back to `req.body` for local dev.
 */
function getRawBody(req: Request): Buffer {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  return rawBody ?? (req.body as Buffer);
}

export function verifyInstagramWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  if (webhookService.verifyWebhookSubscription(mode, token)) {
    res.status(200).send(challenge);
    return;
  }
  res.status(403).send('Verification failed');
}

export async function receiveInstagramWebhook(req: Request, res: Response): Promise<void> {
  // Process fully before responding. Cloud Run only guarantees CPU is allocated while a request
  // is in flight (unless "CPU always allocated" is turned on) — sending the ack first and then
  // continuing to `await` afterwards let the instance get throttled mid-processing, causing
  // comment/DM handling to silently stall or drop partway through. Meta tolerates a response
  // within several seconds, which this flow comfortably fits.
  const rawBody = getRawBody(req);
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  try {
    await webhookService.handleIncomingWebhook(rawBody, signature);
  } catch (err) {
    logger.error({ err }, 'Error processing Instagram webhook');
  } finally {
    res.status(200).send('EVENT_RECEIVED');
  }
}

export async function receiveStripeWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['stripe-signature'] as string | undefined;
  try {
    const event = stripeService.constructWebhookEvent(getRawBody(req), signature);
    await stripeService.handleWebhookEvent(event);
    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err }, 'Stripe webhook signature verification failed');
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
}

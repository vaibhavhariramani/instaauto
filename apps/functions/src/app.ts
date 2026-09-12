import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './config/env';
import { logger } from './lib/logger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { webhooksRouter } from './routes/webhooks.routes';
import { authRouter } from './routes/auth.routes';
import { meRouter } from './routes/me.routes';
import { instagramRouter } from './routes/instagram.routes';
import { automationsRouter } from './routes/automations.routes';
import { templatesRouter } from './routes/templates.routes';
import { messagesRouter } from './routes/messages.routes';
import { conversationsRouter } from './routes/conversations.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { billingRouter } from './routes/billing.routes';
import { iceBreakersRouter } from './routes/iceBreakers.routes';
import { devRouter } from './routes/dev.routes';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: config.FRONTEND_URL,
      credentials: true,
    }),
  );
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));

  // Webhooks need the raw request body for signature verification, so they're mounted
  // before the global JSON body parser.
  app.use('/api/webhooks', webhooksRouter);

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use('/api', apiRateLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRouter);
  app.use('/api/me', meRouter);
  app.use('/api/instagram', instagramRouter);
  app.use('/api/automation', automationsRouter);
  app.use('/api/templates', templatesRouter);
  app.use('/api/messages', messagesRouter);
  app.use('/api/conversations', conversationsRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/ice-breakers', iceBreakersRouter);
  app.use('/api/dev', devRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

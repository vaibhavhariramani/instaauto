import pino from 'pino';
import { isProduction } from '../config/env';

// pino-http logs the whole request, headers included. Without this, every bearer credential
// (session JWTs, MCP API keys) and cookie lands in Cloud Logging in clear text.
export const LOG_REDACTION = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'req.headers["x-api-key"]',
    'res.headers["set-cookie"]',
  ],
  censor: '[redacted]',
};

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: LOG_REDACTION,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});

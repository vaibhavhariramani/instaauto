import 'dotenv/config';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { createApp } from './app';
import { runRetryFailedMessages } from './jobs/retryFailedMessages.job';
import { runRefreshExpiringTokens } from './jobs/refreshExpiringTokens.job';
import { runResolveStaleFollowGates } from './jobs/resolveStaleFollowGates.job';

const RUNTIME_OPTS = { region: 'us-central1', memory: '512MiB' as const, timeoutSeconds: 60 };

export const api = onRequest(RUNTIME_OPTS, createApp());

export const retryFailedMessages = onSchedule(
  { schedule: 'every 5 minutes', ...RUNTIME_OPTS },
  async () => {
    await runRetryFailedMessages();
  },
);

export const refreshExpiringTokens = onSchedule(
  { schedule: 'every 24 hours', ...RUNTIME_OPTS },
  async () => {
    await runRefreshExpiringTokens();
  },
);

export const resolveStaleFollowGates = onSchedule(
  { schedule: 'every 1 hours', ...RUNTIME_OPTS },
  async () => {
    await runResolveStaleFollowGates();
  },
);

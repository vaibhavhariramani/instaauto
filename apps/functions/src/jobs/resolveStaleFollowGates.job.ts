import { resolveStaleFollowGates } from '../services/dmService';
import { logger } from '../lib/logger';

export async function runResolveStaleFollowGates(): Promise<void> {
  const result = await resolveStaleFollowGates(100);
  logger.info(result, 'resolveStaleFollowGates job complete');
}

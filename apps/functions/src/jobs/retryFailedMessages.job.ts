import { retryDueMessages } from '../services/dmService';
import { logger } from '../lib/logger';

export async function runRetryFailedMessages(): Promise<void> {
  const result = await retryDueMessages(100);
  logger.info(result, 'retryFailedMessages job complete');
}

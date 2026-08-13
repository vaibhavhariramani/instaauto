import 'dotenv/config';
import { createApp } from './app';
import { config } from './config/env';
import { logger } from './lib/logger';

const app = createApp();

app.listen(config.PORT, () => {
  logger.info(`InstaAuto API listening on http://localhost:${config.PORT}`);
});

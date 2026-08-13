import { config } from '../config/env';
import { realInstagramService } from './instagramService.real';
import { mockInstagramService } from './instagramService.mock';
import type { InstagramService } from '../types/instagram';

export const instagramService: InstagramService = config.INSTAGRAM_MOCK_MODE
  ? mockInstagramService
  : realInstagramService;

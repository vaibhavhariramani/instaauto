import { Router } from 'express';
import { extractBearerToken } from '../lib/apiKeys';
import { logger } from '../lib/logger';
import { handleMcpPost } from '../mcp/protocol';
import { mcpTools } from '../mcp/tools';
import { asyncHandler } from '../middleware/asyncHandler';
import { mcpRateLimiter } from '../middleware/rateLimiter';
import { authenticateApiKey } from '../services/apiKeyService';

export const mcpRouter = Router();

// Authentication is a per-user API key (Authorization: Bearer iak_...), deliberately separate from
// the web/mobile session JWTs: it's long-lived, revocable, scoped, and never grants admin access.
mcpRouter.post(
  '/',
  mcpRateLimiter,
  asyncHandler(async (req, res) => {
    const token = extractBearerToken(req.headers.authorization);
    const auth = token ? await authenticateApiKey(token) : null;
    if (!auth) {
      res
        .status(401)
        .set('WWW-Authenticate', 'Bearer realm="instaauto-mcp"')
        .json({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32001, message: 'Invalid, expired or revoked API key' },
        });
      return;
    }

    const result = await handleMcpPost(
      { headers: req.headers, body: req.body },
      { userId: auth.userId, keyId: auth.keyId, scope: auth.scope },
      mcpTools,
      {
        onToolError: (err, tool) =>
          logger.error({ err, tool, keyId: auth.keyId }, 'MCP tool failed'),
      },
    );

    if (result.body === undefined) res.status(result.status).end();
    else res.status(result.status).json(result.body);
  }),
);

// No server-initiated SSE stream and no sessions to terminate: this endpoint is POST-only.
mcpRouter.all('/', (_req, res) => {
  res
    .status(405)
    .set('Allow', 'POST')
    .json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32000, message: 'Method not allowed: use POST' },
    });
});

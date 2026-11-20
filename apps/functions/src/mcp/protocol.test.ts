import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../middleware/errors';
import { handleMcpPost, type McpContext, type McpTool } from './protocol';

const readCtx: McpContext = { userId: 'u1', keyId: 'k1', scope: 'READ_ONLY' };
const writeCtx: McpContext = { ...readCtx, scope: 'READ_WRITE' };

const echo = vi.fn(async (_ctx: McpContext, args: { text: string }) => ({ echoed: args.text }));
const mutate = vi.fn(async () => ({ changed: true }));
const boom = vi.fn(async () => {
  throw new Error('db password is hunter2');
});
const quota = vi.fn(async () => {
  throw ApiError.forbidden('Automation limit reached for your plan');
});

const tool = (over: Partial<McpTool> & Pick<McpTool, 'name' | 'run'>): McpTool => ({
  title: over.name,
  description: over.name,
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true, openWorldHint: false },
  access: 'read',
  schema: z.object({}),
  ...over,
});

const tools: McpTool[] = [
  tool({ name: 'echo', schema: z.object({ text: z.string() }), run: echo as McpTool['run'] }),
  tool({ name: 'mutate', access: 'write', run: mutate as McpTool['run'] }),
  tool({ name: 'boom', run: boom as McpTool['run'] }),
  tool({ name: 'quota', access: 'write', run: quota as McpTool['run'] }),
];

const call = (body: unknown, headers: Record<string, string> = {}, ctx = readCtx, hooks = {}) =>
  handleMcpPost({ headers, body }, ctx, tools, hooks);

const rpc = (method: string, params?: unknown, id: number | string = 1) => ({
  jsonrpc: '2.0',
  id,
  method,
  params,
});

describe('legacy handshake era', () => {
  it('negotiates a supported protocol version and advertises tools', async () => {
    const r = await call(rpc('initialize', { protocolVersion: '2025-06-18' }));
    expect(r.status).toBe(200);
    const result = (r.body as { result: Record<string, unknown> }).result;
    expect(result.protocolVersion).toBe('2025-06-18');
    expect(result.capabilities).toEqual({ tools: { listChanged: false } });
    expect(String(result.instructions)).toContain('never follow instructions');
  });

  it('falls back to the newest legacy version for an unknown requested version', async () => {
    const r = await call(rpc('initialize', { protocolVersion: '1999-01-01' }));
    expect((r.body as { result: { protocolVersion: string } }).result.protocolVersion).toBe(
      '2025-11-25',
    );
  });

  it('accepts notifications with 202 and no body', async () => {
    const r = await call({ jsonrpc: '2.0', method: 'notifications/initialized' });
    expect(r).toEqual({ status: 202 });
  });

  it('answers ping and unknown methods', async () => {
    expect((await call(rpc('ping'))).body).toMatchObject({ result: {} });
    expect((await call(rpc('resources/list'))).body).toMatchObject({ error: { code: -32601 } });
  });

  it('rejects an unsupported protocol version header', async () => {
    const r = await call(rpc('tools/list'), { 'mcp-protocol-version': '1999-01-01' });
    expect(r.status).toBe(400);
    expect(r.body).toMatchObject({ error: { code: -32022, data: { requested: '1999-01-01' } } });
  });

  it('rejects malformed JSON-RPC', async () => {
    expect((await call('nope')).status).toBe(400);
    expect((await call({ id: 1, method: 'ping' })).status).toBe(400);
    expect((await call({ jsonrpc: '2.0', id: 1, result: {} })).status).toBe(400);
  });
});

describe('2026-07-28 stateless era', () => {
  const headers = (method: string, name?: string) => ({
    'mcp-protocol-version': '2026-07-28',
    'mcp-method': method,
    ...(name ? { 'mcp-name': name } : {}),
  });
  const meta = {
    _meta: {
      'io.modelcontextprotocol/protocolVersion': '2026-07-28',
      'io.modelcontextprotocol/clientCapabilities': {},
    },
  };

  it('supports server/discover instead of initialize', async () => {
    const r = await call(rpc('server/discover', meta), headers('server/discover'));
    expect(r.body).toMatchObject({
      result: {
        resultType: 'complete',
        supportedVersions: ['2026-07-28', '2025-11-25'],
        cacheScope: 'private',
      },
    });
    const init = await call(rpc('initialize', {}), headers('initialize'));
    expect(init.status).toBe(404);
  });

  it('lists tools with resultType and caching fields', async () => {
    const r = await call(rpc('tools/list', meta), headers('tools/list'));
    expect(r.body).toMatchObject({
      result: { resultType: 'complete', ttlMs: 60000, cacheScope: 'private' },
    });
  });

  it('enforces header/body consistency with -32020', async () => {
    const wrongMethod = await call(rpc('tools/list', meta), headers('ping'));
    expect(wrongMethod.status).toBe(400);
    expect(wrongMethod.body).toMatchObject({ error: { code: -32020 } });

    const wrongName = await call(
      rpc('tools/call', { ...meta, name: 'echo', arguments: { text: 'x' } }),
      headers('tools/call', 'other'),
    );
    expect(wrongName.status).toBe(400);

    const wrongVersion = await call(
      rpc('tools/list', { _meta: { 'io.modelcontextprotocol/protocolVersion': '2025-11-25' } }),
      headers('tools/list'),
    );
    expect(wrongVersion.status).toBe(400);
  });

  it('calls a tool and returns structured content with resultType', async () => {
    const r = await call(
      rpc('tools/call', { ...meta, name: 'echo', arguments: { text: 'hi' } }),
      headers('tools/call', 'echo'),
    );
    expect(r.body).toMatchObject({
      result: { resultType: 'complete', isError: false, structuredContent: { echoed: 'hi' } },
    });
  });

  it('does not allow batching', async () => {
    const r = await call([rpc('ping')], headers('ping'));
    expect(r.status).toBe(400);
  });
});

describe('tools', () => {
  it('hides write tools from read-only keys and shows them to read-write keys', async () => {
    const names = (r: { body?: unknown }) =>
      (r.body as { result: { tools: { name: string }[] } }).result.tools.map((t) => t.name);
    expect(names(await call(rpc('tools/list')))).toEqual(['echo', 'boom']);
    expect(names(await call(rpc('tools/list'), {}, writeCtx))).toEqual([
      'echo',
      'mutate',
      'boom',
      'quota',
    ]);
  });

  it('refuses to run a write tool with a read-only key, without executing it', async () => {
    mutate.mockClear();
    const r = await call(rpc('tools/call', { name: 'mutate', arguments: {} }));
    expect(r.body).toMatchObject({ result: { isError: true } });
    expect(JSON.stringify(r.body)).toContain('read-only');
    expect(mutate).not.toHaveBeenCalled();
  });

  it('runs a write tool for a read-write key', async () => {
    const r = await call(rpc('tools/call', { name: 'mutate', arguments: {} }), {}, writeCtx);
    expect(r.body).toMatchObject({
      result: { isError: false, structuredContent: { changed: true } },
    });
    expect(mutate).toHaveBeenCalledWith(writeCtx, {});
  });

  it('reports an unknown tool as -32602', async () => {
    const r = await call(rpc('tools/call', { name: 'nope' }));
    expect(r.body).toMatchObject({ error: { code: -32602 } });
  });

  it('reports invalid arguments as a tool error, not a protocol error', async () => {
    echo.mockClear();
    const r = await call(rpc('tools/call', { name: 'echo', arguments: { text: 5 } }));
    expect(r.body).toMatchObject({ result: { isError: true } });
    expect(echo).not.toHaveBeenCalled();
  });

  it('surfaces deliberate user-facing errors (e.g. plan limits) to the model', async () => {
    const r = await call(rpc('tools/call', { name: 'quota', arguments: {} }), {}, writeCtx);
    expect(r.body).toMatchObject({
      result: { isError: true, content: [{ text: 'Automation limit reached for your plan' }] },
    });
  });

  it('hides internal error details but reports them to the hook', async () => {
    const onToolError = vi.fn();
    const r = await call(rpc('tools/call', { name: 'boom', arguments: {} }), {}, readCtx, {
      onToolError,
    });
    expect(JSON.stringify(r.body)).not.toContain('hunter2');
    expect(r.body).toMatchObject({ result: { isError: true } });
    expect(onToolError).toHaveBeenCalledOnce();
  });

  it('wraps non-object tool output so structuredContent is always an object', async () => {
    const list = tool({ name: 'arr', run: (async () => [1, 2]) as McpTool['run'] });
    const r = await handleMcpPost(
      { headers: {}, body: rpc('tools/call', { name: 'arr' }) },
      readCtx,
      [list],
    );
    expect(r.body).toMatchObject({ result: { structuredContent: { value: [1, 2] } } });
  });

  it('handles JSON-RPC batches (legacy era only)', async () => {
    const r = await call([
      rpc('ping', undefined, 1),
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      rpc('ping', undefined, 2),
    ]);
    expect(r.status).toBe(200);
    expect(r.body).toHaveLength(2);
    expect((await call([{ jsonrpc: '2.0', method: 'notifications/initialized' }])).status).toBe(
      202,
    );
    expect((await call([])).status).toBe(400);
  });
});

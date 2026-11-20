/* eslint-disable @typescript-eslint/no-explicit-any -- test fakes mirror loosely-typed Prisma calls */
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory stand-in for the slice of Prisma the key lifecycle touches, so the real Express app
// (routing, auth, validation, serialization) is exercised end to end without a database.
const db = vi.hoisted(() => {
  const state = { keys: [] as Record<string, any>[], audit: [] as Record<string, any>[], seq: 0 };
  const match = (row: Record<string, any>, where: Record<string, any> = {}): boolean =>
    Object.entries(where).every(([k, v]) => {
      if (k === 'OR') return (v as any[]).some((w) => match(row, w));
      if (v && typeof v === 'object' && !(v instanceof Date)) {
        if ('gt' in v) return row[k] != null && row[k] > v.gt;
        if ('lt' in v) return row[k] != null && row[k] < v.lt;
      }
      return row[k] === v;
    });
  const prisma = {
    apiKey: {
      count: async ({ where }: any) => state.keys.filter((r) => match(r, where)).length,
      create: async ({ data }: any) => {
        const row = {
          id: `key${++state.seq}`,
          lastUsedAt: null,
          expiresAt: null,
          revokedAt: null,
          createdAt: new Date(),
          ...data,
        };
        state.keys.push(row);
        return row;
      },
      findMany: async ({ where }: any) => state.keys.filter((r) => match(r, where)).reverse(),
      findFirst: async ({ where }: any) => state.keys.find((r) => match(r, where)) ?? null,
      findUnique: async ({ where }: any) =>
        state.keys.find((r) => r.keyHash === where.keyHash) ?? null,
      update: async ({ where, data }: any) =>
        Object.assign(
          state.keys.find((r) => r.id === where.id)!,
          data,
        ),
      updateMany: async ({ where, data }: any) => {
        const rows = state.keys.filter((r) => match(r, where));
        rows.forEach((r) => Object.assign(r, data));
        return { count: rows.length };
      },
    },
    auditLog: { create: async ({ data }: any) => void state.audit.push(data) },
    automation: { count: async () => 0, findMany: async () => [] },
    instagramAccount: { count: async () => 0 },
    user: {
      findUniqueOrThrow: async () => ({
        id: 'u1',
        name: 'Test User',
        subscriptionPlan: 'STARTER',
        subscriptionStatus: 'NONE',
        subscriptionCurrentPeriodStart: null,
      }),
    },
    analyticsDaily: { aggregate: async () => ({ _sum: { dmsSent: 3 } }) },
  };
  return { state, prisma };
});

vi.mock('../lib/prisma', () => ({ prisma: db.prisma }));

import { createApp } from '../app';
import { signAccessToken } from '../lib/jwt';

let server: Server;
let base: string;
const session = {
  Authorization: `Bearer ${signAccessToken({ sub: 'u1', email: 'u1@example.com' })}`,
};
const json = { 'Content-Type': 'application/json' };

const createKey = async (body: Record<string, unknown>) => {
  const res = await fetch(`${base}/api/api-keys`, {
    method: 'POST',
    headers: { ...session, ...json },
    body: JSON.stringify(body),
  });
  return { res, body: (await res.json()) as Record<string, any> };
};
const mcp = (key: string | null, body: unknown, extra: Record<string, string> = {}) =>
  fetch(`${base}/api/mcp`, {
    method: 'POST',
    headers: {
      ...json,
      Accept: 'application/json, text/event-stream',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
      ...extra,
    },
    body: JSON.stringify(body),
  });
const rpc = (method: string, params?: unknown, id = 1) => ({ jsonrpc: '2.0', id, method, params });

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((r) => server.close(r)));
beforeEach(() => {
  db.state.keys.length = 0;
  db.state.audit.length = 0;
});

describe('API key management', () => {
  it('requires a session to manage keys', async () => {
    expect((await fetch(`${base}/api/api-keys`)).status).toBe(401);
  });

  it('creates a key, returns the secret once, and never again', async () => {
    const { res, body } = await createKey({ name: 'Claude Code' });
    expect(res.status).toBe(201);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(body.secret).toMatch(/^iak_/);
    expect(body.scope).toBe('READ_ONLY');

    // Stored hashed: the secret appears nowhere in the "database".
    expect(JSON.stringify(db.state.keys)).not.toContain(body.secret);

    const list = (await (
      await fetch(`${base}/api/api-keys`, { headers: session })
    ).json()) as Record<string, unknown>[];
    expect(list).toHaveLength(1);
    expect(JSON.stringify(list)).not.toContain(body.secret);
    expect(list[0]).not.toHaveProperty('keyHash');
    expect(db.state.audit.map((a) => a.action)).toContain('api_key.created');
  });

  it('validates input and caps active keys', async () => {
    expect((await createKey({ name: '' })).res.status).toBe(400);
    expect((await createKey({ name: 'x', scope: 'ADMIN' })).res.status).toBe(400);
    for (let i = 0; i < 10; i++) expect((await createKey({ name: `k${i}` })).res.status).toBe(201);
    const over = await createKey({ name: 'one too many' });
    expect(over.res.status).toBe(400);
  });

  it('revokes a key', async () => {
    const { body } = await createKey({ name: 'tmp' });
    const del = await fetch(`${base}/api/api-keys/${body.id}`, {
      method: 'DELETE',
      headers: session,
    });
    expect(del.status).toBe(204);
    expect((await mcp(body.secret, rpc('ping'))).status).toBe(401);
    expect(
      (await fetch(`${base}/api/api-keys/nope`, { method: 'DELETE', headers: session })).status,
    ).toBe(404);
  });
});

describe('POST /api/mcp', () => {
  it('rejects missing, malformed, unknown and session-JWT credentials with 401', async () => {
    for (const key of [null, 'garbage', `iak_${'a'.repeat(43)}`, session.Authorization.slice(7)]) {
      const res = await mcp(key, rpc('ping'));
      expect(res.status).toBe(401);
      expect(res.headers.get('www-authenticate')).toContain('Bearer');
    }
  });

  it('rejects expired keys', async () => {
    const { body } = await createKey({ name: 'short', expiresInDays: 1 });
    db.state.keys[0]!.expiresAt = new Date(Date.now() - 1000);
    expect((await mcp(body.secret, rpc('ping'))).status).toBe(401);
  });

  it('serves the legacy handshake and tools to a valid read-only key', async () => {
    const { body } = await createKey({ name: 'ro' });
    const init = await mcp(
      body.secret,
      rpc('initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 't', version: '1' },
      }),
    );
    expect(init.status).toBe(200);
    expect(((await init.json()) as any).result.serverInfo.name).toBe('instaauto');

    expect(
      (await mcp(body.secret, { jsonrpc: '2.0', method: 'notifications/initialized' })).status,
    ).toBe(202);

    const list = (await (await mcp(body.secret, rpc('tools/list'))).json()) as any;
    const names = list.result.tools.map((t: any) => t.name);
    expect(names).toContain('list_automations');
    expect(names).not.toContain('set_automation_active');
  });

  it('runs a read tool through the real tool registry', async () => {
    const { body } = await createKey({ name: 'ro' });
    const res = (await (
      await mcp(body.secret, rpc('tools/call', { name: 'get_account_summary', arguments: {} }))
    ).json()) as any;
    expect(res.result.isError).toBe(false);
    expect(res.result.structuredContent).toMatchObject({
      plan: 'Free',
      usage: { dmsSentThisPeriod: 3 },
    });
  });

  it('blocks write tools for read-only keys and lists them for read-write keys', async () => {
    const ro = await createKey({ name: 'ro' });
    const blocked = (await (
      await mcp(
        ro.body.secret,
        rpc('tools/call', {
          name: 'set_automation_active',
          arguments: { id: 'a', isActive: false },
        }),
      )
    ).json()) as any;
    expect(blocked.result.isError).toBe(true);

    const rw = await createKey({ name: 'rw', scope: 'READ_WRITE' });
    const list = (await (await mcp(rw.body.secret, rpc('tools/list'))).json()) as any;
    expect(list.result.tools.map((t: any) => t.name)).toEqual(
      expect.arrayContaining(['set_automation_active', 'create_template']),
    );
  });

  it('speaks the 2026-07-28 revision', async () => {
    const { body } = await createKey({ name: 'ro' });
    const headers = { 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'server/discover' };
    const res = await mcp(
      body.secret,
      rpc('server/discover', {
        _meta: {
          'io.modelcontextprotocol/protocolVersion': '2026-07-28',
          'io.modelcontextprotocol/clientCapabilities': {},
        },
      }),
      headers,
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as any).result.supportedVersions).toContain('2026-07-28');
  });

  it('is POST-only', async () => {
    for (const method of ['GET', 'DELETE']) {
      const res = await fetch(`${base}/api/mcp`, { method });
      expect(res.status).toBe(405);
      expect(res.headers.get('allow')).toBe('POST');
    }
  });

  it('updates lastUsedAt and records it on the key', async () => {
    const { body } = await createKey({ name: 'ro' });
    expect(db.state.keys[0]!.lastUsedAt).toBeNull();
    await mcp(body.secret, rpc('ping'));
    expect(db.state.keys[0]!.lastUsedAt).toBeInstanceOf(Date);
  });
});

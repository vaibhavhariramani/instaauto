import { describe, expect, it } from 'vitest';
import { buildMcpSnippets, KEY_PLACEHOLDER, MCP_TOOLS } from './mcpSnippets';

const URL = 'https://example.web.app/api/mcp';

describe('buildMcpSnippets', () => {
  it('uses the placeholder when there is no key', () => {
    const s = buildMcpSnippets({ url: URL });
    for (const snippet of Object.values(s)) {
      expect(snippet).toContain(KEY_PLACEHOLDER);
    }
  });

  it('substitutes the real key everywhere and drops the placeholder', () => {
    const s = buildMcpSnippets({ url: URL, key: 'iak_secret123' });
    for (const snippet of Object.values(s)) {
      expect(snippet).toContain('iak_secret123');
      expect(snippet).not.toContain(KEY_PLACEHOLDER);
    }
  });

  it('treats an empty key as missing', () => {
    expect(buildMcpSnippets({ url: URL, key: '' }).claudeCode).toContain(KEY_PLACEHOLDER);
  });

  it('embeds the server URL in every snippet', () => {
    for (const snippet of Object.values(buildMcpSnippets({ url: URL }))) {
      expect(snippet).toContain(URL);
    }
  });

  it('produces valid JSON for the config-file snippets', () => {
    const s = buildMcpSnippets({ url: URL, key: 'iak_abc' });
    const desktop = JSON.parse(s.claudeDesktop);
    expect(desktop.mcpServers.instaauto.env.INSTAUTO_MCP_KEY).toBe('Bearer iak_abc');
    expect(desktop.mcpServers.instaauto.args).toContain(URL);
    const antigravity = JSON.parse(s.antigravity);
    expect(antigravity.mcpServers.instaauto.serverUrl).toBe(URL);
    expect(antigravity.mcpServers.instaauto.headers.Authorization).toBe('Bearer iak_abc');
  });

  it('keeps the cURL request bodies valid JSON-RPC', () => {
    const s = buildMcpSnippets({ url: URL });
    const body = (curl: string) => JSON.parse(/-d '(.*)'$/s.exec(curl)![1]!);
    expect(body(s.curlInitialize).method).toBe('initialize');
    expect(body(s.curlToolsList).method).toBe('tools/list');
  });
});

describe('MCP_TOOLS', () => {
  it('flags exactly the write tools', () => {
    expect(MCP_TOOLS.filter((t) => t.write).map((t) => t.name)).toEqual([
      'set_automation_active',
      'create_template',
    ]);
  });
});

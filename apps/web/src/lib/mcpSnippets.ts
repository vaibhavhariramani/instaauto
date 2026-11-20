export const KEY_PLACEHOLDER = 'YOUR_API_KEY';

export interface SnippetInput {
  url: string;
  /** The just-created secret, if the user still has it on screen. Omit to get the placeholder. */
  key?: string;
}

export interface McpSnippets {
  claudeCode: string;
  claudeDesktop: string;
  antigravity: string;
  chatgptApi: string;
  curlInitialize: string;
  curlToolsList: string;
}

export function buildMcpSnippets({ url, key }: SnippetInput): McpSnippets {
  const k = key && key.length > 0 ? key : KEY_PLACEHOLDER;
  const headers = (extra = '') =>
    `  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -H "Authorization: Bearer ${k}"${extra}`;

  return {
    claudeCode: `claude mcp add --transport http instaauto ${url} \\
  --header "Authorization: Bearer ${k}"`,

    claudeDesktop: JSON.stringify(
      {
        mcpServers: {
          instaauto: {
            command: 'npx',
            args: ['-y', 'mcp-remote', url, '--header', 'Authorization:${INSTAUTO_MCP_KEY}'],
            env: { INSTAUTO_MCP_KEY: `Bearer ${k}` },
          },
        },
      },
      null,
      2,
    ),

    antigravity: JSON.stringify(
      {
        mcpServers: {
          instaauto: {
            serverUrl: url,
            headers: { Authorization: `Bearer ${k}` },
          },
        },
      },
      null,
      2,
    ),

    chatgptApi: `import OpenAI from 'openai';

const client = new OpenAI();

const response = await client.responses.create({
  model: 'gpt-5',
  input: 'How are my Instagram automations performing?',
  tools: [
    {
      type: 'mcp',
      server_label: 'instaauto',
      server_url: '${url}',
      authorization: '${k}',
      require_approval: 'always',
    },
  ],
});

console.log(response.output_text);`,

    curlInitialize: `curl -X POST ${url} \\
${headers()} \\
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"curl","version":"1.0.0"}}}'`,

    curlToolsList: `curl -X POST ${url} \\
${headers()} \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'`,
  };
}

export interface McpToolInfo {
  name: string;
  description: string;
  write: boolean;
}

export const MCP_TOOLS: McpToolInfo[] = [
  {
    name: 'get_account_summary',
    description: 'Plan, usage this billing period and limits.',
    write: false,
  },
  {
    name: 'list_instagram_accounts',
    description: 'Connected Instagram accounts and their status.',
    write: false,
  },
  {
    name: 'list_automations',
    description: 'Your automations with keywords, status and trigger counts.',
    write: false,
  },
  { name: 'get_automation', description: 'Full configuration of one automation.', write: false },
  {
    name: 'get_analytics',
    description: 'Comments detected and DMs sent over a daily/weekly/monthly range.',
    write: false,
  },
  {
    name: 'list_messages',
    description: 'Recent automated DMs and their delivery status.',
    write: false,
  },
  { name: 'list_templates', description: 'Your saved message templates.', write: false },
  { name: 'set_automation_active', description: 'Pause or resume an automation.', write: true },
  { name: 'create_template', description: 'Create a new message template.', write: true },
];

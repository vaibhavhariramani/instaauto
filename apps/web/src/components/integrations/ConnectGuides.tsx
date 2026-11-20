import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildMcpSnippets } from '@/lib/mcpSnippets';
import { CodeBlock } from './CodeBlock';

function Step({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function ConnectGuides({ url }: { url: string }) {
  const s = buildMcpSnippets({ url });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connect your AI tool</CardTitle>
        <CardDescription>
          Replace <code className="text-xs">YOUR_API_KEY</code> with the key you created above.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="claude-code">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
            <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
            <TabsTrigger value="antigravity">Antigravity</TabsTrigger>
            <TabsTrigger value="chatgpt">ChatGPT</TabsTrigger>
            <TabsTrigger value="other">Other / cURL</TabsTrigger>
          </TabsList>

          <TabsContent value="claude-code" className="space-y-3">
            <Step>
              Run this in a terminal. Add <code className="text-xs">--scope user</code> to make the
              server available in every project.
            </Step>
            <CodeBlock code={s.claudeCode} />
          </TabsContent>

          <TabsContent value="claude-desktop" className="space-y-3">
            <Step>
              Add this to <code className="text-xs">claude_desktop_config.json</code> (Settings →
              Developer → Edit Config), then restart Claude Desktop. It uses the{' '}
              <code className="text-xs">mcp-remote</code> bridge, so Node.js must be installed.
            </Step>
            <CodeBlock code={s.claudeDesktop} />
          </TabsContent>

          <TabsContent value="antigravity" className="space-y-3">
            <Step>
              Add this to your Antigravity <code className="text-xs">mcp_config.json</code>. The
              file location differs by version - commonly{' '}
              <code className="text-xs">~/.gemini/antigravity/mcp_config.json</code> or{' '}
              <code className="text-xs">~/.gemini/config/mcp_config.json</code>, or a
              workspace-level <code className="text-xs">.agents/mcp_config.json</code>. Check
              Antigravity&apos;s MCP docs or its manage MCP servers screen for the path your install
              reads.
            </Step>
            <CodeBlock code={s.antigravity} />
            <Step>
              The key is stored in plaintext in that file, so don&apos;t commit or share it.
            </Step>
          </TabsContent>

          <TabsContent value="chatgpt" className="space-y-3">
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              ChatGPT&apos;s connector screen only accepts OAuth or no authentication, so a static
              API key can&apos;t be entered there yet. OAuth sign-in for ChatGPT and claude.ai web
              connectors is planned but not available today.
            </p>
            <Step>
              What works now is the OpenAI API: the Responses API can call a remote MCP server with
              your key as the authorization value.
            </Step>
            <CodeBlock code={s.chatgptApi} />
          </TabsContent>

          <TabsContent value="other" className="space-y-3">
            <Step>
              Any MCP client that supports Streamable HTTP with a custom{' '}
              <code className="text-xs">Authorization</code> header works. To test the connection by
              hand:
            </Step>
            <CodeBlock label="1. Initialize" code={s.curlInitialize} />
            <CodeBlock label="2. List tools" code={s.curlToolsList} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

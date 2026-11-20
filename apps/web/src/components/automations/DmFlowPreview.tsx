import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DmFlowPreviewProps {
  requireFollow: boolean;
  openingMessage: string;
  preCheckMessage: string;
  followButtonLabel: string;
  plainButtonLabel: string;
  linkButtons: { label: string; url: string }[];
  sendCtaIfNeverFollows: boolean;
}

function Bubble({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm">
      {children}
    </div>
  );
}

function PreviewButton({ label, kind }: { label: string; kind: 'link' | 'quick' }) {
  return (
    <div
      className={
        kind === 'link'
          ? 'mt-1.5 w-full max-w-[85%] rounded-xl border border-primary/40 bg-primary/10 px-3 py-1.5 text-center text-xs font-medium text-primary'
          : 'mt-1.5 w-full max-w-[85%] rounded-xl border border-border bg-background px-3 py-1.5 text-center text-xs font-medium'
      }
    >
      {label}
    </div>
  );
}

function Stage({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          {step}
        </span>
        {title}
      </p>
      <div className="flex flex-col items-start">{children}</div>
    </div>
  );
}

function FinalMessage({
  message,
  linkButtons,
  plainButtonLabel,
}: {
  message: string;
  linkButtons: { label: string; url: string }[];
  plainButtonLabel: string;
}) {
  const links = linkButtons.filter((b) => b.label.trim());
  return (
    <>
      <Bubble>{message.trim() || 'Your message appears here.'}</Bubble>
      {links.map((b, i) => (
        <PreviewButton key={i} kind="link" label={`${b.label} ↗`} />
      ))}
      {links.length === 0 && plainButtonLabel.trim() && (
        <PreviewButton kind="quick" label={plainButtonLabel} />
      )}
    </>
  );
}

export function DmFlowPreview({
  requireFollow,
  openingMessage,
  preCheckMessage,
  followButtonLabel,
  plainButtonLabel,
  linkButtons,
  sendCtaIfNeverFollows,
}: DmFlowPreviewProps) {
  const final = (
    <FinalMessage
      message={openingMessage}
      linkButtons={linkButtons}
      plainButtonLabel={plainButtonLabel}
    />
  );

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">What your commenter receives</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requireFollow ? (
          <>
            <Stage step={1} title="Right after they comment">
              <Bubble>
                {preCheckMessage.trim() ||
                  'Thanks for stopping by! Tap below and I’ll send you access shortly ✨'}
              </Bubble>
              <PreviewButton kind="quick" label="Send me the link" />
            </Stage>
            <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" />
            <Stage step={2} title="If they don’t follow you yet">
              <Bubble>
                Looks like you haven&apos;t followed yet — follow me, then tap the button below.
              </Bubble>
              {followButtonLabel.trim() && (
                <PreviewButton kind="link" label={`${followButtonLabel} ↗`} />
              )}
              <PreviewButton kind="quick" label="I'm following ✅" />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {sendCtaIfNeverFollows
                  ? 'Sent again as a reminder; after 24 hours the link is sent anyway.'
                  : 'Reminded until they follow — only followers get the link.'}
              </p>
            </Stage>
            <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground" />
            <Stage step={3} title="Once they follow">
              {final}
            </Stage>
          </>
        ) : (
          <Stage step={1} title="Right after they comment">
            {final}
          </Stage>
        )}
      </CardContent>
    </Card>
  );
}

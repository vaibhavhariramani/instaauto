import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/utils/cn';
import { useInstagramAccounts } from '@/api/instagram';
import { useConversationMessages, useConversations } from '@/api/conversations';
import { timeAgo } from '@/utils/format';
import type { ConversationDto } from '@instaauto/shared';

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationDto;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        active ? 'bg-primary/10' : 'hover:bg-accent',
      )}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback>{conversation.participantUsername[0]?.toUpperCase() ?? '?'}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">@{conversation.participantUsername}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(conversation.lastMessageAt)}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {conversation.lastMessageDirection === 'OUTBOUND' && <span className="text-muted-foreground/70">You: </span>}
          {conversation.lastMessagePreview}
        </p>
      </div>
    </button>
  );
}

export function InboxPanel() {
  const { data: accounts } = useInstagramAccounts();
  const connectedAccount = accounts?.find((a) => a.status === 'CONNECTED');
  const { data: conversations, isLoading: conversationsLoading } = useConversations(connectedAccount?.id);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedId && conversations && conversations.length > 0) {
      setSelectedId(conversations[0]!.id);
    }
  }, [conversations, selectedId]);

  const { data: thread, isLoading: threadLoading } = useConversationMessages(connectedAccount?.id, selectedId);

  if (conversationsLoading) return <Skeleton className="h-96 w-full" />;

  if (!conversations || conversations.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No conversations yet"
        description="Direct messages you've sent or received will show up here as threaded conversations."
      />
    );
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-border md:grid-cols-[280px_1fr]">
      <div className="max-h-[560px] space-y-1 overflow-y-auto border-b border-border p-2 md:border-b-0 md:border-r">
        {conversations.map((c) => (
          <ConversationRow key={c.id} conversation={c} active={c.id === selectedId} onClick={() => setSelectedId(c.id)} />
        ))}
      </div>

      <div className="flex h-[560px] flex-col p-4">
        {threadLoading || !thread ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <>
            <div className="border-b border-border pb-3">
              <p className="font-medium">@{thread.conversation.participantUsername}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {thread.messages.map((m) => (
                <div key={m.id} className={cn('flex', m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
                      m.direction === 'OUTBOUND'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px]',
                        m.direction === 'OUTBOUND' ? 'text-primary-foreground/70' : 'text-muted-foreground',
                      )}
                    >
                      {timeAgo(m.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

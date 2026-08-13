import { useState } from 'react';
import { toast } from 'sonner';
import { MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInstagramAccounts, useRecentComments, useReplyToComment } from '@/api/instagram';
import { extractErrorMessage } from '@/api/client';
import { timeAgo } from '@/utils/format';
import type { RecentCommentDto } from '@instaauto/shared';

export default function CommentsPage() {
  const { data: accounts, isLoading: accountsLoading } = useInstagramAccounts();
  const connectedAccount = accounts?.find((a) => a.status === 'CONNECTED');
  const { data: comments, isLoading: commentsLoading, isFetching } = useRecentComments(connectedAccount?.id);
  const replyToComment = useReplyToComment(connectedAccount?.id);

  const [replyTarget, setReplyTarget] = useState<RecentCommentDto | null>(null);
  const [replyText, setReplyText] = useState('');

  const openReply = (comment: RecentCommentDto) => {
    setReplyTarget(comment);
    setReplyText('');
  };

  const sendReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    try {
      await replyToComment.mutateAsync({ commentId: replyTarget.id, message: replyText.trim() });
      toast.success('Reply posted');
      setReplyTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const isLoading = accountsLoading || commentsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Comments</h2>
        <p className="text-sm text-muted-foreground">
          The last 20 comments across your recent posts. Reply directly without waiting for an automation.
        </p>
      </div>

      {!connectedAccount && !accountsLoading ? (
        <EmptyState
          icon={MessageCircle}
          title="No Instagram account connected"
          description="Connect an Instagram account to see recent comments here."
        />
      ) : isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : !comments || comments.length === 0 ? (
        <EmptyState icon={MessageCircle} title="No comments yet" description="New comments on your posts will show up here." />
      ) : (
        <div className="rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Commenter</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="font-medium">@{comment.username}</TableCell>
                  <TableCell className="max-w-sm truncate" title={comment.text}>
                    {comment.text}
                  </TableCell>
                  <TableCell>
                    <a
                      href={comment.mediaPermalink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      {comment.mediaThumbnailUrl && (
                        <img
                          src={comment.mediaThumbnailUrl}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      )}
                      <span className="text-xs text-muted-foreground underline">View</span>
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{timeAgo(comment.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openReply(comment)}>
                      <Send className="h-3.5 w-3.5" /> Reply
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {isFetching && !isLoading && <p className="text-xs text-muted-foreground">Refreshing…</p>}

      <Dialog open={Boolean(replyTarget)} onOpenChange={(open) => !open && setReplyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to @{replyTarget?.username}</DialogTitle>
            <DialogDescription>{replyTarget?.text}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            maxLength={2200}
            placeholder="Write a public reply…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              loading={replyToComment.isPending}
              disabled={!replyText.trim()}
              onClick={sendReply}
            >
              <Send className="h-3.5 w-3.5" /> Post reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

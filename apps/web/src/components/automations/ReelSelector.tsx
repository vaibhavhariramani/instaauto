import { useEffect, useState } from 'react';
import type { ReelDto } from '@instaauto/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { Film, MessageCircle } from 'lucide-react';

const PAGE_SIZE = 12;

interface ReelSelectorProps {
  reels: ReelDto[] | undefined;
  isLoading: boolean;
  selectedReelId: string | undefined;
  onSelect: (reel: ReelDto) => void;
}

export function ReelSelector({ reels, isLoading, selectedReelId, onSelect }: ReelSelectorProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!reels || !selectedReelId) return;
    const index = reels.findIndex((r) => r.id === selectedReelId);
    if (index >= visibleCount) {
      setVisibleCount(Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels, selectedReelId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[9/16] w-full" />
        ))}
      </div>
    );
  }

  if (!reels || reels.length === 0) {
    return <EmptyState icon={Film} title="No Reels found" description="Connect an Instagram account with published Reels first." />;
  }

  const visibleReels = reels.slice(0, visibleCount);
  const remaining = reels.length - visibleReels.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {visibleReels.map((reel) => {
          const selected = reel.id === selectedReelId;
          return (
            <button
              key={reel.id}
              type="button"
              onClick={() => onSelect(reel)}
              className={cn(
                'group relative aspect-[9/16] overflow-hidden rounded-xl border-2 transition-all',
                selected ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-border',
              )}
            >
              <img src={reel.thumbnailUrl} alt={reel.caption} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white">
                <MessageCircle className="h-3 w-3" /> {reel.commentsCount}
              </div>
              {selected && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                  <span className="rounded-full bg-primary p-1.5 text-primary-foreground">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {remaining > 0 && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
            Show more ({remaining} left)
          </Button>
        </div>
      )}
    </div>
  );
}

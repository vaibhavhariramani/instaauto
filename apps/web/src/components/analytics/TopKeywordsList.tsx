import { Hash } from 'lucide-react';
import type { AnalyticsDto } from '@instaauto/shared';
import { EmptyState } from '@/components/shared/EmptyState';

export function TopKeywordsList({ keywords }: { keywords: AnalyticsDto['topKeywords'] }) {
  if (keywords.length === 0) {
    return <EmptyState icon={Hash} title="No keyword data yet" description="Once comments start matching, top keywords appear here." />;
  }

  const max = Math.max(...keywords.map((k) => k.count), 1);

  return (
    <div className="space-y-3">
      {keywords.map((k) => (
        <div key={k.keyword} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{k.keyword}</span>
            <span className="text-muted-foreground">{k.count}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              style={{ width: `${(k.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

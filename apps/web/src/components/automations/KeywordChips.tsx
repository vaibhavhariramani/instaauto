import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

interface KeywordChipsProps {
  keywords: string[];
  onRemove?: (keyword: string) => void;
  className?: string;
}

export function KeywordChips({ keywords, onRemove, className }: KeywordChipsProps) {
  if (keywords.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {keywords.map((keyword) => (
        <Badge key={keyword} variant="secondary" className="gap-1 py-1">
          {keyword}
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(keyword)}
              className="rounded-full p-0.5 hover:bg-background/60"
              aria-label={`Remove ${keyword}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}

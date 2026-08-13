import { useState } from 'react';
import { KEYWORD_SUGGESTIONS } from '@instaauto/shared';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { KeywordChips } from './KeywordChips';
import { cn } from '@/utils/cn';

interface KeywordInputProps {
  value: string[];
  onChange: (keywords: string[]) => void;
}

export function KeywordInput({ value, onChange }: KeywordInputProps) {
  const [draft, setDraft] = useState('');

  const addKeyword = (raw: string) => {
    const keyword = raw.trim().toLowerCase();
    if (!keyword || value.includes(keyword)) return;
    onChange([...value, keyword]);
    setDraft('');
  };

  const removeKeyword = (keyword: string) => onChange(value.filter((k) => k !== keyword));

  const availableSuggestions = KEYWORD_SUGGESTIONS.filter((s) => !value.includes(s));

  return (
    <div className="space-y-3">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKeyword(draft);
          }
        }}
        placeholder='Type a keyword and press Enter (e.g. "send me")'
      />
      <KeywordChips keywords={value} onRemove={removeKeyword} />
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {availableSuggestions.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className={cn('cursor-pointer hover:bg-accent')}
              onClick={() => addKeyword(s)}
            >
              + {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

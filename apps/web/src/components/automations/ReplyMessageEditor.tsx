import { useRef } from 'react';
import { TEMPLATE_VARIABLES } from '@instaauto/shared';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ReplyMessageEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function renderPreview(content: string): string {
  return content
    .replace(/\{\{\s*username\s*\}\}/g, 'traveler_jane')
    .replace(/\{\{\s*first_name\s*\}\}/g, 'Jane')
    .replace(/\{\{\s*reel_title\s*\}\}/g, 'The one habit that changed everything');
}

export function ReplyMessageEditor({ value, onChange }: ReplyMessageEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(`${value}${variable}`);
      return;
    }
    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${variable}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        maxLength={1000}
        placeholder={'Hi {{username}} 👋\nThanks for commenting! Here\'s your free guide: https://example.com'}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Insert variable:</span>
        {TEMPLATE_VARIABLES.map((v) => (
          <Badge
            key={v.key}
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            title={v.description}
            onClick={() => insertVariable(v.key)}
          >
            {v.key}
          </Badge>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{value.length}/1000</span>
      </div>
      <Card className="bg-muted/40">
        <CardContent className="pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
          <p className="whitespace-pre-wrap text-sm">{renderPreview(value) || 'Your DM preview will appear here.'}</p>
        </CardContent>
      </Card>
    </div>
  );
}

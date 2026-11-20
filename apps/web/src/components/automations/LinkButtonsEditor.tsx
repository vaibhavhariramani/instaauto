import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface LinkButtonValue {
  label: string;
  url: string;
}

interface LinkButtonsEditorProps {
  values: LinkButtonValue[];
  onChange: (values: LinkButtonValue[]) => void;
  max?: number;
}

export function LinkButtonsEditor({ values, onChange, max = 3 }: LinkButtonsEditorProps) {
  const update = (index: number, patch: Partial<LinkButtonValue>) => {
    onChange(values.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  };

  return (
    <div className="space-y-2">
      {values.map((button, i) => (
        <div key={i} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
          <Input
            value={button.label}
            maxLength={20}
            placeholder="Button label"
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <Input
            value={button.url}
            type="url"
            placeholder="https://example.com/guide"
            onChange={(e) => update(i, { url: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {values.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...values, { label: '', url: '' }])}
        >
          <Plus className="h-3.5 w-3.5" /> Add link button
        </Button>
      )}
    </div>
  );
}

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MultiTextEditorProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  max?: number;
}

export function MultiTextEditor({ values, onChange, placeholder, max = 10 }: MultiTextEditorProps) {
  const rows = values.length > 0 ? values : [''];

  const update = (index: number, next: string) => {
    onChange(rows.map((v, i) => (i === index ? next : v)));
  };

  return (
    <div className="space-y-2">
      {rows.map((value, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={value}
            maxLength={2200}
            placeholder={placeholder}
            onChange={(e) => update(i, e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove variation"
            disabled={rows.length === 1 && value === ''}
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {rows.length < max && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, ''])}>
          <Plus className="h-3.5 w-3.5" /> Add variation
        </Button>
      )}
    </div>
  );
}

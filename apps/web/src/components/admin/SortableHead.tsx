import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/utils/cn';
import type { SortDir } from './sort';

interface SortableHeadProps<K extends string> {
  label: string;
  column: K;
  activeColumn: K;
  dir: SortDir;
  onSort: (column: K) => void;
  className?: string;
}

export function SortableHead<K extends string>({
  label,
  column,
  activeColumn,
  dir,
  onSort,
  className,
}: SortableHeadProps<K>) {
  const active = column === activeColumn;
  const Icon = !active ? ArrowUpDown : dir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', !active && 'opacity-50')} />
      </button>
    </TableHead>
  );
}

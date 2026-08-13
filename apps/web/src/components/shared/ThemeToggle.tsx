import { Monitor, Moon, Sun } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useUiStore();
  return (
    <div className={cn('inline-flex items-center rounded-lg bg-muted p-1', className)}>
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          onClick={() => setTheme(value)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
            theme === value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}

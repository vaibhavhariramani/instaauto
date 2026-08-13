import { Toaster as Sonner } from 'sonner';
import { useUiStore } from '@/store/uiStore';

export function Toaster() {
  const theme = useUiStore((s) => s.resolvedTheme);
  return (
    <Sonner
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border border-border shadow-lg',
        },
      }}
    />
  );
}

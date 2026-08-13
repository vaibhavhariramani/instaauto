import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: 'violet' | 'emerald' | 'amber' | 'blue';
  delay?: number;
}

const ACCENTS: Record<NonNullable<StatCardProps['accent']>, string> = {
  violet: 'from-violet-600 to-fuchsia-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  blue: 'from-blue-500 to-indigo-500',
};

export function StatCard({ label, value, icon: Icon, accent = 'violet', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 pt-6">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white',
              ACCENTS[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

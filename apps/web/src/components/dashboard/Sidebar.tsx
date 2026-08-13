import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3,
  ChevronsLeft,
  CreditCard,
  Instagram,
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  Settings,
  Sparkles,
  Text,
  Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUiStore } from '@/store/uiStore';
import { ROUTES } from '@/constants/routes';

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.automations, label: 'Automations', icon: Zap },
  { to: ROUTES.messages, label: 'Messages', icon: MessageSquare },
  { to: ROUTES.comments, label: 'Comments', icon: MessageCircle },
  { to: ROUTES.templates, label: 'Templates', icon: Text },
  { to: ROUTES.analytics, label: 'Analytics', icon: BarChart3 },
  { to: ROUTES.instagram, label: 'Instagram', icon: Instagram },
  { to: ROUTES.settings, label: 'Settings', icon: Settings },
  { to: ROUTES.billing, label: 'Billing', icon: CreditCard },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 80 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/60 backdrop-blur-xl md:flex"
    >
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        {!sidebarCollapsed && <span className="text-lg font-semibold tracking-tight">InstaAuto</span>}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronsLeft className={cn('h-[18px] w-[18px] transition-transform', sidebarCollapsed && 'rotate-180')} />
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}

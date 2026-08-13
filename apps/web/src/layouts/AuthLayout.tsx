import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-blob" />
        <div className="absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl animate-blob [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-blob [animation-delay:4s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <Link to={ROUTES.home} className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-xl tracking-tight">InstaAuto</span>
        </Link>
        <Outlet />
      </motion.div>
    </div>
  );
}

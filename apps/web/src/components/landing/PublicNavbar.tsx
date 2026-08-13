import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { ROUTES } from '@/constants/routes';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function PublicNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-40 w-full"
    >
      <div className="glass mx-auto mt-3 flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 shadow-sm sm:px-6">
        <Link to={ROUTES.home} className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">InstaAuto</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link to={ROUTES.login}>Log in</Link>
          </Button>
          <Button variant="gradient" size="sm" asChild>
            <Link to={ROUTES.login}>Get started free</Link>
          </Button>
        </div>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="glass mx-3 mt-2 flex flex-col gap-3 rounded-2xl p-4 md:hidden"
        >
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm font-medium">
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to={ROUTES.login}>Log in</Link>
            </Button>
            <Button variant="gradient" size="sm" className="flex-1" asChild>
              <Link to={ROUTES.login}>Get started</Link>
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

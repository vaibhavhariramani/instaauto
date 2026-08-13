import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-24 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl animate-blob" />
        <div className="absolute -right-16 top-20 h-96 w-96 rounded-full bg-fuchsia-500/25 blur-3xl animate-blob [animation-delay:2s]" />
        <div className="absolute left-1/3 top-96 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl animate-blob [animation-delay:4s]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Built on the official Instagram Messaging API
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl"
        >
          Turn Reel comments into <span className="text-gradient">instant DMs</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Someone comments <span className="font-medium text-foreground">&ldquo;send me&rdquo;</span> on your Reel — InstaAuto
          sends your guide, course link, or discount code straight to their DMs. No spreadsheets, no copy-paste, no
          missed leads.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button variant="gradient" size="lg" asChild>
            <Link to={ROUTES.login}>
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <a href="#features">See how it works</a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass relative mx-auto mt-20 max-w-3xl rounded-3xl p-6 text-left shadow-2xl sm:p-8"
        >
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            <div>
              <p className="text-sm font-semibold">demo.creator</p>
              <p className="text-xs text-muted-foreground">Reel · 24.8K followers</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3">
            <MessageCircle className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-sm">
              <span className="font-medium">@traveler_jane</span> send me 🙌
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-4 flex items-start gap-3 rounded-2xl bg-primary/5 p-4"
          >
            <Send className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm">
              Hey @traveler_jane 👋 Thanks for commenting! Here&apos;s the guide you requested →{' '}
              <span className="text-primary underline">your-link.com</span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

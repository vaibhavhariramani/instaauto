import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 px-8 py-16 text-center text-white sm:px-16"
      >
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-white/20 blur-3xl animate-blob" />
          <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-white/10 blur-3xl animate-blob [animation-delay:3s]" />
        </div>
        <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to automate your Instagram DMs?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-white/80">
          Connect your Instagram Business account and launch your first automation in under five minutes.
        </p>
        <Button size="lg" variant="secondary" className="relative mt-8" asChild>
          <Link to={ROUTES.login}>
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}

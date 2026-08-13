import { motion } from 'framer-motion';
import { BarChart3, MessageSquareText, ShieldCheck, Sparkles, Timer, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const FEATURES = [
  {
    icon: Zap,
    title: 'Keyword-triggered DMs',
    description: 'Detect comments like "send me" or "guide" in real time and reply instantly via Instagram DM.',
  },
  {
    icon: ShieldCheck,
    title: 'Meta-compliant by design',
    description: "Runs on the official Instagram Messaging API and Private Replies — no scraping, no bans.",
  },
  {
    icon: MessageSquareText,
    title: 'Reusable templates',
    description: 'Save free guides, course links, discount codes, and consultations as one-click templates.',
  },
  {
    icon: Timer,
    title: 'No duplicate replies',
    description: "Each follower gets exactly one DM per automation — no spam, no repeat sends.",
  },
  {
    icon: BarChart3,
    title: 'Real analytics',
    description: 'Track comments detected, DMs sent, top keywords, and your best-performing Reels.',
  },
  {
    icon: Sparkles,
    title: 'Built for creators',
    description: 'Set it up once per Reel in under two minutes — no code, no Zapier, no dev required.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to automate DMs</h2>
        <p className="mt-4 text-muted-foreground">
          A complete toolkit for turning engaged commenters into leads, customers, and subscribers.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="pt-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

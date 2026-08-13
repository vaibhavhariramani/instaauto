import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TESTIMONIALS = [
  {
    name: 'Maya Chen',
    handle: '@maya.builds',
    quote:
      "InstaAuto replaced three hours of manual DM-ing every week. I post a Reel, comment 'guide' shows up, and it's handled before I even open the app.",
  },
  {
    name: 'Diego Ramirez',
    handle: '@diego.fitness',
    quote:
      'The keyword matching is scarily accurate. I run five different automations across my Reels and none of them collide.',
  },
  {
    name: 'Priya Nair',
    handle: '@priya.designs',
    quote:
      "Setup took less than five minutes and it's been running for two months without a single failed DM I didn't know about.",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="border-y border-border/60 bg-muted/30 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Creators are shipping DMs on autopilot</h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.handle}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card className="h-full">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star key={idx} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{t.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.handle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

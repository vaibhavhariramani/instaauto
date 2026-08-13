import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { PLAN_TIERS, type SubscriptionPlan } from '@instaauto/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { ROUTES } from '@/constants/routes';

const PLAN_ORDER: SubscriptionPlan[] = ['STARTER', 'PRO', 'BUSINESS'];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
        <p className="mt-4 text-muted-foreground">Start free for 14 days. Cancel anytime.</p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-muted p-1">
          <button
            onClick={() => setYearly(false)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors', !yearly && 'bg-background shadow-sm')}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn('rounded-full px-4 py-1.5 text-sm font-medium transition-colors', yearly && 'bg-background shadow-sm')}
          >
            Yearly <span className="text-primary">-20%</span>
          </button>
        </div>
      </div>

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {PLAN_ORDER.map((planKey, i) => {
          const plan = PLAN_TIERS[planKey];
          const price = yearly ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;
          const isPopular = planKey === 'PRO';
          return (
            <motion.div
              key={planKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card
                className={cn(
                  'relative h-full transition-transform hover:-translate-y-1',
                  isPopular && 'border-primary shadow-xl shadow-primary/10',
                )}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                    Most popular
                  </Badge>
                )}
                <CardContent className="pt-8">
                  <h3 className="font-semibold">{plan.label}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">${price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <Button variant={isPopular ? 'gradient' : 'outline'} className="mt-6 w-full" asChild>
                    <Link to={ROUTES.login}>Get started</Link>
                  </Button>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

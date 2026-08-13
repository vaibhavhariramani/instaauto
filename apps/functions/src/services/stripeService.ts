import Stripe from 'stripe';
import { PLAN_TIERS, type SubscriptionPlan } from '@instaauto/shared';
import { config, stripeConfigured } from '../config/env';
import { prisma } from '../lib/prisma';
import { ApiError } from '../middleware/errors';
import { logger } from '../lib/logger';
import { SubscriptionStatus, type SubscriptionPlan as PrismaSubscriptionPlan, type User } from '@prisma/client';

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeConfigured) {
    throw ApiError.serviceUnavailable('Billing is not configured on this server yet. Set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET.');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(config.STRIPE_SECRET_KEY!);
  }
  return stripeClient;
}

function priceIdFor(plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly'): string {
  const tier = PLAN_TIERS[plan];
  const envKey = billingCycle === 'monthly' ? tier.stripePriceIdMonthlyEnv : tier.stripePriceIdYearlyEnv;
  const priceId = process.env[envKey];
  if (!priceId) {
    throw ApiError.serviceUnavailable(`Stripe price id for ${plan} (${billingCycle}) is not configured (${envKey}).`);
  }
  return priceId;
}

async function ensureStripeCustomer(user: User): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;
  const stripe = getStripe();
  const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

export async function createCheckoutSession(
  user: User,
  plan: SubscriptionPlan,
  billingCycle: 'monthly' | 'yearly',
): Promise<{ url: string }> {
  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(user);
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceIdFor(plan, billingCycle), quantity: 1 }],
    success_url: `${config.FRONTEND_URL}/billing?checkout=success`,
    cancel_url: `${config.FRONTEND_URL}/billing?checkout=cancelled`,
    metadata: { userId: user.id, plan },
  });
  if (!session.url) throw ApiError.internal('Stripe did not return a checkout URL');
  return { url: session.url };
}

export async function createPortalSession(user: User): Promise<{ url: string }> {
  const stripe = getStripe();
  const customerId = await ensureStripeCustomer(user);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${config.FRONTEND_URL}/billing`,
  });
  return { url: session.url };
}

export async function listInvoices(user: User) {
  if (!user.stripeCustomerId || !stripeConfigured) return [];
  const stripe = getStripe();
  const invoices = await stripe.invoices.list({ customer: user.stripeCustomerId, limit: 20 });
  return invoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    amountPaid: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    createdAt: new Date(inv.created * 1000).toISOString(),
    hostedInvoiceUrl: inv.hosted_invoice_url,
  }));
}

export function constructWebhookEvent(rawBody: Buffer, signature: string | undefined): Stripe.Event {
  const stripe = getStripe();
  if (!signature) throw ApiError.badRequest('Missing Stripe-Signature header');
  return stripe.webhooks.constructEvent(rawBody, signature, config.STRIPE_WEBHOOK_SECRET!);
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as PrismaSubscriptionPlan | undefined;
      if (userId && plan) {
        await prisma.user.update({
          where: { id: userId },
          data: { subscriptionPlan: plan, subscriptionStatus: SubscriptionStatus.ACTIVE },
        });
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: subscription.customer as string } });
      if (!user) break;
      const status =
        subscription.status === 'active'
          ? SubscriptionStatus.ACTIVE
          : subscription.status === 'past_due'
            ? SubscriptionStatus.PAST_DUE
            : subscription.status === 'trialing'
              ? SubscriptionStatus.TRIALING
              : SubscriptionStatus.CANCELED;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: status,
          subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      break;
    }
    default:
      logger.info({ type: event.type }, 'Unhandled Stripe webhook event type');
  }
}

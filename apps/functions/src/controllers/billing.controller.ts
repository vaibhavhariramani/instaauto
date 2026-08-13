import type { Response } from 'express';
import type { CreateCheckoutSessionInput } from '@instaauto/shared';
import { PLAN_TIERS } from '@instaauto/shared';
import * as stripeService from '../services/stripeService';
import { getUserById } from '../services/authService';
import type { AuthedRequest } from '../middleware/auth';

export async function plans(_req: AuthedRequest, res: Response): Promise<void> {
  res.json(PLAN_TIERS);
}

export async function checkout(req: AuthedRequest, res: Response): Promise<void> {
  const { plan, billingCycle } = req.body as CreateCheckoutSessionInput;
  const user = await getUserById(req.userId);
  const session = await stripeService.createCheckoutSession(user, plan, billingCycle);
  res.json(session);
}

export async function portal(req: AuthedRequest, res: Response): Promise<void> {
  const user = await getUserById(req.userId);
  const session = await stripeService.createPortalSession(user);
  res.json(session);
}

export async function invoices(req: AuthedRequest, res: Response): Promise<void> {
  const user = await getUserById(req.userId);
  const list = await stripeService.listInvoices(user);
  res.json(list);
}

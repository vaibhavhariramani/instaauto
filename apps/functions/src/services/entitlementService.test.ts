import { describe, expect, it } from 'vitest';
import { getEffectivePlan, getEffectiveTier } from './entitlementService';

describe('getEffectivePlan', () => {
  it('returns STARTER for a never-upgraded default account', () => {
    expect(getEffectivePlan({ subscriptionPlan: 'STARTER', subscriptionStatus: 'NONE' })).toBe(
      'STARTER',
    );
  });

  it('grants the paid plan when the subscription is ACTIVE', () => {
    expect(getEffectivePlan({ subscriptionPlan: 'PRO', subscriptionStatus: 'ACTIVE' })).toBe('PRO');
  });

  it('grants the paid plan while TRIALING', () => {
    expect(getEffectivePlan({ subscriptionPlan: 'BUSINESS', subscriptionStatus: 'TRIALING' })).toBe(
      'BUSINESS',
    );
  });

  it('falls back to STARTER when a paid plan has lapsed to PAST_DUE', () => {
    expect(getEffectivePlan({ subscriptionPlan: 'PRO', subscriptionStatus: 'PAST_DUE' })).toBe(
      'STARTER',
    );
  });

  it('falls back to STARTER when a paid plan was CANCELED', () => {
    expect(getEffectivePlan({ subscriptionPlan: 'BUSINESS', subscriptionStatus: 'CANCELED' })).toBe(
      'STARTER',
    );
  });

  it('falls back to STARTER when checkout was only started (NONE) for a paid plan column', () => {
    // Defensive case: subscriptionPlan should never be non-STARTER with status NONE in practice
    // (the webhook sets ACTIVE in the same write that sets the plan), but if it ever happened,
    // an unverified paid-looking plan must never grant paid-tier limits.
    expect(getEffectivePlan({ subscriptionPlan: 'PRO', subscriptionStatus: 'NONE' })).toBe(
      'STARTER',
    );
  });
});

describe('getEffectiveTier', () => {
  it('returns the Starter tier limits for a lapsed Pro subscription', () => {
    const tier = getEffectiveTier({ subscriptionPlan: 'PRO', subscriptionStatus: 'CANCELED' });
    expect(tier.automationLimit).toBe(3);
    expect(tier.dmLimitPerMonth).toBe(500);
    expect(tier.instagramAccountLimit).toBe(1);
  });

  it('returns unlimited limits for an active Business subscription', () => {
    const tier = getEffectiveTier({ subscriptionPlan: 'BUSINESS', subscriptionStatus: 'ACTIVE' });
    expect(tier.automationLimit).toBe(-1);
    expect(tier.dmLimitPerMonth).toBe(-1);
    expect(tier.instagramAccountLimit).toBe(-1);
  });
});

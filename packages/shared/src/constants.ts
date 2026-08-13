import { SubscriptionPlan, TemplateCategory } from './enums.js';

export const PLAN_TIERS: Record<
  SubscriptionPlan,
  {
    label: string;
    priceMonthly: number;
    priceYearly: number;
    automationLimit: number;
    dmLimitPerMonth: number;
    features: string[];
    stripePriceIdMonthlyEnv: string;
    stripePriceIdYearlyEnv: string;
  }
> = {
  STARTER: {
    label: 'Starter',
    priceMonthly: 19,
    priceYearly: 182,
    automationLimit: 3,
    dmLimitPerMonth: 500,
    features: [
      '3 active automations',
      '500 DMs / month',
      '1 Instagram account',
      'Basic analytics',
      'Email support',
    ],
    stripePriceIdMonthlyEnv: 'STRIPE_PRICE_STARTER_MONTHLY',
    stripePriceIdYearlyEnv: 'STRIPE_PRICE_STARTER_YEARLY',
  },
  PRO: {
    label: 'Pro',
    priceMonthly: 49,
    priceYearly: 470,
    automationLimit: 15,
    dmLimitPerMonth: 5000,
    features: [
      '15 active automations',
      '5,000 DMs / month',
      '3 Instagram accounts',
      'Advanced analytics',
      'Templates library',
      'Priority support',
    ],
    stripePriceIdMonthlyEnv: 'STRIPE_PRICE_PRO_MONTHLY',
    stripePriceIdYearlyEnv: 'STRIPE_PRICE_PRO_YEARLY',
  },
  BUSINESS: {
    label: 'Business',
    priceMonthly: 129,
    priceYearly: 1238,
    automationLimit: -1,
    dmLimitPerMonth: -1,
    features: [
      'Unlimited automations',
      'Unlimited DMs',
      'Unlimited Instagram accounts',
      'Custom analytics exports',
      'Dedicated success manager',
      '24/7 priority support',
    ],
    stripePriceIdMonthlyEnv: 'STRIPE_PRICE_BUSINESS_MONTHLY',
    stripePriceIdYearlyEnv: 'STRIPE_PRICE_BUSINESS_YEARLY',
  },
};

export const TEMPLATE_CATEGORY_META: Record<
  TemplateCategory,
  { label: string; icon: string; color: string }
> = {
  FREE_GUIDE: { label: 'Free Guide', icon: 'BookOpen', color: 'violet' },
  COURSE_LINK: { label: 'Course Link', icon: 'GraduationCap', color: 'blue' },
  DISCOUNT_CODE: { label: 'Discount Code', icon: 'Tag', color: 'emerald' },
  CONSULTATION: { label: 'Consultation', icon: 'CalendarClock', color: 'amber' },
  LEAD_MAGNET: { label: 'Lead Magnet', icon: 'Magnet', color: 'pink' },
  CUSTOM: { label: 'Custom', icon: 'Sparkles', color: 'slate' },
};

export const KEYWORD_SUGGESTIONS = [
  'send me',
  'guide',
  'ebook',
  'course',
  'pricing',
  'info',
  'link',
  'free',
];

export const TEMPLATE_VARIABLES = [
  { key: '{{username}}', description: "Commenter's Instagram username" },
  { key: '{{first_name}}', description: "Commenter's first name, if available" },
  { key: '{{reel_title}}', description: 'Caption/title of the Reel that was commented on' },
] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_DAYS = 7;

export const META_GRAPH_API_VERSION = 'v21.0';
export const META_GRAPH_BASE_URL = `https://graph.facebook.com/${META_GRAPH_API_VERSION}`;

// Instagram API with Instagram Login (direct business login, no linked Facebook Page).
export const IG_OAUTH_AUTHORIZE_URL = 'https://www.instagram.com/oauth/authorize';
export const IG_OAUTH_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
export const IG_GRAPH_BASE_URL = `https://graph.instagram.com/${META_GRAPH_API_VERSION}`;
export const IG_GRAPH_OAUTH_BASE_URL = 'https://graph.instagram.com';

export const MAX_DM_RETRY_ATTEMPTS = 5;
export const RETRY_BACKOFF_BASE_MINUTES = 2;

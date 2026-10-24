/** Single source of truth for marketing + billing list prices (excl. tax). */

export type BillingPeriod = 'monthly' | 'annual';
export type PricingCurrency = 'INR' | 'USD';

export interface MoneyAmount {
  inr: number;
  usd: number;
}

export interface MonthlyPlan {
  id: string;
  name: string;
  description: string;
  monthly: MoneyAmount;
  annual: MoneyAmount;
  badge?: string;
  popular?: boolean;
  remediationRequired?: boolean;
  assessRequired?: boolean;
  noAuditRequired?: boolean;
  /** India-focused regulatory tier */
  indiaPack?: boolean;
  features: readonly string[];
  cta: { text: string; href: string };
  checkoutNote?: string;
}

export interface OneTimeSku {
  id: string;
  name: string;
  subtitle: string;
  price: MoneyAmount;
  priceNote?: string;
  originalPrice?: MoneyAmount;
  badge?: string;
  popular?: boolean;
  highlighted?: boolean;
  indiaPack?: boolean;
  features: readonly string[];
  cta: { text: string; href: string };
}

export const PRICING_CATALOG = {
  freeTier: {
    name: 'Free scan',
    description: '1 website · 1 scan · WCAG 2.2 AA issue summary',
    cta: { text: 'Run free scan', href: '/scan' },
    signupCta: { text: 'Create free account', href: '/signup' },
  },

  /** STEP 01 — Monthly subscriptions */
  monthlyPlans: [
    {
      id: 'widget',
      name: 'Widget Only',
      description: 'Standalone accessibility widget — works on any website. No audit required.',
      monthly: { inr: 999, usd: 12 },
      annual: { inr: 9990, usd: 120 },
      badge: 'No audit required',
      noAuditRequired: true,
      features: [
        '14-day free trial',
        'Accessibility widget (multi-language UI)',
        'Font size, contrast & dyslexia tools',
        'Keyboard navigation enhancements',
        'Widget updates & uptime monitoring',
        '10 document scans / month',
      ],
      cta: { text: 'Contact sales', href: '/contact?plan=widget' },
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'WCAG-first scanning and reporting for teams getting started worldwide.',
      monthly: { inr: 1999, usd: 24 },
      annual: { inr: 19999, usd: 240 },
      popular: true,
      badge: 'Most popular',
      features: [
        'Everything in Widget Only',
        '20 WCAG 2.2 AA scans per month',
        '100 document scans / month',
        'Batch upload (25 files)',
        'PDF reports (WCAG 2.2 AA)',
        'Optional India pack (IS 17802) on request',
        'Violation severity breakdown',
        'Scan history & email export',
      ],
      cta: { text: 'Contact sales', href: '/contact?plan=professional' },
    },
    {
      id: 'compliance_shield',
      name: 'Stay Compliant',
      description: 'Ongoing monitoring after your site is remediated and certified.',
      monthly: { inr: 4999, usd: 59 },
      annual: { inr: 49990, usd: 590 },
      remediationRequired: true,
      assessRequired: true,
      features: [
        'Everything in Professional',
        'Unlimited WCAG 2.2 AA scans',
        'Unlimited document scans',
        'Batch upload (100 files)',
        'Quarterly specialist spot-check',
        'Annual compliance assessment report',
        'Badge renewal & priority support',
      ],
      cta: { text: 'Contact sales', href: '/contact?plan=stay-compliant' },
      checkoutNote: 'assess',
    },
    {
      id: 'regulatory_defense',
      name: 'Regulatory Defense',
      description:
        'For listed companies, BFSI, PSUs, and government-facing organisations in India.',
      monthly: { inr: 7999, usd: 99 },
      annual: { inr: 79990, usd: 990 },
      badge: 'India pack',
      indiaPack: true,
      remediationRequired: true,
      assessRequired: true,
      features: [
        'Website + mobile app monitoring',
        'Everything in Stay Compliant',
        'IS 17802, GIGW & RPwD evidence packs',
        'SEBI assessment (1/year included)',
        'Unlimited document scans + API access',
        'Batch upload (500 files)',
        '72-hour regulatory triage',
        'IAAP-certified sign-off (annual)',
      ],
      cta: { text: 'Contact sales', href: '/contact?plan=regulatory-defense' },
      checkoutNote: 'assess',
    },
  ] satisfies MonthlyPlan[],

  widgetDisclaimer:
    'The accessibility widget is a user-experience enhancement — not a compliance mechanism. It does not, on its own, make a site WCAG-, ADA-, EAA-, RPwD-, SEBI-, or GIGW-compliant. True compliance requires assessment, code-level remediation, and documented evidence.',

  /** STEP 02 — Remediation */
  remediation: [
    {
      id: 'remediation-small',
      name: 'Brochure site',
      subtitle: '1–15 pages · one-time remediation',
      price: { inr: 49999, usd: 599 },
      popular: true,
      priceNote: 'Scoped after assessment · contact sales for a quote',
      features: [
        'Alt text & colour contrast fixes',
        'Heading structure & keyboard navigation',
        'Form labels and mobile touch targets',
        'Accessibility statement page',
        'Re-scan verification before hand-off',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=remediation-small' },
    },
    {
      id: 'remediation-large',
      name: 'Larger / e-commerce site',
      subtitle: 'Transaction flows · portals',
      price: { inr: 99999, usd: 1199 },
      priceNote: 'Scoped after assessment · contact sales for a quote',
      features: [
        'Everything in Brochure site package',
        'Checkout & payment flow accessibility',
        'Template-level site-wide remediation',
        'PDF and document review',
        'Dedicated project manager',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=remediation-large' },
    },
  ] satisfies OneTimeSku[],

  /** ADD-ON — Standalone assessment */
  standaloneAssessment: {
    id: 'assess',
    name: 'Compliance Website Audit & Scan',
    subtitle: 'Standalone or bundled with monitoring',
    price: { inr: 4999, usd: 59 },
    badge: 'Free for first 100 customers',
    highlighted: true,
    priceNote: 'Launch offer — free for the first 100 customers · contact sales for details',
    features: [
      'WCAG 2.2 AA automated scan',
      'Hands-on manual review by specialists',
      'Keyboard and screen-reader testing',
      'Severity-ranked findings report',
      'Prioritized remediation roadmap',
      'Optional India pack (IS 17802 / GIGW / SEBI)',
      'Required before Stay Compliant & Regulatory Defense',
    ],
    cta: { text: 'Contact sales', href: '/contact?service=assess' },
  } satisfies OneTimeSku,

  addons: [
    {
      id: 'mobile-scan',
      name: 'Mobile app assessment',
      subtitle: 'Android APK / iOS IPA',
      price: { inr: 9999, usd: 119 },
      features: [
        'Native app scan (Appium)',
        'WCAG 2.2 AA mobile rules',
        'Screen-by-screen violation report',
        'Included with Regulatory Defense',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=mobile-scan' },
    },
    {
      id: 'document-batch-audit',
      name: 'Document Accessibility Batch Audit',
      subtitle: 'Up to 500 documents per batch',
      price: { inr: 15000, usd: 179 },
      priceNote: 'Ideal for document libraries and regulated archives',
      indiaPack: true,
      features: [
        'Up to 500 documents (PDF, Word, PowerPoint, Excel)',
        'Unified WCAG compliance report',
        'Optional GIGW checkpoint summary (India)',
        'Priority queue (2hr turnaround)',
        'Certificate-ready evidence pack',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=document-batch-audit' },
    },
  ] satisfies OneTimeSku[],

  reportFeatures: [
    'Accessibility score and severity breakdown',
    'WCAG 2.2 AA criterion mapping',
    'Page-by-page violation export',
    'Downloadable PDF for audit files',
    'Optional IS 17802 India-specific rule coverage',
    'GIGW & RPwD alignment summary (Regulatory Defense)',
  ],

  indiaCompliance: {
    gstNote:
      'INR invoices include 18% GST where applicable. USD invoices are issued without Indian GST; local VAT/sales tax may apply depending on your country. Government departments in India can pay via PO or annual contract.',
    links: [
      { label: 'WCAG 2.2 AA', href: '/wcag-2-2-aa' },
      { label: 'RPwD Act 2016', href: '/rpwd-act' },
      { label: 'IS 17802', href: '/is-17802' },
      { label: 'GIGW 3.0', href: '/gigw' },
      { label: 'SEBI Accessibility', href: '/sebi-accessibility' },
    ],
  },

  enterprise: {
    cta: { text: 'Contact sales', href: '/contact?plan=enterprise' },
    note: 'Multi-site portfolios, custom SLAs, and on-site training are scoped after your baseline scan. Available in INR or USD.',
    monthly: { inr: 12999, usd: 149 },
    annual: { inr: 129990, usd: 1490 },
  },

  rules: {
    gstRate: 0.18,
    assessPriceInr: 4999,
    assessPriceUsd: 59,
    assessLaunchFreeCustomerLimit: 100,
    professionalScansPerMonth: 20,
    remediationPerPageInr: 2000,
    remediationPerPageUsd: 24,
  },
} as const;

export const MONTHLY_PLANS = PRICING_CATALOG.monthlyPlans;

function pickAmount(money: MoneyAmount, currency: PricingCurrency): number {
  return currency === 'USD' ? money.usd : money.inr;
}

export function formatMoney(amount: number, currency: PricingCurrency): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** @deprecated Prefer formatMoney(amount, currency) */
export function formatInr(amount: number): string {
  return formatMoney(amount, 'INR');
}

export function formatPlanPrice(
  plan: Pick<MonthlyPlan, 'monthly' | 'annual'>,
  period: BillingPeriod,
  currency: PricingCurrency,
): string {
  const money = period === 'monthly' ? plan.monthly : plan.annual;
  const amount = pickAmount(money, currency);
  return `${formatMoney(amount, currency)}${period === 'annual' ? '/year' : '/month'}`;
}

export function formatOneTimePrice(
  sku: Pick<OneTimeSku, 'price'>,
  currency: PricingCurrency,
): string {
  return formatMoney(pickAmount(sku.price, currency), currency);
}

export function taxNote(currency: PricingCurrency): string {
  return currency === 'USD' ? 'Prices excl. local tax / VAT' : 'Prices excl. 18% GST';
}

export function assessCheckoutSubline(): string {
  return 'A Compliance Website Audit & Scan is required before Stay Compliant or Regulatory Defense monitoring begins. Contact sales to get started.';
}

export function auditCheckoutSubline(): string {
  return assessCheckoutSubline();
}

/** Legacy aliases kept for older imports */
export interface PublicPlan {
  id: string;
  name: string;
  description: string;
  monthlyPriceInr: number | null;
  annualPriceInr: number | null;
  badge?: string;
  popular?: boolean;
  features: readonly string[];
  cta: { text: string; href: string };
}

export const PUBLIC_PLANS: PublicPlan[] = [];

/** @deprecated */
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPriceInr: number;
  annualPriceInr: number;
  features: readonly string[];
  cta: { text: string; href: string };
}

export const MONITORING_PLANS: SubscriptionPlan[] = [];
export const SUBSCRIPTION_PLANS = MONITORING_PLANS;
export const PAID_PUBLIC_PLANS: PublicPlan[] = [];

export function formatSubscriptionPrice(
  monthlyPriceInr: number,
  annualPriceInr: number,
  period: BillingPeriod,
): string {
  return formatPlanPrice(
    {
      monthly: { inr: monthlyPriceInr, usd: Math.round(monthlyPriceInr / 83) },
      annual: { inr: annualPriceInr, usd: Math.round(annualPriceInr / 83) },
    },
    period,
    'INR',
  );
}

/**
 * Single source of truth for AccessibleNow India revenue model (INR, excl. GST).
 * Illustrative strategy prices — not Deque or third-party benchmarks.
 */

export type BillingPeriod = 'monthly' | 'annual';

export type ProductPlanId = 'developer' | 'professional' | 'enterprise';

export interface MonthlyPlan {
  id: ProductPlanId | 'widget_addon';
  name: string;
  description: string;
  /** null = custom / contact sales */
  monthlyPriceInr: number | null;
  annualPriceInr: number | null;
  badge?: string;
  popular?: boolean;
  /** Requires expert audit before full value (enterprise monitoring) */
  assessRequired?: boolean;
  features: readonly string[];
  cta: { text: string; href: string };
  checkoutNote?: 'assess' | 'custom';
}

export interface OneTimeSku {
  id: string;
  name: string;
  subtitle: string;
  /** Published “from” floor */
  priceInr: number;
  priceNote?: string;
  originalPriceInr?: number;
  badge?: string;
  popular?: boolean;
  highlighted?: boolean;
  features: readonly string[];
  cta: { text: string; href: string };
}

export type OfferBilling = 'one_time' | 'monthly';
export type DisplayCurrency = 'INR' | 'USD';

/** Indicative mid-market rate for the currency toggle — not a live FX feed. */
export const INR_PER_USD = 83;

export interface PublicOffer {
  id: string;
  name: string;
  subtitle: string;
  priceInr: number;
  billing: OfferBilling;
  includedScans?: number;
  overageInr?: number;
  badge?: string;
  popular?: boolean;
  highlighted?: boolean;
  priceNote: string;
  features: readonly string[];
  cta: { text: string; href: string };
}

export const AUTOMATION_DISCLAIMER =
  'Automated scanning alone cannot establish full WCAG conformance. Certified Assurance includes manual testing by a qualified accessibility auditor.';

export const PRICING_STRATEGY_DISCLAIMER =
  'Prices shown are AccessibleNow’s illustrative product strategy for the Indian market — not Deque Systems pricing or established market benchmarks.';

export const PRICING_CATALOG = {
  freeTier: {
    name: 'Free scan',
    description: '1 website · 1 scan · issue summary — acquisition channel, not full compliance',
    cta: { text: 'Run free scan', href: '/scan' },
    signupCta: { text: 'Create free account', href: '/signup' },
  },

  /** Product revenue — recurring SaaS */
  monthlyPlans: [
    {
      id: 'developer',
      name: 'Developer',
      description:
        'Detailed findings, AI remediation guidance, and repeat scans for one site — land-and-expand for engineers and QA.',
      monthlyPriceInr: 1499,
      annualPriceInr: 14990,
      badge: 'Start here',
      features: [
        '1 asset',
        '10 scans / month',
        'Detailed axe + IS 17802 findings',
        'AI remediation guidance (limited)',
        'Issue tracker',
        'Email support',
      ],
      cta: { text: 'Start Developer', href: '/signup?plan=developer' },
    },
    {
      id: 'professional',
      name: 'Professional',
      description:
        'Multiple projects, team workflows, reports, and Hindi/English widget — for organisations shipping accessible products.',
      monthlyPriceInr: 7999,
      annualPriceInr: 79990,
      popular: true,
      badge: 'Most popular',
      features: [
        'Everything in Developer',
        '10 assets · unlimited scans',
        'Accessibility widget (Hindi + English)',
        'PDF reports (WCAG 2.2 + IS 17802)',
        'Team roles · Learn progress',
        'Policy PR Gate · Dynamic journeys',
        'Priority support',
      ],
      cta: { text: 'Start Professional', href: '/signup?plan=professional' },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description:
        'Multi-domain monitoring, audit trails, governance, SEBI/GIGW/RPwD evidence — annual programme with expert support.',
      monthlyPriceInr: null,
      annualPriceInr: null,
      badge: 'BFSI & Govt',
      assessRequired: true,
      checkoutNote: 'custom',
      features: [
        'Unlimited assets & scans',
        'Posture · Analytics · Policy · Red',
        'SEBI / GIGW / RPwD evidence packs',
        'Monitoring digests & SLA options',
        'Training seats · dedicated CSM',
        'SSO / Keycloak org · API access',
        'Custom annual contract (from ₹2.5L/yr)',
      ],
      cta: { text: 'Talk to sales', href: '/contact?plan=enterprise' },
    },
  ] satisfies MonthlyPlan[],

  /** Optional add-on — not a lead plan */
  widgetAddon: {
    id: 'widget_addon',
    name: 'Widget only',
    description: 'Standalone accessibility widget when you do not need the full platform yet.',
    monthlyPriceInr: 1499,
    annualPriceInr: 14990,
    features: [
      'Hindi + English UI',
      'Font size, contrast & dyslexia tools',
      'Keyboard navigation enhancements',
      'Included free with Professional+',
    ],
    cta: { text: 'Contact sales', href: '/contact?plan=widget_addon' },
  } satisfies MonthlyPlan,

  widgetDisclaimer:
    'The accessibility widget is a user-experience enhancement — not a compliance mechanism. It does not, on its own, make a site WCAG-conformant. Conformance requires assessment, code-level remediation, and documented evidence.',

  automationDisclaimer: AUTOMATION_DISCLAIMER,
  strategyDisclaimer: PRICING_STRATEGY_DISCLAIMER,

  websiteOffers: [
    {
      id: 'access-widget',
      name: 'Access Widget',
      subtitle: 'Assistive overlay · any website',
      priceInr: 4999,
      billing: 'one_time',
      priceNote: 'one-time licence',
      features: [
        'Install on any website — no audit required',
        'Font size, contrast, and reading tools',
        'Keyboard-navigation aids',
        'Widget updates included',
        'Does not, on its own, establish WCAG conformance',
      ],
      cta: { text: 'Get Access Widget', href: '/contact?service=access-widget' },
    },
    {
      id: 'automated-site-scan',
      name: 'Automated Site Scan',
      subtitle: 'Findings only · no remediations',
      priceInr: 9999,
      billing: 'one_time',
      priceNote: 'one-time engagement',
      features: [
        'Full automated website scan',
        'Severity-ranked findings report (PDF)',
        'WCAG 2.2 AA rule coverage',
        'Page URL, selector, and issue summary',
        'No code changes or remediations included',
      ],
      cta: { text: 'Book a site scan', href: '/contact?service=automated-site-scan' },
    },
    {
      id: 'scan-remediation',
      name: 'Scan & Remediation',
      subtitle: 'Automated scan plus guided fixes',
      priceInr: 19999,
      billing: 'one_time',
      popular: true,
      badge: 'Most chosen',
      highlighted: true,
      priceNote: 'one-time engagement',
      features: [
        'Everything in Automated Site Scan',
        'AI-assisted remediations for safe, file-level fixes',
        'Prioritized fix list with owners',
        'Re-scan after the first fix pass',
        'Guidance for issues that need engineering',
      ],
      cta: { text: 'Start Scan & Remediation', href: '/contact?service=scan-remediation' },
    },
    {
      id: 'certified-assurance',
      name: 'Certified Assurance',
      subtitle: 'End-to-end programme · auditor-led',
      priceInr: 24999,
      billing: 'monthly',
      includedScans: 5,
      priceNote: 'per month · 5 website scans',
      features: [
        'Access Widget + Automated Site Scan + Scan & Remediation',
        'Manual testing by a certified accessibility auditor',
        '5 website scans included each month',
        'Keyboard and screen-reader evidence',
        'Monthly report your compliance team can file',
      ],
      cta: { text: 'Start Certified Assurance', href: '/contact?service=certified-assurance' },
    },
  ] satisfies PublicOffer[],

  documentOffer: {
    id: 'document-scan',
    name: 'Document Scan Programme',
    subtitle: 'PDF, Word, and presentations',
    priceInr: 0,
    billing: 'one_time',
    includedScans: 50,
    overageInr: 500,
    priceNote: '50 scans included, then billed per scan',
    features: [
      'Scan PDF, Word, and slide decks for accessibility barriers',
      'Up to 50 document scans included at no charge',
      'Published per-scan rate after the 50-scan allowance',
      'Reading-order, tags, and alternative-text findings',
      'Per-document report you can hand to authors',
    ],
    cta: { text: 'Start document scanning', href: '/document-scanner' },
  } satisfies PublicOffer,

  /** Expert services — project-based (published “from” floors) */
  expertServices: [
    {
      id: 'audit-web',
      name: 'Documented accessibility audit',
      subtitle: 'Website · automated + manual · from',
      priceInr: 24999,
      popular: true,
      highlighted: true,
      priceNote: 'Scoped after discovery call · contact sales',
      features: [
        'WCAG 2.2 AA + IS 17802 automated scan',
        'Manual keyboard & specialist review',
        'Severity-ranked findings report',
        'Prioritized remediation roadmap with owners',
      ],
      cta: { text: 'Book audit', href: '/contact?service=audit-web' },
    },
    {
      id: 'at-manual',
      name: 'Screen reader & keyboard testing',
      subtitle: 'AT-assisted journeys · from',
      priceInr: 19999,
      features: [
        'Keyboard-only walkthroughs',
        'Screen-reader / AT-sim evidence',
        'Failure map for critical flows',
        'Notes for remediation owners',
      ],
      cta: { text: 'Request AT testing', href: '/contact?service=at-manual' },
    },
    {
      id: 'remediation-small',
      name: 'Remediation — brochure site',
      subtitle: '1–15 pages · one-time · from',
      priceInr: 75000,
      features: [
        'Alt text, contrast, headings, keyboard',
        'Form labels & touch targets',
        'Accessibility statement page',
        'Re-scan verification before hand-off',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=remediation-small' },
    },
    {
      id: 'remediation-large',
      name: 'Remediation — portal / checkout',
      subtitle: 'Transaction flows · from',
      priceInr: 200000,
      features: [
        'Everything in brochure package',
        'Checkout / KYC / investor flows',
        'Template-level site-wide fixes',
        'Dedicated project manager',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=remediation-large' },
    },
    {
      id: 'mobile-scan',
      name: 'Mobile app assessment',
      subtitle: 'Android APK / iOS IPA · from',
      priceInr: 24999,
      features: [
        'Native app scan',
        'WCAG 2.2 + IS 17802 mobile rules',
        'Screen-by-screen report',
        'Included in many Enterprise deals',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=mobile-scan' },
    },
    {
      id: 'sebi-pack',
      name: 'SEBI evidence pack',
      subtitle: 'Listed companies · from',
      priceInr: 49999,
      features: [
        'SEBI circular–aligned report',
        'Evidence trail for board / compliance',
        'Annual reassessment option',
        'Often bundled in Enterprise',
      ],
      cta: { text: 'Contact sales', href: '/contact?service=sebi-pack' },
    },
  ] satisfies OneTimeSku[],

  reportFeatures: [
    'Accessibility score and severity breakdown',
    'WCAG 2.2 AA criterion mapping',
    'IS 17802 India-specific rule coverage',
    'Page-by-page violation export',
    'Downloadable PDF for audit files',
    'GIGW & RPwD alignment summary (Enterprise)',
  ],

  indiaCompliance: {
    gstNote:
      'We issue GST-compliant invoices for paid engagements (+18% GST). Registered businesses may claim ITC where applicable. Government departments can pay via PO or annual contract.',
    links: [
      { label: 'RPwD Act 2016', href: '/rpwd-act' },
      { label: 'IS 17802', href: '/is-17802' },
      { label: 'GIGW 3.0', href: '/gigw' },
      { label: 'SEBI Accessibility', href: '/sebi-accessibility' },
    ],
  },

  enterprise: {
    cta: { text: 'Talk to sales', href: '/contact?plan=enterprise' },
    fromAnnualInr: 250000,
    note: 'Multi-site portfolios, custom SLAs, training, and on-site programmes are scoped after your baseline scan and audit engagement.',
  },

  funnelCtas: {
    upgradeDeveloper: { text: 'Upgrade to Developer', href: '/signup?plan=developer' },
    bookAudit: { text: 'Book compliance audit', href: '/contact?service=audit-web' },
    talkEnterprise: { text: 'Talk to sales (Enterprise)', href: '/contact?plan=enterprise' },
  },

  rules: {
    gstRate: 0.18,
    assessPriceInr: 24999,
    assessLaunchFreeCustomerLimit: 100,
    developerScansPerMonth: 10,
    professionalScansPerMonth: null as number | null,
    remediationPerPageInr: 2000,
  },
} as const;

export const MONTHLY_PLANS = PRICING_CATALOG.monthlyPlans;

/** Remediation SKUs only */
export const REMEDIATION_SKUS = PRICING_CATALOG.expertServices.filter(
  (s) => s.id === 'remediation-small' || s.id === 'remediation-large',
);

export const WEBSITE_OFFERS = PRICING_CATALOG.websiteOffers;
export const DOCUMENT_OFFER = PRICING_CATALOG.documentOffer;
/** @deprecated Use WEBSITE_OFFERS */
export const AUDIT_PACKAGES = PRICING_CATALOG.websiteOffers;

export const STANDALONE_AUDIT = PRICING_CATALOG.expertServices.find((s) => s.id === 'audit-web')!;

export const EXPERT_ADDONS = PRICING_CATALOG.expertServices.filter(
  (s) => s.id === 'mobile-scan' || s.id === 'sebi-pack' || s.id === 'at-manual',
);

/** @deprecated */
export const remediation = REMEDIATION_SKUS;

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

export const PUBLIC_PLANS: PublicPlan[] = MONTHLY_PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  description: p.description,
  monthlyPriceInr: p.monthlyPriceInr,
  annualPriceInr: p.annualPriceInr,
  badge: p.badge,
  popular: p.popular,
  features: p.features,
  cta: p.cta,
}));

function formatInrStatic(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatInr(amount: number): string {
  return formatInrStatic(amount);
}

export function formatMoney(amountInr: number, currency: DisplayCurrency): string {
  if (currency === 'USD') {
    const usd = amountInr / INR_PER_USD;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(usd);
  }
  return formatInr(amountInr);
}

export function formatOfferPrice(offer: PublicOffer, currency: DisplayCurrency): string {
  if (offer.id === 'document-scan') {
    const overage = formatMoney(offer.overageInr ?? 500, currency);
    return `${offer.includedScans ?? 50} free · then ${overage}`;
  }
  const amount = formatMoney(offer.priceInr, currency);
  return offer.billing === 'monthly' ? `${amount}/mo` : amount;
}

export function formatPlanPrice(
  monthlyPriceInr: number | null,
  annualPriceInr: number | null,
  period: BillingPeriod,
): string {
  if (monthlyPriceInr == null || annualPriceInr == null) {
    return 'Custom';
  }
  const amount = period === 'monthly' ? monthlyPriceInr : annualPriceInr;
  return `${formatInr(amount)}${period === 'annual' ? '/year' : '/month'}`;
}

export function assessCheckoutSubline(): string {
  return 'A documented accessibility audit is recommended before Enterprise monitoring and evidence packs. Contact sales to get started.';
}

export function auditCheckoutSubline(): string {
  return assessCheckoutSubline();
}

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
export const PAID_PUBLIC_PLANS: PublicPlan[] = PUBLIC_PLANS.filter(
  (p) => p.monthlyPriceInr != null,
);

export function formatSubscriptionPrice(
  monthlyPriceInr: number | null,
  annualPriceInr: number | null,
  period: BillingPeriod,
): string {
  return formatPlanPrice(monthlyPriceInr, annualPriceInr, period);
}

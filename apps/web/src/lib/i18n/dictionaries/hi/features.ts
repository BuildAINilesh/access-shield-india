import type { FeaturesDict } from '../types';

export const features: FeaturesDict = {
  meta: {
    title: 'Platform features',
    description:
      'AccessibleNow के 12 products — IDE linting और AI fixes से लेकर portfolio posture और AT testing तक। WCAG-first, optional India compliance pack के साथ।',
  },
  hub: {
    eyebrow: 'Platform',
    title: 'Scanner से accessibility platform तक',
    subtitle:
      'Developer tools, intelligence, policy और enterprise posture — एक AccessibleNow monorepo में। Phase से filter करें।',
    filterAria: 'Phase के हिसाब से features filter करें',
    filterAll: 'सभी phases',
    filterPhase: 'Phase {n}',
    emptyFilter: 'इस phase में कोई feature नहीं।',
    viewDetails: 'Details देखें',
  },
  phases: {
    1: 'Phase 1 — Foundation',
    2: 'Phase 2 — Intelligence',
    3: 'Phase 3 — Enterprise',
  },
  status: {
    available: 'Available',
    in_progress: 'In progress',
    coming_soon: 'जल्द आ रहा है',
  },
  detail: {
    backToHub: 'सभी features',
    userStoriesHeading: 'किसके लिए',
    capabilitiesHeading: 'आपको क्या मिलता है',
    phaseLabel: 'Delivery phase',
    statusLabel: 'Status',
    snykLabel: 'Inspired by',
  },
  cta: {
    waitlist: 'Waitlist join करें',
    contact: 'Sales से बात करें',
    freeScan: 'Free scan चलाएँ',
    pricing: 'Pricing देखें',
  },
  items: {
    code: {
      name: 'AccessibleNow Code',
      tagline: 'IDE में inline accessibility linting',
      snykParallel: 'Snyk Code',
      summary:
        'VS Code plugin जो JSX/HTML/TypeScript लिखते समय WCAG और optional IS 17802 issues flag करता है — hover tips और one-click AI fixes के साथ।',
      userStories: [
        'Commit से पहले violations underlined दिखें।',
        'Incomplete UI पर accessible component suggestions मिलें।',
        'Zero-config setup ताकि team आसानी से adopt करे।',
      ],
      capabilities: [
        '.jsx, .tsx, .html के लिए real-time diagnostics',
        'Rule ID, severity और fix hint वाले tooltips',
        'AccessibleNow Fix से quick-fix actions',
        'Learn lessons के deep links',
      ],
    },
    'open-source': {
      name: 'AccessibleNow Open Source',
      tagline: 'npm package accessibility risk scanner',
      snykParallel: 'Snyk Open Source',
      summary:
        'package.json को a11y intelligence database से scan करें — third-party dependencies की known accessibility failures audit से पहले पता चलें।',
      userStories: [
        'किस dependency में screen-reader / keyboard issues हैं, जानें।',
        'Compliance report में third-party risk शामिल करें।',
        'नए package issues curator review के लिए submit करें।',
      ],
      capabilities: [
        'CLI: @accessiblenow/scan',
        'package.json change पर PR Gate GitHub Action',
        'Searchable AN-XXX-000 issue IDs',
        'Semver-aware version ranges',
      ],
    },
    fix: {
      name: 'AccessibleNow Fix',
      tagline: 'AI-generated accessible code replacements',
      snykParallel: 'DeepCode AI / Agent Fix',
      summary:
        'Context-aware fixes — ARIA, semantic HTML, focus, alt text। Portal में आज उपलब्ध; PR Apply-fix और IDE quick-fix अगला कदम।',
      userStories: [
        'PR या issue panel से suggested fix apply करें।',
        'पुराना code क्यों fail हुआ, plain English में पढ़ें।',
        'Common patterns के लिए high-confidence templates।',
      ],
      capabilities: [
        'Claude + template library',
        'Confidence score (High / Medium / Low)',
        'Portal AI fix panel (live)',
        'PR Apply fix + audit trail (in progress)',
      ],
    },
    'priority-score': {
      name: 'AccessibleNow Priority Score',
      tagline: 'Sprints के लिए risk-based ranking',
      snykParallel: 'Risk-based Prioritisation',
      summary:
        'लंबी violation list को user impact, regulatory weight, AT coverage और fix complexity से actionable sprint plan बनाएँ।',
      userStories: [
        'Ranked backlog से sprint capacity plan करें।',
        'SEBI / GIGW के लिए regulatory items ऊपर रखें।',
        'केवल clause numbers नहीं — users affected देखें।',
      ],
      capabilities: [
        'हर violation पर weighted priority score',
        'Hour budget वाला sprint view',
        'Org-configurable weights',
        'Optional analytics integration',
      ],
    },
    integrations: {
      name: 'AccessibleNow Integrations',
      tagline: 'GitHub, Jira, Slack, Figma, webhooks',
      snykParallel: 'Integrations ecosystem',
      summary:
        'Accessibility को existing tools में लाएँ — Jira, Slack Incoming Webhook digests, signed webhooks, GitHub App Apply-fix, और Figma contrast plugin (Desktop import)।',
      userStories: [
        'Violations से Jira tickets auto-create हों।',
        'Daily Slack digest और scan-completed alerts।',
        'Figma में hand-off से पहले contrast check।',
        'GitHub App से AI fixes commit हों।',
      ],
      capabilities: [
        'Jira OAuth + issue sync',
        'Slack Incoming Webhook digests (digest.daily)',
        'HMAC-signed outbound webhooks',
        'GitHub App + Contents API Apply-fix',
        'Figma contrast plugin (local Development import)',
      ],
    },
    dynamic: {
      name: 'AccessibleNow Dynamic',
      tagline: 'Authenticated journey testing (DAST)',
      snykParallel: 'Snyk API & Web (DAST)',
      summary:
        'Playwright journeys + चुने steps पर axe — login, checkout, investor portals. Dashboard → Journeys; JSON DSL (YAML-compatible) + encrypted credentials.',
      userStories: [
        'Dashboard से authenticated journeys end-to-end scan करें।',
        'Steps: navigate / fill / click / wait / axe लिखें।',
        'Stuck steps और axe hotspots का failure map देखें।',
      ],
      capabilities: [
        'JSON journey DSL (YAML-compatible keys)',
        'AES-256-GCM credential vault',
        'RabbitMQ journey_scans + per-step axe',
        'Failure map UI (recording / AT speech अगला)',
      ],
    },
    intelligence: {
      name: 'AccessibleNow Intelligence',
      tagline: 'Accessibility issue registry',
      snykParallel: 'Snyk Vulnerability Database',
      summary:
        'npm packages की known a11y failures का curated registry — /intelligence पर browse; OSS scans और PR Gate वही data इस्तेमाल करते हैं।',
      userStories: [
        'Adopt करने से पहले library search करें।',
        'AN-XXX issue की version ranges और workarounds देखें।',
        'Community report submit करें।',
      ],
      capabilities: [
        'Package / severity / keyword से public search',
        'AN-XXX-000 IDs और version ranges',
        'Community report form',
        'CLI + PR Gate same database',
      ],
    },
    learn: {
      name: 'AccessibleNow Learn',
      tagline: 'Violations से linked short lessons',
      snykParallel: 'Snyk Learn',
      summary:
        'WCAG patterns पर छोटे lessons — /learn catalog live है; org progress और certificates अगले हैं।',
      userStories: [
        'Scan/IDE finding से short lesson खोलें।',
        'Alt text, keyboard, form errors fundamentals पढ़ें।',
        'Signed-in progress track करें (API ready)।',
      ],
      capabilities: [
        'Published lesson catalog (API + /learn)',
        'Markdown lesson bodies',
        'Auth progress endpoint',
        'Quizzes / certificates (next)',
      ],
    },
    policy: {
      name: 'AccessibleNow Policy',
      tagline: 'Repo और route के custom accessibility gates',
      snykParallel: 'Policy Enforcement Engine',
      summary:
        '.accessiblenow.yml से gates — checkout पर critical hard-block, marketing पर warn — code के साथ version-controlled।',
      userStories: [
        'Payment / OTP flows पर PRs hard-block करें।',
        'Policies git में review हों।',
        'Strict policy वाले routes देखें।',
      ],
      capabilities: [
        'Path-pattern rules: block / warn / skip',
        'Presets: SEBI-Strict, WCAG-AA, Advisory-Only',
        'PR Gate enforcement',
        'Org default policy + audit log',
      ],
    },
    posture: {
      name: 'AccessibleNow Posture',
      tagline: 'हर digital property के लिए portfolio compliance',
      snykParallel: 'AI Security Posture Management',
      summary:
        'CIOs और delivery heads के लिए एक dashboard — websites, apps, documents पर scores, certificates, ownership और alerts।',
      userStories: [
        'सभी properties की daily WCAG / IS 17802 status।',
        'Client deliverables पर threshold alerts।',
        'Quarterly board / ESG report export।',
      ],
      capabilities: [
        'Portfolio grid with scores',
        '12-month trends',
        'Certificate expiry calendar',
        'IT services के लिए multi-workspace',
      ],
    },
    analytics: {
      name: 'AccessibleNow Analytics',
      tagline: 'ROI reporting और compliance metrics',
      snykParallel: 'Analytics & Reporting',
      summary:
        'Score trends, introduced vs fixed violations, developer fix rates, और users-unblocked estimates — accessibility को product narrative बनाएँ।',
      userStories: [
        'Leadership को quarterly score improvement दिखाएँ।',
        'जिन teams ज़्यादा issues लाती हैं, वहाँ training।',
        'SEBI-ready audit trail export।',
      ],
      capabilities: [
        'Score trend और violations-flow charts',
        'Developer / team leaderboards',
        'Users-unblocked estimates',
        'Quarterly PDF + audit CSV',
      ],
    },
    red: {
      name: 'AccessibleNow Red',
      tagline: 'Adversarial assistive-technology testing',
      snykParallel: 'Continuous Offensive Security',
      summary:
        'Enterprise journeys NVDA-class AT simulation के साथ — video, speech log, और failure map जहाँ blind users goal complete नहीं कर पाते।',
      userStories: [
        'Broken loan / KYC journey का video leadership को दिखाएँ।',
        'Auditor से पहले journey failures ढूँढें।',
        'Vendor reports में failure maps शामिल करें।',
      ],
      capabilities: [
        'Windows AT VM + Playwright',
        'Screen recording + speech log sync',
        'Journey failure map',
        'Enterprise PDF + remediation roadmap',
      ],
    },
  },
};

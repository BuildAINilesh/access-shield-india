import type { FeaturesDict } from '../types';

export const features: FeaturesDict = {
  meta: {
    title: 'Platform features',
    description:
      'Twelve AccessibleNow products — from IDE linting and AI fixes to portfolio posture and adversarial AT testing. WCAG-first, with an optional India compliance pack.',
  },
  hub: {
    eyebrow: 'Platform',
    title: 'From scanner to accessibility platform',
    subtitle:
      'Developer tools, intelligence, policy, and enterprise posture — built in one AccessibleNow monorepo. Filter by delivery phase.',
    filterAria: 'Filter features by phase',
    filterAll: 'All phases',
    filterPhase: 'Phase {n}',
    emptyFilter: 'No features in this phase.',
    viewDetails: 'View details',
  },
  phases: {
    1: 'Phase 1 — Foundation',
    2: 'Phase 2 — Intelligence',
    3: 'Phase 3 — Enterprise',
  },
  status: {
    available: 'Available',
    in_progress: 'In progress',
    coming_soon: 'Coming soon',
  },
  detail: {
    backToHub: 'All features',
    userStoriesHeading: 'Who it is for',
    capabilitiesHeading: 'What you get',
    phaseLabel: 'Delivery phase',
    statusLabel: 'Status',
    snykLabel: 'Inspired by',
  },
  cta: {
    waitlist: 'Join waitlist',
    contact: 'Talk to sales',
    freeScan: 'Run free scan',
    pricing: 'View pricing',
  },
  items: {
    code: {
      name: 'AccessibleNow Code',
      tagline: 'Inline accessibility linting in your IDE',
      snykParallel: 'Snyk Code',
      summary:
        'VS Code (and later JetBrains) plugin that flags WCAG and optional IS 17802 issues as you write JSX, HTML, and TypeScript — with hover tips and one-click AI fixes.',
      userStories: [
        'See accessibility violations underlined before you commit.',
        'Get accessible component suggestions when you write incomplete UI.',
        'Zero-config setup so the team adopts it without heavy onboarding.',
      ],
      capabilities: [
        'Real-time diagnostics for .jsx, .tsx, .html (Vue later)',
        'Hover tooltips with rule ID, severity, and fix hint',
        'Quick-fix actions powered by AccessibleNow Fix',
        'Deep links into AccessibleNow Learn lessons',
      ],
    },
    'open-source': {
      name: 'AccessibleNow Open Source',
      tagline: 'npm package accessibility risk scanner',
      snykParallel: 'Snyk Open Source',
      summary:
        'Scan package.json against AccessibleNow’s a11y intelligence database to surface known accessibility failures in third-party dependencies before an audit does.',
      userStories: [
        'Know which dependencies have known screen-reader or keyboard issues.',
        'Include third-party risk in compliance reports.',
        'Submit new package issues for curator review.',
      ],
      capabilities: [
        'CLI: @accessiblenow/scan for dependency scans',
        'PR Gate GitHub Action when package.json changes',
        'PR comments when package.json introduces risky packages',
        'Searchable issue IDs (AN-XXX-000)',
        'Semver-aware affected version ranges',
      ],
    },
    fix: {
      name: 'AccessibleNow Fix',
      tagline: 'AI-generated accessible code replacements',
      snykParallel: 'DeepCode AI / Agent Fix',
      summary:
        'Context-aware fixes — ARIA, semantic HTML, focus management, alt text — not generic advice. Available in the portal today; PR Apply-fix and IDE quick-fix coming next.',
      userStories: [
        'Apply a suggested fix from a PR or the issue panel.',
        'Read a plain-English explanation of why the old code failed.',
        'Trust high-confidence template fixes for common patterns.',
      ],
      capabilities: [
        'Claude-powered generate with template library for common rules',
        'Confidence score (High / Medium / Low)',
        'Portal AI fix panel (shipping)',
        'PR comment Apply fix + audit trail (in progress)',
      ],
    },
    'priority-score': {
      name: 'AccessibleNow Priority Score',
      tagline: 'Risk-based violation ranking for sprints',
      snykParallel: 'Risk-based Prioritisation',
      summary:
        'Turn a long violation list into an actionable sprint plan using user impact, regulatory weight, AT coverage, and fix complexity.',
      userStories: [
        'Plan sprint capacity from a ranked backlog.',
        'Weight regulatory-critical items higher for SEBI or GIGW work.',
        'See impact in users affected, not only clause numbers.',
      ],
      capabilities: [
        'Weighted priority score on every violation',
        'Sprint view capped by hour budget',
        'Org-configurable scoring weights',
        'Optional analytics for real session impact',
      ],
    },
    integrations: {
      name: 'AccessibleNow Integrations',
      tagline: 'GitHub, Jira, Slack, Figma, webhooks',
      snykParallel: 'Integrations ecosystem',
      summary:
        'Bring accessibility into tools teams already use. Jira sync is live in the portal; Slack digests, webhooks, Figma contrast checks, and deeper GitHub PR Gate expand next.',
      userStories: [
        'Auto-create Jira tickets from violations.',
        'Get daily Slack digests and regression alerts.',
        'Check colour contrast in Figma before hand-off.',
      ],
      capabilities: [
        'Jira OAuth connect + issue sync (available)',
        'Slack digests and slash commands (coming)',
        'Webhook API with signed deliveries (coming)',
        'Figma contrast plugin (coming)',
      ],
    },
    dynamic: {
      name: 'AccessibleNow Dynamic',
      tagline: 'Authenticated journey testing (DAST)',
      snykParallel: 'Snyk API & Web (DAST)',
      summary:
        'Playwright journeys with axe at each step — login, checkout, investor portals — so you scan the flows regulators care about, not only the homepage.',
      userStories: [
        'Scan authenticated investor or banking journeys end to end.',
        'Maintain journeys in YAML without writing code.',
        'See a failure map of where assistive tech users get stuck.',
      ],
      capabilities: [
        'YAML journey DSL (navigate, click, fill, wait, assert)',
        'Encrypted credential vault',
        'Per-step violation tagging',
        'Session recording with AT speech log',
      ],
    },
    intelligence: {
      name: 'AccessibleNow Intelligence',
      tagline: 'The accessibility issue registry',
      snykParallel: 'Snyk Vulnerability Database',
      summary:
        'Curated registry of known accessibility failures in npm packages, widgets, payment gateways, and SaaS tools — the data moat behind OSS scans and PR Gate.',
      userStories: [
        'Search a library before you adopt it.',
        'Export a third-party risk register for audits.',
        'Contribute verified findings as a researcher.',
      ],
      capabilities: [
        'Public search by package, severity, and AT affected',
        'AN-XXX-000 issue IDs and version ranges',
        'Bulk JSON/CSV export',
        'Subscription alerts for packages you use',
      ],
    },
    learn: {
      name: 'AccessibleNow Learn',
      tagline: 'Short lessons linked from real violations',
      snykParallel: 'Snyk Learn',
      summary:
        '3–5 minute lessons on WCAG and India-specific patterns, linked from PR comments and IDE diagnostics, with org progress and certification paths.',
      userStories: [
        'Open a 3-minute lesson from a PR violation.',
        'See which topics your team has completed.',
        'Assign an IS 17802 developer path from L&D.',
      ],
      capabilities: [
        '50+ lessons mapped to violation IDs',
        'Interactive sandbox + quiz',
        'Org learning dashboard',
        'QR-verifiable certificates',
      ],
    },
    policy: {
      name: 'AccessibleNow Policy',
      tagline: 'Custom accessibility gates per repo and route',
      snykParallel: 'Policy Enforcement Engine',
      summary:
        'Define .accessiblenow.yml gates so checkout hard-blocks critical issues while marketing pages only warn — version-controlled with your code.',
      userStories: [
        'Hard-block PRs on payment and OTP flows.',
        'Keep policies in git for review like any other change.',
        'See which routes are under strict policies.',
      ],
      capabilities: [
        'Path-pattern rules with block / warn / skip',
        'Presets: SEBI-Strict, WCAG-AA, Advisory-Only, Indian-Government',
        'PR Gate enforcement',
        'Org default policy + audit log',
      ],
    },
    posture: {
      name: 'AccessibleNow Posture',
      tagline: 'Portfolio compliance for every digital property',
      snykParallel: 'AI Security Posture Management',
      summary:
        'One dashboard for CIOs and delivery heads — scores, certificates, ownership, and alerts across websites, apps, and documents.',
      userStories: [
        'See IS 17802 / WCAG status across all properties daily.',
        'Track client deliverables with threshold alerts.',
        'Export a quarterly board / ESG accessibility report.',
      ],
      capabilities: [
        'Portfolio grid with score and certificate status',
        '12-month score trends',
        'Certificate expiry calendar',
        'Multi-workspace for IT services firms',
      ],
    },
    analytics: {
      name: 'AccessibleNow Analytics',
      tagline: 'ROI reporting and compliance metrics',
      snykParallel: 'Analytics & Reporting',
      summary:
        'Score trends, violations introduced vs fixed, developer fix rates, and “users unblocked” estimates that turn accessibility work into a product narrative.',
      userStories: [
        'Show quarterly score improvement to leadership.',
        'Target training where teams introduce the most issues.',
        'Export a SEBI-ready audit trail of fixes.',
      ],
      capabilities: [
        'Score trend and violations-flow charts',
        'Developer / team leaderboards',
        'Users-unblocked estimates',
        'Quarterly PDF + audit CSV export',
      ],
    },
    red: {
      name: 'AccessibleNow Red',
      tagline: 'Adversarial assistive-technology testing',
      snykParallel: 'Continuous Offensive Security',
      summary:
        'Enterprise journeys run with NVDA-class AT simulation, synchronised video and speech logs, and a failure map that shows where blind users cannot complete the goal.',
      userStories: [
        'Show leadership a video of a broken loan or KYC journey.',
        'Find journey failures before an auditor does.',
        'Include failure maps in vendor accessibility reports.',
      ],
      capabilities: [
        'Windows AT VM + Playwright journey runner',
        'Screen recording + speech log sync',
        'Journey failure classification and map',
        'Enterprise PDF with remediation roadmap',
      ],
    },
  },
};

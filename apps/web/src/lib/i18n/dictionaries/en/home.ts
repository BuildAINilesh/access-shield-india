import type { HomeDict } from '../types';

export const home: HomeDict = {
  meta: {
    title: 'Accessible to all Indians. Auditable for your regulators.',
    description:
      'Enterprise accessibility platform for BFSI, PSUs, and government vendors — scan websites and mobile apps, fix barriers for people with disabilities, and produce RPwD, GIGW, IS 17802 & SEBI audit evidence.',
  },
  hero: {
    urgencyAria: 'Product highlight',
    badges: ['Free website scan'],
    titleLine1: 'Find what blocks people',
    titleHighlight: 'on your website',
    titleLine2: '',
    subtitle:
      'Scan any URL in about a minute. Then fix issues and prove WCAG 2.2 AA — with the evidence your auditors ask for.',
    sectorsAria: 'Who we serve',
    sectors: ['BFSI & listed cos.', 'PSUs & ministries', 'Govt vendors', 'Audit-ready reports'],
    trustPoints: [
      'Free scan finds issues — paid product + experts close the gap',
      'WCAG 2.2 AA + IS 17802 · automated scans alone ≠ full conformance',
      'Expert audits, SEBI/GIGW/RPwD packs, monitoring & training',
    ],
    bookDemo: 'Talk to sales',
    runScan: 'Scan now',
    footnote: 'A scan is a starting point — not a full accessibility audit.',
    standardsAria: 'Supported compliance standards',
    standards: ['WCAG 2.2 AA', 'IS 17802', 'GIGW 3.0', 'RPwD Act', 'SEBI 2024'],
    reportCard: {
      title: 'Enterprise compliance report',
      auditFile: 'Audit file',
      scoreLabel: 'Accessibility score',
      scoreMeta: '25 barriers · 12 pages scanned',
      exportsTitle: 'Regulator-ready exports',
      exports: [
        { label: 'RPwD evidence pack', status: 'Ready' },
        { label: 'GIGW 3.0 summary', status: 'Ready' },
        { label: 'SEBI assessment', status: 'In review' },
      ],
      download: 'Download PDF for audit committee',
    },
    visual: {
      scanComplete: 'Scan complete',
      scanTime: '68 seconds',
      figcaption:
        'Sample accessibility report showing a score of 72, 25 barriers across 12 pages, and regulator-ready exports.',
      imageAlt: 'Sample accessibility score report with issue counts by severity',
    },
  },
  ticker: {
    aria: 'Sectors we serve across India',
    sectors: [
      'BFSI & listed companies',
      'PSUs & central ministries',
      'State govt portals',
      'SEBI-regulated entities',
      'Government ICT vendors',
      'Healthcare & insurance',
      'E-commerce & fintech',
      'Public sector banks',
    ],
    items: [
      'SEBI: All regulated entities must meet WCAG 2.1 AA by April 2026',
      'GIGW 3.0: Government websites must comply with IS 17802',
      'RPwD Act 2016: Digital services must be accessible to persons with disabilities',
      "IS 17802: India's national ICT accessibility standard (BIS 2021)",
    ],
  },
  riskStats: {
    title: 'Accessibility in India — by the numbers',
    intro: 'The web was built to be universal. Too many Indian sites still leave people out.',
    stats: [
      { value: '2.68 Cr+', label: 'Indians with visual disability (Census 2011)' },
      { value: '70M+', label: 'People with disabilities in India' },
      { value: '21', label: 'Disability types recognised under RPwD Act' },
      { value: 'Apr 2026', label: 'SEBI accessibility deadline for listed cos.' },
    ],
  },
  whoWeBuildFor: {
    title: 'Built for real users, not just PDFs',
    subtitle:
      'When someone with a disability cannot pay a bill, read a menu, or complete a form on your site, the service is not truly public. We find those barriers — then help you remove them.',
    imageAlt:
      'Indian users with visual, hearing, and motor disabilities independently using smartphones, laptops, and accessible keyboards',
    quote:
      'The power of the Web is in its universality. Access by everyone regardless of disability is an essential aspect.',
    quoteAuthor: 'Tim Berners-Lee',
    cards: [
      {
        title: 'Blind & low-vision users',
        barrier: 'Missing alt text, poor contrast, broken screen-reader order',
        checks: 'WCAG 1.1.1, 1.4.3, focus order, ARIA labels',
      },
      {
        title: 'Deaf & hard-of-hearing users',
        barrier: 'Videos without captions, audio-only alerts',
        checks: 'WCAG 1.2 multimedia, transcripts, visual alternatives',
      },
      {
        title: 'Motor & cognitive disabilities',
        barrier: 'Tiny buttons, keyboard traps, confusing forms',
        checks: 'WCAG 2.1 keyboard access, 2.5.8 touch targets, IS 17802',
      },
    ],
    barrierLabel: 'Common barrier:',
    checksLabel: 'What we check:',
    footer:
      'Fix these barriers and you welcome crores of Indians who rely on screen readers, magnifiers, voice control, and other assistive technology every day — with the scans and reports regulators expect under RPwD, IS 17802, GIGW, and SEBI.',
    figcaption:
      'People with disabilities using assistive technology to access digital services in India',
  },
  howItWorks: {
    title: 'From barriers to welcome — in 4 steps',
    subtitle:
      'Find what excludes people, fix it, and document progress for your team and regulators',
    stepLabel: 'Step',
    steps: [
      {
        title: 'Discover',
        description:
          'See your site through the eyes of users with disabilities — automated scan plus real barrier detection in 60–90 seconds.',
      },
      {
        title: 'Understand',
        description:
          'Prioritised issues: what blocks someone from paying, signing up, or reading your content — mapped to WCAG and IS 17802.',
      },
      {
        title: 'Fix',
        description:
          'Code-level remediation guidance and AI suggestions your dev team can ship — alt text, contrast, keyboard access, and more.',
      },
      {
        title: 'Prove',
        description:
          'Reports and certificates for RPwD, SEBI, GIGW, and your audit file — so compliance follows inclusion, not the other way around.',
      },
    ],
  },
  standards: {
    title: 'The proof your auditors need — after you fix the barriers',
    subtitle: 'One scan covers every Indian standard. Compliance follows inclusion.',
    items: [
      {
        name: 'RPwD Act 2016',
        description: 'Rights of Persons with Disabilities Act — mandatory for government websites',
        href: '/rpwd-act',
      },
      {
        name: 'IS 17802',
        description: 'Indian Standard for ICT Accessibility — aligned with WCAG 2.1 AA',
        href: '/is-17802',
      },
      {
        name: 'GIGW 3.0',
        description: 'Guidelines for Indian Government Websites — WCAG 2.0 Level A compliance',
        href: '/gigw',
      },
      {
        name: 'WCAG 2.2 AA',
        description: 'Web Content Accessibility Guidelines — international accessibility standard',
        href: '/wcag-2-2-aa',
      },
      {
        name: 'SEBI 2024',
        description: 'SEBI accessibility circular — mandatory for listed companies by Apr 2026',
        href: '/sebi-accessibility',
      },
    ],
  },
  testimonials: {
    title: 'Teams building for everyone across India',
    subtitle: 'Compliance gets you the certificate. Accessibility gets you the customer.',
    items: [
      {
        quote:
          'We thought we were fine until we realised a blind user could not complete our KYC flow. AccessibleNow showed us exactly what to fix — and gave us SEBI-ready reports.',
        name: 'Priya Sharma',
        role: 'Head of Compliance',
        company: 'Leading Fintech',
        starsAria: '5 out of 5 stars',
      },
      {
        quote:
          'Our government tender required GIGW compliance. AccessibleNow translated that into real barriers for users with disabilities — not just a checklist.',
        name: 'Rajesh Kumar',
        role: 'CTO',
        company: 'E-commerce Platform',
        starsAria: '5 out of 5 stars',
      },
      {
        quote:
          'The widget helps visitors with low vision and dyslexia today. The remediation work helps everyone tomorrow. That is the right order.',
        name: 'Meera Patel',
        role: 'Product Manager',
        company: 'SaaS Startup',
        starsAria: '5 out of 5 stars',
      },
    ],
  },
  blogPreview: {
    title: 'Latest from the compliance desk',
    subtitle: 'Stay updated on Indian accessibility laws and best practices',
    viewAll: 'View all articles →',
    empty: 'No posts yet — check back soon.',
  },
  cta: {
    badge: 'SEBI deadline: April 2026',
    title: 'Everyone deserves to use your website',
    body: 'Crores of Indians live with a disability. If they cannot complete a payment, sign up, or read your content, your product is not finished. SEBI, RPwD, and GIGW require accessible digital services — but the real reason to act is simpler: inclusion is good business.',
    scanCta: 'Scan for accessibility barriers',
    expertCta: 'Talk to an expert',
  },
  storyCarousel: {
    title: 'The barriers we find first',
    subtitle:
      'The same five failures block most Indian sites. Scan for them, then remediate against RPwD, GIGW, IS 17802, and SEBI.',
    regionAria: 'Common accessibility barriers and how AccessibleNow addresses them',
    pause: 'Pause slideshow',
    play: 'Play slideshow',
    previous: 'Previous story',
    next: 'Next story',
    goTo: 'Show story {n}: {title}',
    slideOf: '{current} of {total}',
    slides: [
      {
        id: 'screenReader',
        eyebrow: 'Screen readers',
        title: 'Unlabelled controls stop a payment mid-flow.',
        body: 'A screen reader announces an icon-only Pay control as “button”. The user cannot tell what it does, so the transaction is abandoned. This is a WCAG 2.2 Name, Role, Value failure.',
        stat: '28%',
        statLabel: 'of the top 10 lakh home pages have buttons a screen reader cannot name',
        imageAlt:
          'Young Indian man wearing dark glasses and earbuds using a screen reader on his phone in a café',
        cta: 'Scan for unlabelled controls',
        href: '/scan',
      },
      {
        id: 'lowVision',
        eyebrow: 'Contrast & zoom',
        title: 'Low-contrast text fails the first visual check.',
        body: 'Grey-on-white body copy and 12px labels drop below 4.5:1. At 200% zoom the layout should still reflow. Both are required under WCAG 2.2 AA and IS 17802.',
        stat: '81%',
        statLabel: 'of top home pages have text with too little contrast to read',
        imageAlt:
          'Smiling elderly Indian woman in a saree using a tablet with large, high-contrast buttons',
        cta: 'Preview contrast failures',
        href: '#simulator-heading',
      },
      {
        id: 'keyboard',
        eyebrow: 'Keyboard access',
        title: 'Hover-only menus lock out keyboard users.',
        body: 'If a control cannot be reached or activated with Tab and Enter, it is not usable with a switch device either. WCAG 2.2 and IS 17802 require every function to work from the keyboard.',
        stat: '100%',
        statLabel: 'of features must work by keyboard under WCAG 2.2 and IS 17802',
        imageAlt:
          'Indian woman professional in a wheelchair typing on a laptop at an adjustable office desk',
        cta: 'Run a keyboard check',
        href: '/scan',
      },
      {
        id: 'deaf',
        eyebrow: 'Captions',
        title: 'Video without captions is not a digital service.',
        body: 'GIGW 3.0 requires captions on government video. The same gap shows up in product demos and support clips. If the audio is the only channel, the content is not accessible.',
        stat: '6.3 Cr',
        statLabel: 'Indians live with significant hearing loss (WHO estimate)',
        imageAlt:
          'Deaf Indian student in a library watching a captioned lecture with a sign-language interpreter window',
        cta: 'Check media accessibility',
        href: '/scan',
      },
      {
        id: 'compliance',
        eyebrow: 'Evidence',
        title: 'Scan, remediate, and export the audit pack.',
        body: 'AccessibleNow maps each issue to RPwD, SEBI, GIGW, and IS 17802, explains the fix in plain language, and produces the evidence pack your auditors ask for.',
        stat: '4',
        statLabel: 'Indian frameworks in every report: RPwD, SEBI, GIGW, IS 17802',
        imageAlt:
          'Indian compliance team in a boardroom reviewing an accessibility score dashboard on a wall screen',
        cta: 'Talk to enterprise sales',
        href: '/contact?plan=enterprise',
      },
    ],
  },
  heroScan: {
    label: 'Check any website — free',
    placeholder: 'yourcompany.com',
    submit: 'Scan now',
    invalidUrl: 'Enter a valid website, for example yourcompany.com',
    hint: 'No sign-up. Results as pages finish.',
  },
  simulator: {
    title: "Your website, through your customers' eyes",
    subtitle:
      'Over 2.6 crore Indians live with a disability. Pick a view to see what a typical payment screen looks like to them.',
    groupAria: 'Choose a simulation',
    previewTitle: 'Pay your credit card bill',
    previewAmount: 'Amount due by 15/10/2026: ₹12,450',
    previewStatusLabel: 'Last payment status',
    previewPay: 'Pay now',
    modes: [
      {
        id: 'normal',
        label: 'Normal view',
        insight: 'This is how your design team sees the page.',
      },
      {
        id: 'lowVision',
        label: 'Low vision',
        insight:
          'Small grey text and thin input borders blur away. Many people over 50 see roughly like this.',
      },
      {
        id: 'colourBlind',
        label: 'Colour blindness',
        insight:
          'Red and green status dots look the same, so this user cannot tell whether the last payment failed. About 1 in 12 men are affected.',
      },
      {
        id: 'cataract',
        label: 'Cataract',
        insight:
          'Contrast washes out and the Pay button blends into the background. Cataract is the leading cause of vision loss in India.',
      },
    ],
    cta: 'Find these problems on your site',
  },
  calculator: {
    title: 'What is inaccessibility costing you?',
    subtitle:
      'Move the slider to your traffic. We estimate the customers who leave because they cannot use your site.',
    visitorsLabel: 'Monthly website visitors',
    orderLabel: 'Average order or transaction value (₹)',
    resultLabel: 'Revenue at risk every month',
    resultNote:
      'Range uses 2.21% (Census 2011) to 16% (WHO) of visitors with a disability and an assumed 2% conversion rate.',
    legalLabel: 'Legal exposure under RPwD Act 2016, Section 89',
    legalValue: 'Up to ₹5,00,000 per repeat violation',
    legalNote: 'Plus SEBI action for regulated entities and disqualification from government tenders.',
    cta: "Find out exactly what's broken",
  },
  quiz: {
    title: 'Does accessibility law apply to you?',
    subtitle: 'Answer three questions to see which Indian rules cover your organisation.',
    yes: 'Yes',
    no: 'No',
    questions: [
      { id: 'sebi', question: 'Is your organisation regulated by SEBI (listed company, broker, AMC, RIA)?' },
      { id: 'government', question: 'Are you a government body, PSU, or a vendor building for government?' },
      { id: 'public', question: 'Do customers or citizens use your website or app?' },
    ],
    resultTitle: 'Rules that apply to you',
    resultPending: 'Answer the questions above to see your result.',
    resultNone:
      'No specific rule is flagged for you today. WCAG 2.2 AA is still best practice — and these rules apply the moment you serve the public, list, or bid for government work.',
    laws: [
      {
        id: 'rpwd',
        name: 'RPwD Act 2016',
        reason: 'Requires accessible ICT for public-facing services. Penalties under Section 89.',
        href: '/rpwd-act',
      },
      {
        id: 'sebi',
        name: 'SEBI accessibility circular (2024)',
        reason: 'Mandatory digital accessibility for regulated entities, with audit evidence.',
        href: '/sebi-accessibility',
      },
      {
        id: 'gigw',
        name: 'GIGW 3.0',
        reason: 'Required for government websites, apps, and the vendors who build them.',
        href: '/gigw',
      },
      {
        id: 'is17802',
        name: 'IS 17802',
        reason: "India's national ICT accessibility standard, referenced in tenders and audits.",
        href: '/is-17802',
      },
    ],
    learnMore: 'Learn more',
    cta: 'Check your compliance now',
  },
};

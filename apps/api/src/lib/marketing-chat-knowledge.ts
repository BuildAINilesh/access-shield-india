/**
 * Marketing chatbot knowledge — standards, AccessibleNow offerings, and
 * in-app navigation. Used as a fast fallback when the AI service is down.
 */

export type ChatLocale = 'en' | 'hi';

export interface ChatReply {
  reply: string;
  navigate?: string;
  suggestions: string[];
  /** High-confidence keyword match — skip the LLM. */
  confident?: boolean;
}

export const MARKETING_CHAT_PAGES: ReadonlyArray<{
  path: string;
  keywords: readonly string[];
  labelEn: string;
  labelHi: string;
}> = [
  { path: '/', keywords: ['home', 'homepage', 'होम'], labelEn: 'Home', labelHi: 'होम' },
  {
    path: '/scan',
    keywords: ['scan', 'free scan', 'test website', 'check site', 'स्कैन'],
    labelEn: 'Free website scan',
    labelHi: 'मुफ़्त वेबसाइट स्कैन',
  },
  {
    path: '/services',
    keywords: ['services', 'packages', 'pricing', 'plans', 'offer', 'price', 'सेवा', 'कीमत', 'पैकेज'],
    labelEn: 'Services & packages',
    labelHi: 'सेवाएँ और पैकेज',
  },
  {
    path: '/widget',
    keywords: ['widget', 'overlay', 'toolbar', 'विजेट'],
    labelEn: 'Accessibility widget',
    labelHi: 'एक्सेसिबिलिटी विजेट',
  },
  {
    path: '/document-scanner',
    keywords: ['document', 'pdf', 'word', 'pptx', 'दस्तावेज़'],
    labelEn: 'Document scanner',
    labelHi: 'दस्तावेज़ स्कैनर',
  },
  {
    path: '/contact',
    keywords: ['contact', 'sales', 'demo', 'talk', 'call', 'संपर्क'],
    labelEn: 'Contact',
    labelHi: 'संपर्क',
  },
  { path: '/blog', keywords: ['blog', 'article', 'ब्लॉग'], labelEn: 'Blog', labelHi: 'ब्लॉग' },
  { path: '/signup', keywords: ['signup', 'register', 'trial', 'account', 'साइन अप'], labelEn: 'Sign up', labelHi: 'साइन अप' },
  { path: '/login', keywords: ['login', 'sign in', 'लॉगिन'], labelEn: 'Login', labelHi: 'लॉगिन' },
  {
    path: '/wcag-2-2-aa',
    keywords: ['wcag', '2.2', 'aa', 'w3c'],
    labelEn: 'WCAG 2.2 AA',
    labelHi: 'WCAG 2.2 AA',
  },
  {
    path: '/gigw',
    keywords: ['gigw', 'government of india', 'guidelines for indian government'],
    labelEn: 'GIGW 3.0',
    labelHi: 'GIGW 3.0',
  },
  {
    path: '/rpwd-act',
    keywords: ['rpwd', 'rights of persons', 'disability act', '2016', 'अधिकार', 'अधिनियम'],
    labelEn: 'RPwD Act 2016',
    labelHi: 'RPwD अधिनियम 2016',
  },
  {
    path: '/is-17802',
    keywords: ['is 17802', 'is17802', 'bis', 'indian standard'],
    labelEn: 'IS 17802',
    labelHi: 'IS 17802',
  },
  {
    path: '/sebi-accessibility',
    keywords: ['sebi', 'listed', 'stock', 'circular'],
    labelEn: 'SEBI accessibility',
    labelHi: 'SEBI एक्सेसिबिलिटी',
  },
  { path: '/about', keywords: ['about', 'company', 'who', 'हमारे बारे'], labelEn: 'About', labelHi: 'हमारे बारे में' },
  { path: '/docs', keywords: ['docs', 'documentation', 'api'], labelEn: 'Documentation', labelHi: 'दस्तावेज़ीकरण' },
];

const ALLOWED_PATHS = new Set(MARKETING_CHAT_PAGES.map((page) => page.path));

const NAV_INTENT = /\b(go to|take me|open|show me|navigate|visit|ले चलो|खोलो|ले चलें|दिखाओ)\b/i;

interface Topic {
  id: string;
  keywords: readonly string[];
  navigate?: string;
  suggestions: readonly string[];
  en: string;
  hi: string;
}

const TOPICS: readonly Topic[] = [
  {
    id: 'wcag',
    keywords: ['wcag', '2.2', 'aa', 'w3c', 'web content accessibility'],
    navigate: '/wcag-2-2-aa',
    suggestions: ['What does AccessibleNow offer?', 'Scan my website', 'What is GIGW?'],
    en: 'WCAG 2.2 AA is the W3C standard for web accessibility. Level AA is the usual legal and procurement bar. It covers perceivable, operable, understandable, and robust content — things like alt text, keyboard access, contrast, labels, and focus. AccessibleNow scans against WCAG 2.2 AA and maps every finding to a criterion.',
    hi: 'WCAG 2.2 AA वेब एक्सेसिबिलिटी का W3C मानक है। Level AA आमतौर पर कानूनी और खरीद की न्यूनतम रेखा है। इसमें alt text, कीबोर्ड, कंट्रास्ट, लेबल और फ़ोकस जैसी ज़रूरतें आती हैं। AccessibleNow हर समस्या को WCAG 2.2 AA से मैप करता है।',
  },
  {
    id: 'gigw',
    keywords: ['gigw', 'government website', 'guidelines for indian government'],
    navigate: '/gigw',
    suggestions: ['What is IS 17802?', 'Book an audit', 'Scan my website'],
    en: 'GIGW 3.0 (Guidelines for Indian Government Websites) is the MeitY standard for government and many public-sector sites. It builds on accessibility, quality, and security. Government vendors typically need GIGW-aligned evidence. AccessibleNow maps scans to GIGW and can support an audit pack.',
    hi: 'GIGW 3.0 भारत सरकार की वेबसाइटों के लिए MeitY दिशानिर्देश है। यह एक्सेसिबिलिटी, गुणवत्ता और सुरक्षा पर आधारित है। सरकारी वेंडरों को अक्सर GIGW के प्रमाण चाहिए। AccessibleNow स्कैन को GIGW से जोड़ता है।',
  },
  {
    id: 'rpwd',
    keywords: ['rpwd', 'rights of persons', 'disability act', 'section 40', 'section 46'],
    navigate: '/rpwd-act',
    suggestions: ['What is WCAG 2.2 AA?', 'Talk to sales', 'What do you offer?'],
    en: 'The Rights of Persons with Disabilities (RPwD) Act 2016 is India’s disability-rights law. Sections 40–46 cover accessibility of ICT, websites, and public services. Organisations that serve the public can face complaints and penalties if digital services exclude disabled people. AccessibleNow helps you evidence WCAG / IS 17802 work against that duty.',
    hi: 'RPwD अधिनियम 2016 भारत का विकलांगता अधिकार कानून है। धारा 40–46 ICT, वेबसाइट और सार्वजनिक सेवाओं की पहुँच पर हैं। सार्वजनिक सेवा देने वाले संगठनों पर शिकायत और जुर्माना लग सकता है। AccessibleNow WCAG और IS 17802 के प्रमाण इकट्ठा करने में मदद करता है।',
  },
  {
    id: 'is17802',
    keywords: ['is 17802', 'is17802', 'bis', 'indian standard', '17802'],
    navigate: '/is-17802',
    suggestions: ['What is GIGW?', 'What is WCAG?', 'Scan my website'],
    en: 'IS 17802 is the BIS ICT accessibility standard for India. It adopts WCAG 2.1 AA as the base and adds India-specific rules — Indian language codes, Unicode Hindi, DD/MM/YYYY dates, +91 phone format, rupee formatting, and accessible PDF alternatives. AccessibleNow’s scanner includes these IS rules.',
    hi: 'IS 17802 भारत का BIS ICT एक्सेसिबिलिटी मानक है। यह WCAG 2.1 AA पर आधारित है और भारतीय भाषा कोड, यूनिकोड हिंदी, DD/MM/YYYY तारीख, +91 फ़ोन और सुलभ PDF जैसे नियम जोड़ता है। AccessibleNow इन नियमों को स्कैन करता है।',
  },
  {
    id: 'sebi',
    keywords: ['sebi', 'listed company', 'stock exchange', 'circular 2024'],
    navigate: '/sebi-accessibility',
    suggestions: ['Certified Assurance', 'Talk to sales', 'What is WCAG?'],
    en: 'SEBI’s 2024 accessibility circular expects listed companies and market participants to make investor-facing digital properties accessible and keep evidence. AccessibleNow’s Enterprise / Certified Assurance path can produce a SEBI-aligned evidence pack for boards and compliance teams.',
    hi: 'SEBI के 2024 एक्सेसिबिलिटी परिपत्र में listed कंपनियों से निवेशक-फेसिंग साइटों को सुलभ रखने और प्रमाण रखने को कहा गया है। AccessibleNow Enterprise / Certified Assurance से बोर्ड के लिए SEBI-aligned पैक बन सकता है।',
  },
  {
    id: 'offers',
    keywords: [
      'offer',
      'package',
      'pricing',
      'price',
      'plan',
      'cost',
      'how much',
      'services',
      'what do you',
      'कीमत',
      'पैकेज',
      'सेवा',
    ],
    navigate: '/services',
    suggestions: ['Access Widget', 'Scan my website', 'Document scanning'],
    en: 'AccessibleNow packages: Access Widget ₹4,999 one-time; Automated Site Scan ₹9,999; Scan & Remediation ₹19,999 (most chosen); Certified Assurance ₹24,999/month with 5 scans and auditor-led testing. Documents: 50 scans free, then ₹500 each. Recurring SaaS: Developer ₹1,499/mo, Professional ₹7,999/mo, Enterprise on request. GST 18% extra. A widget alone is not WCAG conformance.',
    hi: 'AccessibleNow पैकेज: Access Widget ₹4,999 एक बार; Automated Site Scan ₹9,999; Scan & Remediation ₹19,999 (सबसे चुना गया); Certified Assurance ₹24,999/माह — 5 स्कैन + ऑडिटर टेस्ट। दस्तावेज़: 50 स्कैन मुफ़्त, फिर ₹500। SaaS: Developer ₹1,499/माह, Professional ₹7,999/माह, Enterprise बात करके। GST 18% अलग। अकेले विजेट से WCAG conformance नहीं होता।',
  },
  {
    id: 'widget',
    keywords: ['widget', 'overlay', 'toolbar', 'contrast tool', 'font size', 'विजेट'],
    navigate: '/widget',
    suggestions: ['What do you offer?', 'Scan my website', 'Book a call'],
    en: 'The Access Widget is a one-time ₹4,999 overlay: larger text, contrast, reading aids, and keyboard help. It improves experience — it does not by itself make a site WCAG-conformant. Conformance needs scanning, code fixes, and evidence. I can open the widget page.',
    hi: 'Access Widget ₹4,999 का वन-टाइम ओवरले है: बड़ा टेक्स्ट, कंट्रास्ट, पढ़ने और कीबोर्ड की मदद। यह अनुभव बेहतर करता है — अकेले इससे साइट WCAG-conformant नहीं बनती। उसके लिए स्कैन, कोड सुधार और प्रमाण चाहिए।',
  },
  {
    id: 'scan',
    keywords: ['scan my', 'free scan', 'test my', 'check my site', 'run a scan', 'स्कैन'],
    navigate: '/scan',
    suggestions: ['What issues will a scan find?', 'What do you offer?', 'Document scanning'],
    en: 'You can run a free website scan now — no account needed. It flags WCAG 2.2 and India-specific issues with severity. Automated scanning is not full certification; Certified Assurance adds a human auditor. Opening the scan page.',
    hi: 'अभी मुफ़्त वेबसाइट स्कैन चला सकते हैं — अकाउंट की ज़रूरत नहीं। यह WCAG 2.2 और भारत-विशेष समस्याएँ दिखाता है। अकेला ऑटो स्कैन प्रमाणपत्र नहीं है; Certified Assurance में ऑडिटर भी टेस्ट करता है। स्कैन पेज खोल रहा हूँ।',
  },
  {
    id: 'documents',
    keywords: ['document', 'pdf', 'word', 'powerpoint', 'pptx', 'docx', 'दस्तावेज़'],
    navigate: '/document-scanner',
    suggestions: ['Website scan', 'What do you offer?', 'Contact sales'],
    en: 'Document Scan Programme: PDF, Word, and decks. 50 scans included, then ₹500 per file. It checks reading order, tags, and alternative text so authors get a per-document report.',
    hi: 'दस्तावेज़ स्कैन: PDF, Word और स्लाइड। 50 स्कैन शामिल, फिर फ़ाइल पर ₹500। रीडिंग ऑर्डर, टैग और alt text जाँचता है।',
  },
  {
    id: 'contact',
    keywords: ['contact', 'talk', 'sales', 'demo', 'call', 'email', 'book', 'संपर्क'],
    navigate: '/contact',
    suggestions: ['What do you offer?', 'Free scan', 'Login'],
    en: 'Happy to connect you with the team. Opening the contact page — tell them which package you want (scan, remediation, widget, or Certified Assurance).',
    hi: 'टीम से बात करवाता हूँ। संपर्क पेज खोल रहा हूँ — बताएँ कौन सा पैकेज चाहिए (स्कैन, सुधार, विजेट, या Certified Assurance)।',
  },
  {
    id: 'login',
    keywords: ['login', 'sign in', 'dashboard', 'account', 'लॉगिन'],
    navigate: '/login',
    suggestions: ['Sign up', 'What do you offer?', 'Free scan'],
    en: 'Opening the login page so you can reach your dashboard.',
    hi: 'लॉगिन पेज खोल रहा हूँ — वहाँ से डैशबोर्ड मिलेगा।',
  },
  {
    id: 'signup',
    keywords: ['sign up', 'signup', 'register', 'trial', 'create account', 'साइन अप'],
    navigate: '/signup',
    suggestions: ['What plans exist?', 'Free scan', 'Login'],
    en: 'Opening sign-up. Developer is ₹1,499/month for one site; Professional is ₹7,999/month for teams and the widget. You can also start with a free scan.',
    hi: 'साइन अप खोल रहा हूँ। Developer ₹1,499/माह (एक साइट); Professional ₹7,999/माह (टीम + विजेट)। मुफ़्त स्कैन से भी शुरू कर सकते हैं।',
  },
  {
    id: 'a11y',
    keywords: [
      'accessibility',
      'a11y',
      'screen reader',
      'keyboard',
      'contrast',
      'alt text',
      'disability',
      'एक्सेसिबिलिटी',
      'सुलभ',
    ],
    suggestions: ['What is WCAG 2.2 AA?', 'What does AccessibleNow offer?', 'Scan my website'],
    en: 'Digital accessibility means websites, apps, and documents work for people with disabilities — vision, hearing, motor, and cognitive. In practice: keyboard access, screen-reader names, contrast, captions, clear language. In India that duty sits under RPwD 2016, IS 17802, GIGW 3.0, WCAG 2.2 AA, and for listed firms SEBI 2024. AccessibleNow scans, remediates, and evidences that work.',
    hi: 'डिजिटल एक्सेसिबिलिटी का मतलब है साइट, ऐप और दस्तावेज़ विकलांग लोगों के लिए काम करें — दृष्टि, श्रवण, मोटर, संज्ञान। कीबोर्ड, स्क्रीन रीडर, कंट्रास्ट, कैप्शन, साफ़ भाषा। भारत में यह RPwD 2016, IS 17802, GIGW 3.0, WCAG 2.2 AA और listed कंपनियों के लिए SEBI 2024 के तहत आता है। AccessibleNow स्कैन, सुधार और प्रमाण देता है।',
  },
];

const DEFAULT_SUGGESTIONS = [
  'What is WCAG 2.2 AA?',
  'What does AccessibleNow offer?',
  'Scan my website',
  'What is the RPwD Act?',
];

export function sanitizeNavigatePath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return undefined;
  const [pathname] = trimmed.split('?');
  if (!pathname) return undefined;
  if (ALLOWED_PATHS.has(pathname)) return trimmed;
  return undefined;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreKeywords(haystack: string, keywords: readonly string[]): number {
  return keywords.reduce((total, keyword) => {
    return haystack.includes(keyword.toLowerCase()) ? total + Math.max(keyword.length, 3) : total;
  }, 0);
}

export function fallbackMarketingChat(message: string, locale: ChatLocale): ChatReply {
  const text = normalize(message);
  const wantsNav = NAV_INTENT.test(text);

  let bestPage: (typeof MARKETING_CHAT_PAGES)[number] | undefined;
  let bestPageScore = 0;
  for (const page of MARKETING_CHAT_PAGES) {
    const score = scoreKeywords(text, page.keywords);
    if (score > bestPageScore) {
      bestPageScore = score;
      bestPage = page;
    }
  }

  let bestTopic: Topic | undefined;
  let bestTopicScore = 0;
  for (const topic of TOPICS) {
    const score = scoreKeywords(text, topic.keywords);
    if (score > bestTopicScore) {
      bestTopicScore = score;
      bestTopic = topic;
    }
  }

  if (wantsNav && bestPage && bestPageScore >= 3) {
    const label = locale === 'hi' ? bestPage.labelHi : bestPage.labelEn;
    return {
      reply:
        locale === 'hi'
          ? `${label} खोल रहा हूँ।`
          : `Opening ${label}.`,
      navigate: bestPage.path,
      suggestions: [...DEFAULT_SUGGESTIONS],
      confident: true,
    };
  }

  if (bestTopic && bestTopicScore >= 4) {
    return {
      reply: locale === 'hi' ? bestTopic.hi : bestTopic.en,
      navigate: bestTopic.navigate,
      suggestions: [...bestTopic.suggestions],
      confident: true,
    };
  }

  if (bestPage && bestPageScore >= 5) {
    const label = locale === 'hi' ? bestPage.labelHi : bestPage.labelEn;
    return {
      reply:
        locale === 'hi'
          ? `${label} के बारे में और जानना है? पेज खोल सकता हूँ, या WCAG, GIGW, RPwD, पैकेज के बारे में पूछें।`
          : `I can open ${label}, or answer WCAG, GIGW, RPwD, IS 17802, SEBI, and what AccessibleNow sells.`,
      navigate: bestPage.path,
      suggestions: [...DEFAULT_SUGGESTIONS],
      confident: true,
    };
  }

  return {
    reply:
      locale === 'hi'
        ? 'मैं डिजिटल एक्सेसिबिलिटी में मदद करता हूँ — WCAG 2.2 AA, GIGW 3.0, RPwD अधिनियम, IS 17802, SEBI, और AccessibleNow के पैकेज। स्कैन, विजेट, सेवाएँ या लॉगिन भी खोल सकता हूँ। क्या जानना है?'
        : 'I can help with digital accessibility — WCAG 2.2 AA, GIGW 3.0, the RPwD Act, IS 17802, SEBI, and what AccessibleNow offers. I can also open Scan, Services, Widget, or Login. What do you want to know?',
    suggestions: [...DEFAULT_SUGGESTIONS],
  };
}

export const MARKETING_CHAT_SYSTEM_PROMPT = `You are AccessibleNow’s marketing assistant on accessiblenow.in / accessshield.in.

Answer ONLY:
- Digital accessibility (disability, screen readers, keyboard, contrast, captions, forms, PDFs, mobile)
- Standards: WCAG 2.2 AA (W3C), GIGW 3.0 (Indian government websites), RPwD Act 2016 (India, especially ss. 40–46), IS 17802 (BIS ICT accessibility), SEBI accessibility circular 2024 (listed companies)
- What AccessibleNow offers, prices below, and how to start

AccessibleNow offerings (INR, excl. 18% GST; illustrative):
- Free website scan: /scan
- Access Widget: ₹4,999 one-time overlay. NOT WCAG conformance by itself.
- Automated Site Scan: ₹9,999 one-time findings report
- Scan & Remediation: ₹19,999 one-time (most chosen)
- Certified Assurance: ₹24,999/month, 5 website scans + auditor-led manual testing
- Document scans: 50 free, then ₹500/file (PDF, Word, decks) — /document-scanner
- Developer SaaS: ₹1,499/month, 1 site, 10 scans
- Professional SaaS: ₹7,999/month, 10 assets, widget, reports
- Enterprise: custom / contact sales
A widget or automated scan alone does not certify WCAG conformance.

Allowed navigate paths (use exactly one when the user wants to go somewhere):
/ /scan /services /widget /document-scanner /contact /blog /signup /login /wcag-2-2-aa /gigw /rpwd-act /is-17802 /sebi-accessibility /about /docs /accessibility-statement /privacy /terms
Optional query: /contact?service=access-widget|automated-site-scan|scan-remediation|certified-assurance|audit-web
/signup?plan=developer|professional

Rules:
- Reply in the user's language (English or Hindi). Hindi must be Unicode Devanagari, never ASCII transliteration.
- Max 110 words. Plain language. No legalese as formal counsel — say organisations should get legal advice for liability.
- Never invent prices or pages. Never claim a competitor’s pricing.
- Never ask for Aadhaar, PAN, passwords, or card numbers.
- If asked something unrelated (cooking, sports, exploits), briefly refuse and steer back to accessibility.
- If they want to go to a page, set navigate to an allowed path.

Respond with JSON only:
{"reply":"string","navigate":"optional path or null","suggestions":["short follow-up","short follow-up","short follow-up"]}
`;

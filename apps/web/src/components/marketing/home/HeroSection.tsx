'use client';

import { ButtonAnchor, ButtonLink } from '@/components/marketing/ButtonLink';
import { HeroScanInput } from '@/components/marketing/home/HeroScanInput';
import { useDictionary } from '@/lib/i18n/locale-context';

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-emerald-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function HeroSection() {
  const { home, common } = useDictionary();
  const { hero } = home;
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;
  const demoHref = calendlyUrl || '/contact?plan=enterprise';

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#07070c] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-violet-500/[0.08] blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">
              {hero.badges[0]}
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.25rem]">
              {hero.titleLine1}{' '}
              <span className="text-violet-200">{hero.titleHighlight}</span>
              {hero.titleLine2 ? <> {hero.titleLine2}</> : null}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-zinc-300 lg:mx-0">
              {hero.subtitle}
            </p>

            <HeroScanInput />

            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              {calendlyUrl ? (
                <ButtonAnchor
                  href={calendlyUrl}
                  size="lg"
                  variant="secondary"
                  className="w-full min-w-[200px] sm:w-auto"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {common.actions.bookDemo}
                </ButtonAnchor>
              ) : (
                <ButtonLink
                  href={demoHref}
                  size="lg"
                  variant="secondary"
                  className="w-full min-w-[200px] sm:w-auto"
                >
                  {common.actions.bookDemo}
                </ButtonLink>
              )}
            </div>

            <p className="mt-4 text-sm leading-normal text-zinc-400">{hero.footnote}</p>

            <ul
              className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start"
              aria-label={hero.standardsAria}
            >
              {hero.standards.map((standard) => (
                <li
                  key={standard}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200"
                >
                  {standard}
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative mx-auto w-full max-w-lg lg:mx-0">
            <HeroReportPreview />
            <figcaption className="sr-only">{hero.visual.figcaption}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function HeroReportPreview() {
  const { home, common } = useDictionary();
  const { hero } = home;
  const card = hero.reportCard;
  const issues = [
    { count: 4, label: common.severity.critical, text: 'text-red-300', bg: 'bg-red-950/80' },
    { count: 9, label: common.severity.serious, text: 'text-amber-300', bg: 'bg-amber-950/70' },
    { count: 8, label: common.severity.moderate, text: 'text-violet-300', bg: 'bg-violet-950/70' },
    { count: 4, label: common.severity.minor, text: 'text-zinc-300', bg: 'bg-zinc-800' },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-400">{card.auditFile}</p>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400">
          <CheckIcon />
          {hero.visual.scanComplete}
          <span className="font-medium text-zinc-400">· {hero.visual.scanTime}</span>
        </p>
      </div>

      <p className="mt-3 text-xl font-semibold text-white">{card.title}</p>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div
            className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
            style={{
              background:
                'conic-gradient(#34d399 0 259deg, #3f3f46 259deg 360deg)',
            }}
            role="img"
            aria-label={`${card.scoreLabel}: 72`}
          >
            <span className="absolute inset-[0.4rem] grid place-items-center rounded-full bg-[#12121a] text-2xl font-bold text-white">
              72
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-400">{card.scoreLabel}</p>
            <p className="mt-1 text-base font-semibold text-white">{card.scoreMeta}</p>
          </div>
        </div>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-2" aria-label={card.scoreMeta}>
        {issues.map((issue) => (
          <li
            key={issue.label}
            className={`flex min-h-11 items-center justify-between rounded-md px-3 py-2 ${issue.bg}`}
          >
            <span className={`text-sm font-medium ${issue.text}`}>{issue.label}</span>
            <span className={`text-sm font-bold ${issue.text}`}>{issue.count}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 border-t border-white/10 pt-4">
        <p className="text-sm font-semibold text-zinc-300">{card.exportsTitle}</p>
        <ul className="mt-3 space-y-2">
          {card.exports.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-zinc-200">{item.label}</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                {item.status === 'Ready' || item.status.includes('Ready') ? <CheckIcon /> : null}
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

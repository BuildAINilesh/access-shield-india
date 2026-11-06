import type { Metadata } from 'next';
import { ButtonLink } from '@/components/marketing/ButtonLink';
import { PricingOfferings } from '@/components/marketing/pricing/PricingOfferings';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import { AUTOMATION_DISCLAIMER } from '@/lib/pricing/catalog';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return {
    title: dict.pages.servicesHub.meta.title,
    description: dict.pages.servicesHub.meta.description,
    openGraph: {
      title: `${dict.pages.servicesHub.meta.title} | ${dict.common.brand}`,
      description: dict.pages.servicesHub.meta.description,
      type: 'website',
    },
    alternates: {
      canonical: 'https://accessshield.in/services',
    },
  };
}

export default async function ServicesHubPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = getDictionary(locale);
  const { servicesHub } = dict.pages;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Accessibility Audit and Reporting',
            description: servicesHub.meta.description,
            provider: {
              '@type': 'Organization',
              name: dict.common.brand,
              url: 'https://accessshield.in',
            },
            areaServed: { '@type': 'Country', name: 'India' },
            serviceType: 'Digital Accessibility Audit',
          }),
        }}
      />

      <header className="border-b border-white/10 bg-[#07070c] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {servicesHub.hero.title}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
            {servicesHub.hero.subtitle}
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400" role="note">
            {AUTOMATION_DISCLAIMER}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink href="#packages-heading" size="lg" variant="primary" className="min-w-[240px]">
              {servicesHub.hero.primaryCta}
            </ButtonLink>
            <ButtonLink href="/scan" size="lg" variant="secondary" className="min-w-[240px]">
              {servicesHub.hero.secondaryCta}
            </ButtonLink>
          </div>
        </div>
      </header>

      <section
        aria-labelledby="service-heading"
        className="border-b border-white/10 bg-[#07070c] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {servicesHub.service.tagline}
          </p>
          <h2 id="service-heading" className="mt-3 text-3xl font-semibold text-white">
            {servicesHub.service.name}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-400">
            {servicesHub.service.body}
          </p>

          <h3 className="mt-12 text-xl font-semibold text-white">
            {servicesHub.service.deliverablesTitle}
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {servicesHub.service.deliverables.map((item) => (
              <li
                key={item}
                className="rounded-lg border border-white/10 bg-[#12121a] px-4 py-3 text-sm leading-normal text-zinc-300"
              >
                {item}
              </li>
            ))}
          </ul>

          <h3 className="mt-12 text-xl font-semibold text-white">
            {servicesHub.service.processTitle}
          </h3>
          <ol className="mt-6 grid gap-6 sm:grid-cols-3">
            {servicesHub.service.process.map((step) => (
              <li key={step.step} className="rounded-xl border border-white/10 bg-[#12121a] p-6">
                <p className="text-xs font-semibold tracking-[0.16em] text-zinc-500">{step.step}</p>
                <h4 className="mt-3 text-lg font-semibold text-white">{step.title}</h4>
                <p className="mt-2 text-sm leading-normal text-zinc-400">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="packages-heading"
        className="border-b border-white/10 bg-[#0a0a10] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <PricingOfferings />
        </div>
      </section>

      <section
        aria-labelledby="why-india-heading"
        className="bg-[#07070c] px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <h2 id="why-india-heading" className="text-center text-3xl font-semibold text-white">
            {servicesHub.whyIndia.title}
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {servicesHub.whyIndia.stats.map(({ value, label }) => (
              <div
                key={value}
                className="flex flex-col items-center rounded-xl border border-white/10 bg-[#12121a] p-8 text-center"
              >
                <p className="text-3xl font-semibold text-white">{value}</p>
                <p className="mt-3 text-base leading-normal text-zinc-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

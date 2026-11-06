'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { useDictionary } from '@/lib/i18n/locale-context';
import { cn } from '@/lib/utils';

export function PricingFaq() {
  const { pricing } = useDictionary();

  return (
    <section aria-labelledby="faq-heading" className="bg-[#07070c] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 id="faq-heading" className="text-center text-3xl font-semibold text-white">
          {pricing.faq.title}
        </h2>
        <Accordion.Root type="single" collapsible className="mt-12 space-y-4">
          {pricing.faq.questions.map(({ question, answer }, index) => (
            <Accordion.Item
              key={question}
              value={`item-${index}`}
              className="rounded-lg border border-white/10 bg-[#12121a]"
            >
              <Accordion.Header>
                <Accordion.Trigger
                  className={cn(
                    'flex w-full items-center justify-between gap-4 px-6 py-4 text-left',
                    'text-lg font-semibold text-white',
                    'hover:text-zinc-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c] rounded-lg',
                  )}
                >
                  <span>{question}</span>
                  <span
                    className="shrink-0 text-2xl text-zinc-400 transition-transform duration-200 [[data-state=open]_&]:rotate-45"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                <div className="px-6 pb-4 pt-2">
                  <p className="text-base leading-normal text-zinc-400">{answer}</p>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}

'use client';

import { MessageSquare } from 'lucide-react';
import { Button } from '@accessshield/ui';

/**
 * Help card for Slack digests (AN-F010).
 * Storage is org_webhooks — paste a Slack Incoming Webhook URL and subscribe to digest.daily.
 */
export function SlackDigestCard() {
  return (
    <section
      className="rounded-lg border border-border bg-bg-primary p-6"
      aria-labelledby="slack-digest-heading"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-100"
            aria-hidden="true"
          >
            <MessageSquare className="h-5 w-5 text-primary-700" />
          </div>
          <div>
            <h2 id="slack-digest-heading" className="text-lg font-semibold text-text-primary">
              Slack digest
            </h2>
            <p className="mt-1 text-sm leading-normal text-text-secondary">
              Paste a Slack Incoming Webhook URL under Outbound webhooks and subscribe to{' '}
              <strong className="font-medium text-text-primary">Daily digest</strong> (and optionally{' '}
              <strong className="font-medium text-text-primary">Scan completed</strong>). AccessibleNow
              posts a Block Kit summary once per day with open critical/serious counts and top issues —
              no Slack Bot OAuth required.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-text-secondary">
              <li>
                In Slack: Apps → Incoming Webhooks → Add to channel → copy the{' '}
                <code className="rounded bg-bg-tertiary px-1 text-xs">hooks.slack.com</code> URL
              </li>
              <li>Below, create a webhook with that URL and enable Daily digest</li>
            </ol>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 shrink-0"
          onClick={() => {
            document.getElementById('outbound-webhooks')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Jump to webhooks
        </Button>
      </div>
    </section>
  );
}

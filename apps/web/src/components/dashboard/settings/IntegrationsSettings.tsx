'use client';

import { GitHubIntegrationCard } from '@/components/dashboard/settings/GitHubIntegrationCard';
import { JiraIntegrationCard } from '@/components/dashboard/settings/JiraIntegrationCard';
import { SlackDigestCard } from '@/components/dashboard/settings/SlackDigestCard';
import { WebhooksSettingsCard } from '@/components/dashboard/settings/WebhooksSettingsCard';

/** Integrations tab — Jira, GitHub Apply, Slack digest help, outbound webhooks (AN-F010). */
export function IntegrationsSettings() {
  return (
    <div className="space-y-10">
      <JiraIntegrationCard />
      <GitHubIntegrationCard />
      <SlackDigestCard />
      <WebhooksSettingsCard />
    </div>
  );
}

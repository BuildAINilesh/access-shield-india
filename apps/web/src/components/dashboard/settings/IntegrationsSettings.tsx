'use client';

import { JiraIntegrationCard } from '@/components/dashboard/settings/JiraIntegrationCard';
import { WebhooksSettingsCard } from '@/components/dashboard/settings/WebhooksSettingsCard';

/** Integrations tab — Jira + outbound webhooks (AN-F010). */
export function IntegrationsSettings() {
  return (
    <div className="space-y-10">
      <JiraIntegrationCard />
      <WebhooksSettingsCard />
    </div>
  );
}

-- AN Priority Score + Webhooks (AN-F007 / AN-F010)

CREATE TABLE IF NOT EXISTS "priority_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "user_impact_weight" double precision DEFAULT 0.4 NOT NULL,
  "regulatory_weight" double precision DEFAULT 0.3 NOT NULL,
  "at_coverage_weight" double precision DEFAULT 0.2 NOT NULL,
  "fix_complexity_weight" double precision DEFAULT 0.1 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "priority_configs_org_uidx" ON "priority_configs" ("organisation_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "org_webhooks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "url" text NOT NULL,
  "secret" varchar(128) NOT NULL,
  "events" text[] NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_webhooks_org_idx" ON "org_webhooks" ("organisation_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "webhook_id" uuid NOT NULL REFERENCES "org_webhooks"("id") ON DELETE cascade,
  "event_type" varchar(64) NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "payload_json" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_org_idx" ON "webhook_deliveries" ("organisation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_idx" ON "webhook_deliveries" ("webhook_id");

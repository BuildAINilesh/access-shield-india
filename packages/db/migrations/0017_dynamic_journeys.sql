-- AN Dynamic journeys (AN-F003)

CREATE TABLE IF NOT EXISTS "journeys" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "name" varchar(255) NOT NULL,
  "slug" varchar(128) NOT NULL,
  "description" text,
  "definition_json" jsonb NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journeys_org_idx" ON "journeys" ("organisation_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "journeys_org_slug_uidx" ON "journeys" ("organisation_id", "slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "journey_credentials" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "journey_id" uuid NOT NULL REFERENCES "journeys"("id") ON DELETE cascade,
  "label" varchar(128) DEFAULT 'default' NOT NULL,
  "ciphertext" text NOT NULL,
  "iv" varchar(64) NOT NULL,
  "auth_tag" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journey_credentials_journey_idx" ON "journey_credentials" ("journey_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "journey_scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "journey_id" uuid NOT NULL REFERENCES "journeys"("id") ON DELETE cascade,
  "status" varchar(32) DEFAULT 'queued' NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "error_message" text,
  "failure_map_json" jsonb,
  "total_violations" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journey_scans_org_idx" ON "journey_scans" ("organisation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journey_scans_journey_idx" ON "journey_scans" ("journey_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "journey_step_results" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "journey_scan_id" uuid NOT NULL REFERENCES "journey_scans"("id") ON DELETE cascade,
  "step_id" varchar(128) NOT NULL,
  "step_index" integer NOT NULL,
  "action" varchar(64) NOT NULL,
  "status" varchar(32) NOT NULL,
  "page_url" text,
  "violation_count" integer DEFAULT 0 NOT NULL,
  "violations_json" jsonb DEFAULT '[]'::jsonb,
  "error_message" text,
  "duration_ms" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "journey_step_results_scan_idx" ON "journey_step_results" ("journey_scan_id");

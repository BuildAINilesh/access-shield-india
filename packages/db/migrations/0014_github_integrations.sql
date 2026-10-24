-- GitHub App installations for AN Fix apply (AN-F005 / AN-F010)

CREATE TABLE IF NOT EXISTS "github_installations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "installation_id" bigint NOT NULL,
  "account_login" varchar(255) NOT NULL,
  "account_type" varchar(32) DEFAULT 'Organization' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_installations_org_active_uidx" ON "github_installations" ("organisation_id") WHERE "deleted_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_installations_installation_idx" ON "github_installations" ("installation_id");

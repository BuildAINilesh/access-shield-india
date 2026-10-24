-- AN Code / AN Fix Phase 1 tables

CREATE TABLE IF NOT EXISTS "code_diagnostics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "session_id" varchar(128),
  "file_hash" varchar(64) NOT NULL,
  "filetype" varchar(32) NOT NULL,
  "violations_json" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_diagnostics_org_idx" ON "code_diagnostics" ("organisation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "code_diagnostics_hash_idx" ON "code_diagnostics" ("file_hash");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fix_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "violation_type" varchar(100) NOT NULL,
  "pattern_regex" text,
  "fix_template" text NOT NULL,
  "explanation" text NOT NULL,
  "confidence_override" varchar(16) DEFAULT 'high' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fix_templates_type_idx" ON "fix_templates" ("violation_type");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fix_suggestions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "violation_id" uuid,
  "rule_id" varchar(100) NOT NULL,
  "code_hash" varchar(64) NOT NULL,
  "fix_code" text NOT NULL,
  "diff" text,
  "explanation" text,
  "confidence" varchar(16) DEFAULT 'medium' NOT NULL,
  "model_version" varchar(100),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fix_suggestions_org_idx" ON "fix_suggestions" ("organisation_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fix_suggestions_hash_idx" ON "fix_suggestions" ("code_hash");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "fix_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "fix_id" uuid REFERENCES "fix_suggestions"("id") ON DELETE set null,
  "repo" varchar(255),
  "pr_number" integer,
  "file_path" text,
  "applied_by" uuid,
  "commit_sha" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "fix_applications_org_idx" ON "fix_applications" ("organisation_id");

-- AN OSS / Intelligence package a11y registry (AN-F002 / AN-F004)

CREATE TABLE IF NOT EXISTS "a11y_package_issues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "an_id" varchar(32) NOT NULL,
  "package_name" varchar(255) NOT NULL,
  "title" text NOT NULL,
  "issue_type" varchar(64) NOT NULL,
  "severity" varchar(16) NOT NULL,
  "at_affected" text[],
  "description" text NOT NULL,
  "fix_status" varchar(32) DEFAULT 'open' NOT NULL,
  "workaround" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "a11y_package_issues_an_id_uidx" ON "a11y_package_issues" ("an_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "a11y_package_issues_package_idx" ON "a11y_package_issues" ("package_name");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "a11y_package_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "issue_id" uuid NOT NULL REFERENCES "a11y_package_issues"("id") ON DELETE cascade,
  "version_range" varchar(128) NOT NULL,
  "fixed_in_version" varchar(64),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "a11y_package_versions_issue_idx" ON "a11y_package_versions" ("issue_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "a11y_issue_reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "package_name" varchar(255) NOT NULL,
  "version" varchar(64),
  "description" text NOT NULL,
  "reporter_email" varchar(255),
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "a11y_issue_reports_status_idx" ON "a11y_issue_reports" ("status");
--> statement-breakpoint

-- Seed high-value entries for CLI / PR Gate demos
INSERT INTO "a11y_package_issues" ("an_id", "package_name", "title", "issue_type", "severity", "at_affected", "description", "fix_status", "workaround")
VALUES
  ('AN-RS-007', 'react-select', 'Keyboard navigation fails for multi-select with VoiceOver', 'keyboard', 'high', ARRAY['VoiceOver+Safari','NVDA+Chrome'], 'Multi-select chips are not announced and Escape does not collapse the menu reliably in react-select v4.', 'open', 'Upgrade to v5.8+ or provide a custom AccessibleSelect using Radix.'),
  ('AN-MUI-001', '@mui/x-date-pickers', 'DatePicker calendar grid not keyboard operable on TalkBack', 'keyboard', 'critical', ARRAY['TalkBack+Chrome'], 'Month grid cells lack roles/names; TalkBack users cannot select a date without a pointer.', 'open', 'Use native input type=date for critical flows or MUI DateField with explicit labels.'),
  ('AN-ANT-003', 'antd', 'Modal focus trap drops focus to document body on close', 'focus', 'medium', ARRAY['NVDA+Chrome','JAWS+Chrome'], 'After closing Modal, focus is not restored to the trigger control.', 'fixed', 'Upgrade antd to 5.12+ or restore focus manually in afterClose.'),
  ('AN-RDP-002', 'react-datepicker', 'Month navigation buttons lack accessible names', 'name', 'high', ARRAY['VoiceOver+Safari','NVDA+Firefox'], 'Previous/Next month icon buttons expose empty accessible names.', 'open', 'Pass previousMonthButtonLabel / nextMonthButtonLabel props.'),
  ('AN-BOOT-001', 'bootstrap', 'Carousel controls missing accessible names in markup-only usage', 'name', 'medium', ARRAY['NVDA+Chrome'], 'Default carousel prev/next buttons rely on CSS content without text alternatives.', 'open', 'Add visually-hidden text or aria-label on carousel controls.'),
  ('AN-RAZOR-001', 'razorpay', 'Checkout iframe title not exposed to assistive tech in older embeds', 'iframe', 'high', ARRAY['NVDA+Chrome','VoiceOver+Safari'], 'Legacy checkout embed omits meaningful iframe title for payment dialog.', 'open', 'Use current Razorpay embed snippet which sets title="Razorpay Checkout".'),
  ('AN-INTERCOM-001', 'intercom-client', 'Messenger launcher button unlabeled when custom icon used', 'name', 'medium', ARRAY['VoiceOver+Safari'], 'Custom launcher icons without aria-label hide the chat control from screen readers.', 'open', 'Set aria-label="Open chat" on the launcher element.'),
  ('AN-FRESH-001', 'freshdesk', 'Widget iframe lacks title attribute', 'iframe', 'medium', ARRAY['JAWS+Chrome'], 'Support widget iframe is announced as "frame" without purpose.', 'open', 'Set title="Freshdesk support widget" on the embed iframe.')
ON CONFLICT ("an_id") DO NOTHING;
--> statement-breakpoint

-- Link version ranges (issue ids resolved by an_id)
INSERT INTO "a11y_package_versions" ("issue_id", "version_range", "fixed_in_version")
SELECT i.id, v.version_range, v.fixed_in_version
FROM (VALUES
  ('AN-RS-007', '>=4.0.0 <5.8.0', '5.8.0'),
  ('AN-MUI-001', '>=6.0.0 <7.5.0', NULL),
  ('AN-ANT-003', '>=5.0.0 <5.12.0', '5.12.0'),
  ('AN-RDP-002', '>=4.0.0 <7.0.0', NULL),
  ('AN-BOOT-001', '>=5.0.0 <5.3.3', '5.3.3'),
  ('AN-RAZOR-001', '*', NULL),
  ('AN-INTERCOM-001', '*', NULL),
  ('AN-FRESH-001', '*', NULL)
) AS v(an_id, version_range, fixed_in_version)
JOIN "a11y_package_issues" i ON i.an_id = v.an_id
WHERE NOT EXISTS (
  SELECT 1 FROM "a11y_package_versions" x WHERE x.issue_id = i.id AND x.version_range = v.version_range
);

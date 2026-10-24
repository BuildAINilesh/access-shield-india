-- AN Learn bootstrap (AN-F006 Phase 2)

CREATE TABLE IF NOT EXISTS "learn_lessons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(128) NOT NULL,
  "title" varchar(500) NOT NULL,
  "summary" text NOT NULL,
  "body_markdown" text NOT NULL,
  "duration_minutes" integer DEFAULT 10 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_published" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "learn_lessons_slug_uidx" ON "learn_lessons" ("slug");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "learn_progress" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "lesson_id" uuid NOT NULL REFERENCES "learn_lessons"("id") ON DELETE cascade,
  "status" varchar(32) DEFAULT 'started' NOT NULL,
  "completed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "learn_progress_org_idx" ON "learn_progress" ("organisation_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "learn_progress_user_lesson_uidx" ON "learn_progress" ("user_id", "lesson_id");
--> statement-breakpoint

INSERT INTO "learn_lessons" ("slug", "title", "summary", "body_markdown", "duration_minutes", "sort_order")
VALUES
  (
    'alt-text-fundamentals',
    'Alt text fundamentals',
    'Write meaningful text alternatives for images — and know when empty alt is correct.',
    E'# Alt text fundamentals\n\nMeaningful `alt` describes the **purpose** of an image in context, not every pixel.\n\n## Rules of thumb\n\n1. Informative images need concise alt that conveys the same information.\n2. Decorative images use empty alt: `alt=\"\"` so assistive tech skips them.\n3. Complex images (charts) need a short alt **plus** a longer description nearby.\n\n## WCAG\n\nMaps to **1.1.1 Non-text Content** (Level A).\n\n## Try it\n\nReplace `alt=\"image\"` with a specific phrase, or empty alt when the image is purely decorative.',
    8,
    1
  ),
  (
    'keyboard-focus-basics',
    'Keyboard and focus basics',
    'Make sure every interactive control is reachable and has a visible focus indicator.',
    E'# Keyboard and focus basics\n\nIf you can click it, you must be able to Tab to it — and see where focus is.\n\n## Checklist\n\n- Tab order matches visual reading order.\n- No keyboard traps (Escape or Tab must exit modals).\n- Focus ring meets **3:1** contrast (WCAG 2.4.7 / 2.4.11).\n\n## Common fails\n\n`outline: none` without a custom `:focus-visible` style.',
    10,
    2
  ),
  (
    'form-labels-errors',
    'Form labels and errors',
    'Associate labels, required state, and error messages so screen reader users get the full story.',
    E'# Form labels and errors\n\nEvery input needs a visible label tied with `for`/`id` or `aria-labelledby`.\n\n## Errors\n\n- Use `aria-invalid=\"true\"` when invalid.\n- Point `aria-describedby` at the error text.\n- Prefer `role=\"alert\"` or `aria-live=\"polite\"` for new errors.\n\nNever rely on colour alone (WCAG 1.4.1).',
    12,
    3
  )
ON CONFLICT ("slug") DO NOTHING;

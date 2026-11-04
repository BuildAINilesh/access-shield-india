import { relations } from 'drizzle-orm';
import {
  bigint,
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** Reusable timestamp columns — all dates stored as ISO 8601 in UTC */
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date().toISOString()),
};

/** Multi-tenancy column present on every tenant-scoped table */
const orgId = () =>
  uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'cascade' });

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'customer_admin',
  'accessibility_officer',
  'developer',
  'auditor',
]);

export const assetTypeEnum = pgEnum('asset_type', [
  'website',
  'web_app',
  'mobile_app',
  'document',
  'pdf',
]);

export const scanStatusEnum = pgEnum('scan_status', ['pending', 'running', 'completed', 'failed']);

export const issueStatusEnum = pgEnum('issue_status', [
  'open',
  'in_progress',
  'resolved',
  'wont_fix',
  'duplicate',
]);

export const issueSeverityEnum = pgEnum('issue_severity', [
  'critical',
  'serious',
  'moderate',
  'minor',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
]);

export const certificateStatusEnum = pgEnum('certificate_status', ['active', 'expired', 'revoked']);

export const scanPageJobStatusEnum = pgEnum('scan_page_job_status', [
  'pending',
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
  'skipped',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'scan',
  'export',
  'invite',
]);

// ─── Organisations ───────────────────────────────────────────────────────────

export const organisations = pgTable(
  'organisations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    gstin: varchar('gstin', { length: 15 }),
    billingEmail: varchar('billing_email', { length: 255 }),
    isActive: boolean('is_active').notNull().default(true),
    planTier: varchar('plan_tier', { length: 50 }).notNull().default('starter'),
    /** AI inference backend: anthropic | local */
    aiProvider: varchar('ai_provider', { length: 50 }).notNull().default('local'),
    /** Model id for the selected provider */
    aiModel: varchar('ai_model', { length: 150 })
      .notNull()
      .default('Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF'),
    ...timestamps,
  },
  (table) => ({
    slugIdx: index('organisations_slug_idx').on(table.slug),
  }),
);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    /** IdP auth user ID (Keycloak / legacy Supabase Auth UUID) */
    authUserId: uuid('auth_user_id').notNull().unique(),
    email: varchar('email', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }),
    role: userRoleEnum('role').notNull().default('developer'),
    isActive: boolean('is_active').notNull().default(true),
    mfaEnabled: boolean('mfa_enabled').notNull().default(false),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true, mode: 'string' }),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('users_org_idx').on(table.organisationId),
    authUserIdx: index('users_auth_user_idx').on(table.authUserId),
    emailIdx: index('users_email_idx').on(table.email),
  }),
);

// ─── Assets ──────────────────────────────────────────────────────────────────

export const assets = pgTable(
  'assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    name: varchar('name', { length: 255 }).notNull(),
    url: text('url').notNull(),
    type: assetTypeEnum('type').notNull().default('website'),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    lastScannedAt: timestamp('last_scanned_at', { withTimezone: true, mode: 'string' }),
    /** Compliance standards selected when the asset was added */
    standards: text('standards')
      .array()
      .notNull()
      .default(['WCAG22']),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('assets_org_idx').on(table.organisationId),
    urlIdx: index('assets_url_idx').on(table.url),
  }),
);

// ─── Scans ───────────────────────────────────────────────────────────────────

export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    initiatedBy: uuid('initiated_by').references(() => users.id, { onDelete: 'set null' }),
    status: scanStatusEnum('status').notNull().default('pending'),
    wcagLevel: varchar('wcag_level', { length: 10 }).notNull().default('AA'),
    wcagVersion: varchar('wcag_version', { length: 10 }).notNull().default('2.2'),
    pagesScanned: integer('pages_scanned').notNull().default(0),
    violationCount: integer('violation_count').notNull().default(0),
    score: integer('score'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    errorMessage: text('error_message'),
    /** Standards this scan was run against (copied from the request / asset) */
    standards: text('standards')
      .array()
      .notNull()
      .default(['WCAG22']),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('scans_org_idx').on(table.organisationId),
    assetIdx: index('scans_asset_idx').on(table.assetId),
    statusIdx: index('scans_status_idx').on(table.status),
  }),
);

// ─── Scan page jobs (pipeline v2 — one row per URL in a scan) ───────────────

export const scanPageJobs = pgTable(
  'scan_page_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    /** Normalized URL for idempotent upserts within a scan */
    urlNormalized: text('url_normalized').notNull(),
    authRequired: boolean('auth_required').notNull().default(false),
    status: scanPageJobStatusEnum('status').notNull().default('pending'),
    attempt: integer('attempt').notNull().default(0),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('scan_page_jobs_org_idx').on(table.organisationId),
    scanIdx: index('scan_page_jobs_scan_idx').on(table.scanId),
    scanStatusIdx: index('scan_page_jobs_scan_status_idx').on(table.scanId, table.status),
    scanUrlUnique: uniqueIndex('scan_page_jobs_scan_url_uidx').on(
      table.scanId,
      table.urlNormalized,
    ),
  }),
);

// ─── Violations ──────────────────────────────────────────────────────────────

export const violations = pgTable(
  'violations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    ruleId: varchar('rule_id', { length: 100 }).notNull(),
    impact: issueSeverityEnum('impact').notNull(),
    description: text('description').notNull(),
    helpUrl: text('help_url'),
    wcagCriteria: varchar('wcag_criteria', { length: 50 }).array(),
    selector: text('selector'),
    html: text('html'),
    pageUrl: text('page_url'),
    /** WCAG22 | IS17802 | GIGW3 | SEBI */
    standard: varchar('standard', { length: 20 }).notNull().default('WCAG22'),
    /** Dedup key within a scan — SHA-based fingerprint from scanner */
    fingerprint: varchar('fingerprint', { length: 64 }),
    aiFix: text('ai_fix'),
    aiExplanation: text('ai_explanation'),
    aiAltText: text('ai_alt_text'),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('violations_org_idx').on(table.organisationId),
    scanIdx: index('violations_scan_idx').on(table.scanId),
    ruleIdx: index('violations_rule_idx').on(table.ruleId),
    scanFingerprintUnique: uniqueIndex('violations_scan_fingerprint_uidx').on(
      table.scanId,
      table.fingerprint,
    ),
  }),
);

// ─── Issues (tracked remediation items) ────────────────────────────────────

export const issues = pgTable(
  'issues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    violationId: uuid('violation_id').references(() => violations.id, { onDelete: 'set null' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    assignedTo: uuid('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description'),
    status: issueStatusEnum('status').notNull().default('open'),
    severity: issueSeverityEnum('severity').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'string' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'string' }),
    resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('issues_org_idx').on(table.organisationId),
    assetIdx: index('issues_asset_idx').on(table.assetId),
    statusIdx: index('issues_status_idx').on(table.status),
    assignedIdx: index('issues_assigned_idx').on(table.assignedTo),
  }),
);

// ─── Certificates ────────────────────────────────────────────────────────────

export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    certificateNumber: varchar('certificate_number', { length: 100 }).notNull().unique(),
    status: certificateStatusEnum('status').notNull().default('active'),
    wcagLevel: varchar('wcag_level', { length: 10 }).notNull().default('AA'),
    wcagVersion: varchar('wcag_version', { length: 10 }).notNull().default('2.2'),
    issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'string' }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'string' }),
    revokeReason: text('revoke_reason'),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('certificates_org_idx').on(table.organisationId),
    assetIdx: index('certificates_asset_idx').on(table.assetId),
    statusIdx: index('certificates_status_idx').on(table.status),
  }),
);

// ─── Reports ─────────────────────────────────────────────────────────────────

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    scanId: uuid('scan_id')
      .notNull()
      .references(() => scans.id, { onDelete: 'cascade' }),
    generatedBy: uuid('generated_by').references(() => users.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 500 }).notNull(),
    format: varchar('format', { length: 20 }).notNull().default('pdf'),
    storagePath: text('storage_path'),
    fileSizeBytes: integer('file_size_bytes'),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('reports_org_idx').on(table.organisationId),
    scanIdx: index('reports_scan_idx').on(table.scanId),
  }),
);

// ─── Invoices (amounts in paise — integer) ───────────────────────────────────

export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull().unique(),
    status: invoiceStatusEnum('status').notNull().default('draft'),
    /** Amount in paise (1 INR = 100 paise) */
    subtotalPaise: integer('subtotal_paise').notNull(),
    /** GST amount in paise */
    gstPaise: integer('gst_paise').notNull().default(0),
    /** Total amount in paise */
    totalPaise: integer('total_paise').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    billingPeriodStart: timestamp('billing_period_start', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    billingPeriodEnd: timestamp('billing_period_end', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true, mode: 'string' }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true, mode: 'string' }),
    lineItems: jsonb('line_items').$type<InvoiceLineItem[]>().notNull().default([]),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('invoices_org_idx').on(table.organisationId),
    statusIdx: index('invoices_status_idx').on(table.status),
  }),
);

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  /** Unit price in paise */
  unitPricePaise: number;
  /** Line total in paise */
  totalPaise: number;
}

// ─── Widget Preferences ──────────────────────────────────────────────────────

export const widgetPreferences = pgTable(
  'widget_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    assetId: uuid('asset_id').references(() => assets.id, { onDelete: 'cascade' }),
    /** Widget position on page */
    position: varchar('position', { length: 20 }).notNull().default('bottom-right'),
    primaryColor: varchar('primary_color', { length: 7 }).notNull().default('#005fcc'),
    language: varchar('language', { length: 10 }).notNull().default('en'),
    features: jsonb('features').$type<WidgetFeatures>().notNull().default({
      textSize: true,
      contrast: true,
      screenReader: true,
      keyboardNav: true,
      dyslexiaFont: false,
      highlightLinks: true,
      pauseAnimations: true,
    }),
    isEnabled: boolean('is_enabled').notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('widget_prefs_org_idx').on(table.organisationId),
    assetIdx: index('widget_prefs_asset_idx').on(table.assetId),
  }),
);

export interface WidgetFeatures {
  textSize: boolean;
  contrast: boolean;
  screenReader: boolean;
  keyboardNav: boolean;
  dyslexiaFont: boolean;
  highlightLinks: boolean;
  pauseAnimations: boolean;
}

// ─── Widget Analytics (daily aggregates) ─────────────────────────────────────

export const widgetAnalyticsDaily = pgTable(
  'widget_analytics_daily',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    date: date('date', { mode: 'string' }).notNull(),
    eventType: varchar('event_type', { length: 40 }).notNull(),
    feature: varchar('feature', { length: 60 }).notNull().default(''),
    count: integer('count').notNull().default(0),
  },
  (table) => ({
    orgIdx: index('widget_analytics_daily_org_idx').on(table.organisationId),
    dateIdx: index('widget_analytics_daily_date_idx').on(table.date),
    orgDateTypeFeatureUnique: uniqueIndex('widget_analytics_daily_uidx').on(
      table.organisationId,
      table.date,
      table.eventType,
      table.feature,
    ),
  }),
);

// ─── Audit Logs ──────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: auditActionEnum('action').notNull(),
    resourceType: varchar('resource_type', { length: 100 }).notNull(),
    resourceId: uuid('resource_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('audit_logs_org_idx').on(table.organisationId),
    userIdx: index('audit_logs_user_idx').on(table.userId),
    actionIdx: index('audit_logs_action_idx').on(table.action),
    createdIdx: index('audit_logs_created_idx').on(table.createdAt),
  }),
);

// ─── Waitlist Signups ────────────────────────────────────────────────────────

export const waitlistSignups = pgTable(
  'waitlist_signups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }).notNull(),
    companySize: varchar('company_size', { length: 50 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: index('waitlist_signups_email_idx').on(table.email),
    createdIdx: index('waitlist_signups_created_idx').on(table.createdAt),
  }),
);

// ─── Document Scanner ────────────────────────────────────────────────────────

export const documentScanJobs = pgTable(
  'document_scan_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    /** Application users.id (not IdP auth UUID) */
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    documentName: text('document_name').notNull(),
    documentType: text('document_type').notNull(),
    documentSizeBytes: bigint('document_size_bytes', { mode: 'number' }),
    pageCount: integer('page_count'),
    s3Key: text('s3_key').notNull(),
    s3Bucket: text('s3_bucket').notNull().default('accessshield-uploads-prod'),
    status: text('status').notNull().default('queued'),
    progressPercent: integer('progress_percent').default(0),
    standards: text('standards')
      .array()
      .notNull()
      .default(['WCAG_2_1_AA', 'PDF_UA']),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => ({
    orgIdx: index('idx_doc_jobs_org_id').on(table.organisationId),
    statusIdx: index('idx_doc_jobs_status').on(table.status),
    createdIdx: index('idx_doc_jobs_created').on(table.createdAt),
  }),
);

export const documentScanResults = pgTable(
  'document_scan_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .unique()
      .references(() => documentScanJobs.id, { onDelete: 'cascade' }),
    organisationId: orgId(),
    documentName: text('document_name').notNull(),
    documentType: text('document_type').notNull(),
    totalViolations: integer('total_violations').notNull().default(0),
    criticalCount: integer('critical_count').notNull().default(0),
    seriousCount: integer('serious_count').notNull().default(0),
    moderateCount: integer('moderate_count').notNull().default(0),
    minorCount: integer('minor_count').notNull().default(0),
    complianceScore: integer('compliance_score').notNull().default(0),
    violations: jsonb('violations').notNull().default([]),
    summary: jsonb('summary').notNull().default({}),
    gigwCheckpointResults: jsonb('gigw_checkpoint_results').notNull().default({}),
    aiSummary: text('ai_summary'),
    scanDurationSeconds: doublePrecision('scan_duration_seconds'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    jobIdx: index('idx_doc_results_job_id').on(table.jobId),
    orgIdx: index('idx_doc_results_org_id').on(table.organisationId),
  }),
);

export const documentViolations = pgTable(
  'document_violations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => documentScanJobs.id, { onDelete: 'cascade' }),
    organisationId: orgId(),
    violationId: text('violation_id').notNull(),
    checkpointId: text('checkpoint_id').notNull(),
    standard: text('standard').notNull(),
    severity: text('severity').notNull(),
    category: text('category').notNull(),
    description: text('description').notNull(),
    location: text('location'),
    wcagCriterion: text('wcag_criterion'),
    impact: text('impact'),
    remediation: text('remediation'),
    autoFixable: boolean('auto_fixable').default(false),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    jobIdx: index('idx_doc_violations_job_id').on(table.jobId),
    severityIdx: index('idx_doc_violations_severity').on(table.jobId, table.severity),
    categoryIdx: index('idx_doc_violations_category').on(table.jobId, table.category),
    checkpointIdx: index('idx_doc_violations_checkpoint').on(table.checkpointId),
  }),
);

// ─── Relations ───────────────────────────────────────────────────────────────

export const organisationsRelations = relations(organisations, ({ many }) => ({
  users: many(users),
  assets: many(assets),
  scans: many(scans),
  pageJobs: many(scanPageJobs),
  invoices: many(invoices),
  documentScanJobs: many(documentScanJobs),
  documentScanResults: many(documentScanResults),
  documentViolations: many(documentViolations),
  widgetAnalyticsDaily: many(widgetAnalyticsDaily),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [users.organisationId],
    references: [organisations.id],
  }),
  assignedIssues: many(issues),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [assets.organisationId],
    references: [organisations.id],
  }),
  scans: many(scans),
  issues: many(issues),
  certificates: many(certificates),
  widgetPreferences: many(widgetPreferences),
  pageJobs: many(scanPageJobs),
}));

export const scansRelations = relations(scans, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [scans.organisationId],
    references: [organisations.id],
  }),
  asset: one(assets, { fields: [scans.assetId], references: [assets.id] }),
  initiatedByUser: one(users, { fields: [scans.initiatedBy], references: [users.id] }),
  violations: many(violations),
  reports: many(reports),
  certificates: many(certificates),
  pageJobs: many(scanPageJobs),
}));

export const scanPageJobsRelations = relations(scanPageJobs, ({ one }) => ({
  organisation: one(organisations, {
    fields: [scanPageJobs.organisationId],
    references: [organisations.id],
  }),
  scan: one(scans, { fields: [scanPageJobs.scanId], references: [scans.id] }),
  asset: one(assets, { fields: [scanPageJobs.assetId], references: [assets.id] }),
}));

export const violationsRelations = relations(violations, ({ one, many }) => ({
  scan: one(scans, { fields: [violations.scanId], references: [scans.id] }),
  issues: many(issues),
}));

export const issuesRelations = relations(issues, ({ one }) => ({
  organisation: one(organisations, {
    fields: [issues.organisationId],
    references: [organisations.id],
  }),
  asset: one(assets, { fields: [issues.assetId], references: [assets.id] }),
  violation: one(violations, { fields: [issues.violationId], references: [violations.id] }),
  assignee: one(users, { fields: [issues.assignedTo], references: [users.id] }),
}));

export const documentScanJobsRelations = relations(documentScanJobs, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [documentScanJobs.organisationId],
    references: [organisations.id],
  }),
  result: one(documentScanResults, {
    fields: [documentScanJobs.id],
    references: [documentScanResults.jobId],
  }),
  violations: many(documentViolations),
}));

export const documentScanResultsRelations = relations(documentScanResults, ({ one }) => ({
  organisation: one(organisations, {
    fields: [documentScanResults.organisationId],
    references: [organisations.id],
  }),
  job: one(documentScanJobs, {
    fields: [documentScanResults.jobId],
    references: [documentScanJobs.id],
  }),
}));

export const documentViolationsRelations = relations(documentViolations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [documentViolations.organisationId],
    references: [organisations.id],
  }),
  job: one(documentScanJobs, {
    fields: [documentViolations.jobId],
    references: [documentScanJobs.id],
  }),
}));

export const widgetAnalyticsDailyRelations = relations(widgetAnalyticsDaily, ({ one }) => ({
  organisation: one(organisations, {
    fields: [widgetAnalyticsDaily.organisationId],
    references: [organisations.id],
  }),
}));

// ─── AN Code / AN Fix (Phase 1) ──────────────────────────────────────────────

/** Cached IDE / snippet analysis results (AN-F001) */
export const codeDiagnostics = pgTable(
  'code_diagnostics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    sessionId: varchar('session_id', { length: 128 }),
    fileHash: varchar('file_hash', { length: 64 }).notNull(),
    filetype: varchar('filetype', { length: 32 }).notNull(),
    violationsJson: jsonb('violations_json').notNull().$type<unknown[]>(),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('code_diagnostics_org_idx').on(table.organisationId),
    hashIdx: index('code_diagnostics_hash_idx').on(table.fileHash),
  }),
);

/** Pre-approved fix patterns for common violation types (AN-F005) */
export const fixTemplates = pgTable(
  'fix_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    violationType: varchar('violation_type', { length: 100 }).notNull(),
    patternRegex: text('pattern_regex'),
    fixTemplate: text('fix_template').notNull(),
    explanation: text('explanation').notNull(),
    confidenceOverride: varchar('confidence_override', { length: 16 })
      .notNull()
      .default('high'),
    ...timestamps,
  },
  (table) => ({
    typeIdx: index('fix_templates_type_idx').on(table.violationType),
  }),
);

/** Generated fix suggestions cache (AN-F005) */
export const fixSuggestions = pgTable(
  'fix_suggestions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    violationId: uuid('violation_id'),
    ruleId: varchar('rule_id', { length: 100 }).notNull(),
    codeHash: varchar('code_hash', { length: 64 }).notNull(),
    fixCode: text('fix_code').notNull(),
    diff: text('diff'),
    explanation: text('explanation'),
    confidence: varchar('confidence', { length: 16 }).notNull().default('medium'),
    modelVersion: varchar('model_version', { length: 100 }),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('fix_suggestions_org_idx').on(table.organisationId),
    hashIdx: index('fix_suggestions_hash_idx').on(table.codeHash),
  }),
);

/** Applied fix audit log (AN-F005) */
export const fixApplications = pgTable(
  'fix_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    fixId: uuid('fix_id').references(() => fixSuggestions.id, { onDelete: 'set null' }),
    repo: varchar('repo', { length: 255 }),
    prNumber: integer('pr_number'),
    filePath: text('file_path'),
    appliedBy: uuid('applied_by'),
    commitSha: varchar('commit_sha', { length: 64 }),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('fix_applications_org_idx').on(table.organisationId),
  }),
);

export const codeDiagnosticsRelations = relations(codeDiagnostics, ({ one }) => ({
  organisation: one(organisations, {
    fields: [codeDiagnostics.organisationId],
    references: [organisations.id],
  }),
}));

export const fixSuggestionsRelations = relations(fixSuggestions, ({ one }) => ({
  organisation: one(organisations, {
    fields: [fixSuggestions.organisationId],
    references: [organisations.id],
  }),
}));

export const fixApplicationsRelations = relations(fixApplications, ({ one }) => ({
  organisation: one(organisations, {
    fields: [fixApplications.organisationId],
    references: [organisations.id],
  }),
  suggestion: one(fixSuggestions, {
    fields: [fixApplications.fixId],
    references: [fixSuggestions.id],
  }),
}));

/** Org-specific priority scoring weights (AN-F007) */
export const priorityConfigs = pgTable(
  'priority_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    userImpactWeight: doublePrecision('user_impact_weight').notNull().default(0.4),
    regulatoryWeight: doublePrecision('regulatory_weight').notNull().default(0.3),
    atCoverageWeight: doublePrecision('at_coverage_weight').notNull().default(0.2),
    fixComplexityWeight: doublePrecision('fix_complexity_weight').notNull().default(0.1),
    ...timestamps,
  },
  (table) => ({
    orgUnique: uniqueIndex('priority_configs_org_uidx').on(table.organisationId),
  }),
);

/** Outbound webhook endpoints (AN-F010) */
export const orgWebhooks = pgTable(
  'org_webhooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    url: text('url').notNull(),
    secret: varchar('secret', { length: 128 }).notNull(),
    events: text('events').array().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => ({
    orgIdx: index('org_webhooks_org_idx').on(table.organisationId),
  }),
);

export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    webhookId: uuid('webhook_id')
      .notNull()
      .references(() => orgWebhooks.id, { onDelete: 'cascade' }),
    eventType: varchar('event_type', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    payloadJson: jsonb('payload_json'),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('webhook_deliveries_org_idx').on(table.organisationId),
    webhookIdx: index('webhook_deliveries_webhook_idx').on(table.webhookId),
  }),
);

export const priorityConfigsRelations = relations(priorityConfigs, ({ one }) => ({
  organisation: one(organisations, {
    fields: [priorityConfigs.organisationId],
    references: [organisations.id],
  }),
}));

export const orgWebhooksRelations = relations(orgWebhooks, ({ one, many }) => ({
  organisation: one(organisations, {
    fields: [orgWebhooks.organisationId],
    references: [organisations.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  organisation: one(organisations, {
    fields: [webhookDeliveries.organisationId],
    references: [organisations.id],
  }),
  webhook: one(orgWebhooks, {
    fields: [webhookDeliveries.webhookId],
    references: [orgWebhooks.id],
  }),
}));

/** GitHub App installation bound to an organisation (AN-F005 Apply-fix) */
export const githubInstallations = pgTable(
  'github_installations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    installationId: bigint('installation_id', { mode: 'number' }).notNull(),
    accountLogin: varchar('account_login', { length: 255 }).notNull(),
    accountType: varchar('account_type', { length: 32 }).notNull().default('Organization'),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => ({
    // Partial unique (active rows only) is defined in migration 0014 SQL.
    orgIdx: index('github_installations_org_idx').on(table.organisationId),
    installationIdx: index('github_installations_installation_idx').on(table.installationId),
  }),
);

export const githubInstallationsRelations = relations(githubInstallations, ({ one }) => ({
  organisation: one(organisations, {
    fields: [githubInstallations.organisationId],
    references: [organisations.id],
  }),
}));

// ─── AN OSS / Intelligence (AN-F002 / AN-F004) ───────────────────────────────

/** Curated accessibility issues in npm packages */
export const a11yPackageIssues = pgTable(
  'a11y_package_issues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    anId: varchar('an_id', { length: 32 }).notNull(),
    packageName: varchar('package_name', { length: 255 }).notNull(),
    title: text('title').notNull(),
    issueType: varchar('issue_type', { length: 64 }).notNull(),
    severity: varchar('severity', { length: 16 }).notNull(),
    atAffected: text('at_affected').array(),
    description: text('description').notNull(),
    fixStatus: varchar('fix_status', { length: 32 }).notNull().default('open'),
    workaround: text('workaround'),
    ...timestamps,
  },
  (table) => ({
    anIdUnique: uniqueIndex('a11y_package_issues_an_id_uidx').on(table.anId),
    packageIdx: index('a11y_package_issues_package_idx').on(table.packageName),
  }),
);

/** Semver ranges affected by a package issue */
export const a11yPackageVersions = pgTable(
  'a11y_package_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    issueId: uuid('issue_id')
      .notNull()
      .references(() => a11yPackageIssues.id, { onDelete: 'cascade' }),
    versionRange: varchar('version_range', { length: 128 }).notNull(),
    fixedInVersion: varchar('fixed_in_version', { length: 64 }),
    ...timestamps,
  },
  (table) => ({
    issueIdx: index('a11y_package_versions_issue_idx').on(table.issueId),
  }),
);

/** Community submissions awaiting curator review */
export const a11yIssueReports = pgTable(
  'a11y_issue_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    packageName: varchar('package_name', { length: 255 }).notNull(),
    version: varchar('version', { length: 64 }),
    description: text('description').notNull(),
    reporterEmail: varchar('reporter_email', { length: 255 }),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    ...timestamps,
  },
  (table) => ({
    statusIdx: index('a11y_issue_reports_status_idx').on(table.status),
  }),
);

export const a11yPackageIssuesRelations = relations(a11yPackageIssues, ({ many }) => ({
  versions: many(a11yPackageVersions),
}));

export const a11yPackageVersionsRelations = relations(a11yPackageVersions, ({ one }) => ({
  issue: one(a11yPackageIssues, {
    fields: [a11yPackageVersions.issueId],
    references: [a11yPackageIssues.id],
  }),
}));

// ─── AN Learn (AN-F006 Phase 2 bootstrap) ────────────────────────────────────

/** Curated accessibility lessons (public catalog; org progress is separate) */
export const learnLessons = pgTable(
  'learn_lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 128 }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    summary: text('summary').notNull(),
    bodyMarkdown: text('body_markdown').notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(10),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(true),
    ...timestamps,
  },
  (table) => ({
    slugUnique: uniqueIndex('learn_lessons_slug_uidx').on(table.slug),
  }),
);

/** Per-user lesson progress (org-scoped for multi-tenant reporting) */
export const learnProgress = pgTable(
  'learn_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => learnLessons.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 32 }).notNull().default('started'),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('learn_progress_org_idx').on(table.organisationId),
    userLessonUnique: uniqueIndex('learn_progress_user_lesson_uidx').on(
      table.userId,
      table.lessonId,
    ),
  }),
);

export const learnLessonsRelations = relations(learnLessons, ({ many }) => ({
  progress: many(learnProgress),
}));

export const learnProgressRelations = relations(learnProgress, ({ one }) => ({
  organisation: one(organisations, {
    fields: [learnProgress.organisationId],
    references: [organisations.id],
  }),
  user: one(users, { fields: [learnProgress.userId], references: [users.id] }),
  lesson: one(learnLessons, {
    fields: [learnProgress.lessonId],
    references: [learnLessons.id],
  }),
}));

// ─── AN Dynamic journeys (AN-F003) ───────────────────────────────────────────

/** Authenticated multi-step journey definition (JSON DSL, YAML-compatible) */
export const journeys = pgTable(
  'journeys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull(),
    description: text('description'),
    /** Zod-validated journey document: { startUrl, steps[] } */
    definitionJson: jsonb('definition_json').notNull().$type<Record<string, unknown>>(),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
  },
  (table) => ({
    orgIdx: index('journeys_org_idx').on(table.organisationId),
    orgSlugUnique: uniqueIndex('journeys_org_slug_uidx').on(table.organisationId, table.slug),
  }),
);

/** Encrypted credential bag for a journey (AES-256-GCM) */
export const journeyCredentials = pgTable(
  'journey_credentials',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    journeyId: uuid('journey_id')
      .notNull()
      .references(() => journeys.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 128 }).notNull().default('default'),
    ciphertext: text('ciphertext').notNull(),
    iv: varchar('iv', { length: 64 }).notNull(),
    authTag: varchar('auth_tag', { length: 64 }).notNull(),
    ...timestamps,
  },
  (table) => ({
    journeyIdx: index('journey_credentials_journey_idx').on(table.journeyId),
  }),
);

export const journeyScans = pgTable(
  'journey_scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    journeyId: uuid('journey_id')
      .notNull()
      .references(() => journeys.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 32 }).notNull().default('queued'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'string' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    errorMessage: text('error_message'),
    /** Aggregated failure map: steps that failed or had critical/serious issues */
    failureMapJson: jsonb('failure_map_json').$type<Record<string, unknown>>(),
    totalViolations: integer('total_violations').notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    orgIdx: index('journey_scans_org_idx').on(table.organisationId),
    journeyIdx: index('journey_scans_journey_idx').on(table.journeyId),
  }),
);

export const journeyStepResults = pgTable(
  'journey_step_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organisationId: orgId(),
    journeyScanId: uuid('journey_scan_id')
      .notNull()
      .references(() => journeyScans.id, { onDelete: 'cascade' }),
    stepId: varchar('step_id', { length: 128 }).notNull(),
    stepIndex: integer('step_index').notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull(),
    pageUrl: text('page_url'),
    violationCount: integer('violation_count').notNull().default(0),
    violationsJson: jsonb('violations_json').$type<unknown[]>().default([]),
    errorMessage: text('error_message'),
    durationMs: integer('duration_ms'),
    ...timestamps,
  },
  (table) => ({
    scanIdx: index('journey_step_results_scan_idx').on(table.journeyScanId),
  }),
);

export const journeysRelations = relations(journeys, ({ many }) => ({
  credentials: many(journeyCredentials),
  scans: many(journeyScans),
}));

export const journeyCredentialsRelations = relations(journeyCredentials, ({ one }) => ({
  journey: one(journeys, {
    fields: [journeyCredentials.journeyId],
    references: [journeys.id],
  }),
}));

export const journeyScansRelations = relations(journeyScans, ({ one, many }) => ({
  journey: one(journeys, {
    fields: [journeyScans.journeyId],
    references: [journeys.id],
  }),
  stepResults: many(journeyStepResults),
}));

export const journeyStepResultsRelations = relations(journeyStepResults, ({ one }) => ({
  scan: one(journeyScans, {
    fields: [journeyStepResults.journeyScanId],
    references: [journeyScans.id],
  }),
}));

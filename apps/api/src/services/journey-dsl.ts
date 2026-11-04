/**
 * AN Dynamic journey DSL (AN-F003) — JSON shape (YAML-compatible keys).
 */

import { z } from 'zod';

export const journeyStepSchema = z.discriminatedUnion('action', [
  z.object({
    id: z.string().min(1).max(128),
    action: z.literal('navigate'),
    url: z.string().url().max(2000),
  }),
  z.object({
    id: z.string().min(1).max(128),
    action: z.literal('click'),
    selector: z.string().min(1).max(500),
  }),
  z.object({
    id: z.string().min(1).max(128),
    action: z.literal('fill'),
    selector: z.string().min(1).max(500),
    value: z.string().max(2000),
  }),
  z.object({
    id: z.string().min(1).max(128),
    action: z.literal('press'),
    key: z.string().min(1).max(64),
  }),
  z.object({
    id: z.string().min(1).max(128),
    action: z.literal('wait'),
    selector: z.string().min(1).max(500).optional(),
    urlIncludes: z.string().min(1).max(500).optional(),
    timeoutMs: z.number().int().min(100).max(120_000).optional(),
  }),
  z.object({
    id: z.string().min(1).max(128),
    action: z.literal('axe'),
    label: z.string().max(200).optional(),
  }),
]);

export const journeyDefinitionSchema = z.object({
  startUrl: z.string().url().max(2000),
  steps: z.array(journeyStepSchema).min(1).max(100),
});

export type JourneyStep = z.infer<typeof journeyStepSchema>;
export type JourneyDefinition = z.infer<typeof journeyDefinitionSchema>;

/** Replace {{creds.key}} placeholders from decrypted credential bag. */
export function interpolateCreds(value: string, creds: Record<string, string>): string {
  return value.replace(/\{\{\s*creds\.([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) => {
    return creds[key] ?? '';
  });
}

export function slugifyJourneyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

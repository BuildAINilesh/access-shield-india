/**
 * AN OSS routes — package.json dependency a11y scan (AN-F002).
 * Mounted publicly at /api/v1/oss (before auth) so the CLI works without a JWT.
 */

import type { Database } from '@accessshield/db';
import type { ApiResponse } from '@accessshield/types';
import type { NextFunction, Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import type { Redis } from 'ioredis';
import { z } from 'zod';
import { sendProblem } from '../lib/problem-details';
import { scanDependencies, type OssScanResult } from '../services/oss-scan';

const depMapSchema = z.record(z.string().min(1).max(255), z.string().min(1).max(128));

const scanSchema = z.object({
  dependencies: depMapSchema.default({}),
  devDependencies: depMapSchema.optional(),
});

const MAX_OSS_SCANS_PER_IP_PER_HOUR = 60;

async function checkOssRateLimit(redis: Redis | null, ip: string): Promise<boolean> {
  if (!redis) return true;
  const key = `oss-scan:ip:${ip}`;
  const count = parseInt((await redis.get(key)) || '0', 10);
  return count < MAX_OSS_SCANS_PER_IP_PER_HOUR;
}

async function bumpOssRateLimit(redis: Redis | null, ip: string): Promise<void> {
  if (!redis) return;
  const key = `oss-scan:ip:${ip}`;
  const count = parseInt((await redis.get(key)) || '0', 10);
  await redis.setex(key, 3600, String(count + 1));
}

export function createOssRouter(db: Database, redis?: Redis): ExpressRouter {
  const router = Router();

  // PUBLIC — POST /api/v1/oss/scan
  router.post('/scan', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'unknown';

      if (!(await checkOssRateLimit(redis ?? null, ip))) {
        res.setHeader('Retry-After', '3600');
        sendProblem(
          res,
          429,
          'rate-limited',
          'Too many OSS scans from this network. Try again later.',
        );
        return;
      }

      const parsed = scanSchema.safeParse(req.body);
      if (!parsed.success) {
        sendProblem(res, 400, 'validation-error', 'Invalid OSS scan payload', undefined, {
          errors: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const depCount =
        Object.keys(parsed.data.dependencies).length +
        Object.keys(parsed.data.devDependencies ?? {}).length;
      if (depCount === 0) {
        sendProblem(res, 400, 'validation-error', 'Provide at least one dependency');
        return;
      }
      if (depCount > 2000) {
        sendProblem(res, 400, 'validation-error', 'Too many dependencies (max 2000)');
        return;
      }

      const result = await scanDependencies(
        db,
        parsed.data.dependencies,
        parsed.data.devDependencies,
      );

      await bumpOssRateLimit(redis ?? null, ip);

      const response: ApiResponse<OssScanResult> = {
        data: result,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  return router;
}

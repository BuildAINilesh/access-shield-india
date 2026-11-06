/**
 * Public marketing chatbot — unauthenticated, IP-rate-limited.
 */

import type { ApiResponse } from '@accessshield/types';
import type { Request, Response, Router as ExpressRouter } from 'express';
import { Router } from 'express';
import type { Redis } from 'ioredis';
import { z } from 'zod';
import { requestMarketingChat, type MarketingChatResponse } from '../lib/ai-client';
import { logger } from '../lib/logger';
import { fallbackMarketingChat, sanitizeNavigatePath } from '../lib/marketing-chat-knowledge';
import { sendProblem } from '../lib/problem-details';

const MAX_MESSAGES_PER_IP_PER_HOUR = 40;
const MARKETING_CHAT_TIMEOUT_MS = 12_000;

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(1200),
});

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(800, 'Message is too long'),
  locale: z.enum(['en', 'hi']).default('en'),
  history: z.array(historyItemSchema).max(12).optional(),
});

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || req.ip || 'unknown';
  }
  return req.ip || 'unknown';
}

export function createPublicChatRouter(redis: Redis): ExpressRouter {
  const router = Router();

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const parseResult = chatSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendProblem(res, 400, 'validation-error', 'Invalid request body', undefined, {
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { message, locale, history } = parseResult.data;
    const ip = clientIp(req);
    const rateKey = `public-chat:ip:${ip}`;

    try {
      const currentCount = parseInt((await redis.get(rateKey)) || '0', 10);
      if (currentCount >= MAX_MESSAGES_PER_IP_PER_HOUR) {
        sendProblem(
          res,
          429,
          'rate-limit-exceeded',
          'Too many chat messages. Please try again in a little while.',
        );
        return;
      }
      await redis.setex(rateKey, 3600, String(currentCount + 1));
    } catch (err) {
      logger.warn({ err }, 'Marketing chat rate-limit store failed; continuing');
    }

    const fallback = fallbackMarketingChat(message, locale);
    let payload: MarketingChatResponse = {
      reply: fallback.reply,
      navigate: fallback.navigate,
      suggestions: fallback.suggestions,
    };
    let source: 'ai' | 'fallback' = 'fallback';

    if (fallback.confident) {
      payload = { ...payload, navigate: sanitizeNavigatePath(payload.navigate) };
      logger.info({ locale, source, navigate: payload.navigate ?? null }, 'Marketing chat reply');
      const response: ApiResponse<MarketingChatResponse> = {
        data: payload,
        timestamp: new Date().toISOString(),
      };
      res.status(200).json(response);
      return;
    }

    try {
      const aiResult = await requestMarketingChat(
        {
          message,
          locale,
          history: history?.map((item) => ({ role: item.role, content: item.content })),
        },
        MARKETING_CHAT_TIMEOUT_MS,
      );
      if (aiResult.reply.trim().length > 0) {
        payload = {
          reply: aiResult.reply.trim(),
          navigate: sanitizeNavigatePath(aiResult.navigate),
          suggestions: (aiResult.suggestions ?? []).slice(0, 4),
        };
        source = 'ai';
      }
    } catch (err) {
      logger.warn({ err }, 'Marketing chat AI unavailable; using knowledge fallback');
    }

    if (payload.suggestions.length === 0) {
      payload = { ...payload, suggestions: fallback.suggestions };
    }
    payload = { ...payload, navigate: sanitizeNavigatePath(payload.navigate) };

    logger.info({ locale, source, navigate: payload.navigate ?? null }, 'Marketing chat reply');

    const response: ApiResponse<MarketingChatResponse> = {
      data: payload,
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  });

  return router;
}

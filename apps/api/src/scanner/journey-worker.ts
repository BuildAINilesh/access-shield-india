/**
 * RabbitMQ consumer for journey_scans queue (AN-F003).
 */

import type { Database } from '@accessshield/db';
import amqp from 'amqplib';
import type { ConsumeMessage } from 'amqplib';
import { logger } from '../lib/logger';
import { executeJourneyScan } from './journey-runner';
import { JOURNEY_SCANS_QUEUE, type JourneyScanJobMessage } from './journey-queue';

let channel: Awaited<ReturnType<Awaited<ReturnType<typeof amqp.connect>>['createChannel']>> | null =
  null;
let connection: Awaited<ReturnType<typeof amqp.connect>> | null = null;

export async function startJourneyWorker(db: Database): Promise<void> {
  const rabbitUrl = process.env.RABBITMQ_URL;
  if (!rabbitUrl) {
    logger.warn('RABBITMQ_URL not set — journey worker not started');
    return;
  }

  connection = await amqp.connect(rabbitUrl);
  channel = await connection.createChannel();
  await channel.assertQueue(JOURNEY_SCANS_QUEUE, { durable: true });
  await channel.prefetch(1);

  logger.info({ queue: JOURNEY_SCANS_QUEUE }, 'Journey scan worker listening');

  await channel.consume(JOURNEY_SCANS_QUEUE, (msg: ConsumeMessage | null) => {
    if (!msg || !channel) return;
    void (async () => {
      try {
        const job = JSON.parse(msg.content.toString()) as JourneyScanJobMessage;
        logger.info({ journeyScanId: job.journeyScanId }, 'Journey scan job received');
        await executeJourneyScan(db, job.journeyScanId, job.orgId);
        channel.ack(msg);
      } catch (err) {
        logger.error({ err }, 'Journey scan job failed');
        channel.nack(msg, false, false);
      }
    })();
  });
}

export async function shutdownJourneyWorker(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}

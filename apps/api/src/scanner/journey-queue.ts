/**
 * RabbitMQ publisher for AN Dynamic journey scans (AN-F003).
 */

import amqp from 'amqplib';
import { logger } from '../lib/logger';

export const JOURNEY_SCANS_QUEUE = 'journey_scans';

export interface JourneyScanJobMessage {
  journeyScanId: string;
  journeyId: string;
  orgId: string;
}

let rabbitConnection: Awaited<ReturnType<typeof amqp.connect>> | null = null;
let rabbitChannel: Awaited<
  ReturnType<Awaited<ReturnType<typeof amqp.connect>>['createChannel']>
> | null = null;

async function ensureChannel() {
  if (rabbitChannel) return rabbitChannel;
  const rabbitUrl = process.env.RABBITMQ_URL;
  if (!rabbitUrl) throw new Error('RABBITMQ_URL environment variable not set');

  const conn = await amqp.connect(rabbitUrl);
  rabbitConnection = conn;
  const channel = await conn.createChannel();
  rabbitChannel = channel;
  await channel.assertQueue(JOURNEY_SCANS_QUEUE, { durable: true });

  conn.on('close', () => {
    rabbitConnection = null;
    rabbitChannel = null;
  });

  return channel;
}

export async function publishJourneyScanJob(message: JourneyScanJobMessage): Promise<void> {
  const channel = await ensureChannel();
  channel.sendToQueue(JOURNEY_SCANS_QUEUE, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
  logger.info(
    { journeyScanId: message.journeyScanId, journeyId: message.journeyId },
    'Journey scan job published',
  );
}

export async function closeJourneyQueue(): Promise<void> {
  if (rabbitChannel) {
    await rabbitChannel.close();
    rabbitChannel = null;
  }
  if (rabbitConnection) {
    await rabbitConnection.close();
    rabbitConnection = null;
  }
}

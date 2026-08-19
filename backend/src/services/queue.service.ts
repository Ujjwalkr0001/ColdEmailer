import { supabaseAdmin } from '../config/supabase';
import { getRandomDelaySeconds } from '../utils/randomDelay';
import { validateEmailList } from './validation.service';

interface QueueResult {
  queued: string[];
  invalid: string[];
  duplicates: string[];
  total: number;
}

export async function addEmailsToQueue(
  rawEmails: string | string[],
  subject: string,
  body: string
): Promise<QueueResult> {
  // 1. Validate emails
  const { valid, invalid, duplicates, total } = await validateEmailList(rawEmails);

  if (valid.length === 0) {
    return { queued: [], invalid, duplicates, total };
  }

  // 2. Schedule each email in sequential 5-minute slots
  const now = new Date();
  const queueEntries = valid.map((email, index) => {
    // Each slot is 5 minutes apart
    const slotOffsetMinutes = index * 5;
    const slotStart = new Date(now.getTime() + slotOffsetMinutes * 60 * 1000);
    // Random offset within the slot (0–300 seconds)
    const randomOffsetSeconds = getRandomDelaySeconds(0, 300);
    const scheduledAt = new Date(slotStart.getTime() + randomOffsetSeconds * 1000);

    return {
      recipient: email,
      subject,
      body,
      scheduled_at: scheduledAt.toISOString(),
      status: 'QUEUED',
      attempts: 0,
    };
  });

  // 3. Insert into Supabase
  const { error } = await supabaseAdmin
    .from('email_queue')
    .insert(queueEntries);

  if (error) {
    console.error('Error inserting queue:', error);
    throw new Error('Failed to add emails to queue');
  }

  return {
    queued: valid,
    invalid,
    duplicates,
    total,
  };
}
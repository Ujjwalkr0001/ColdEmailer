import { supabaseAdmin } from '../config/supabase';
import { getRandomDelaySeconds } from '../utils/randomDelay';
import { validateEmailList } from './validation.service';
import { sendEmail } from './gmail.service';
import { canSendEmail } from './rateLimiter.service';

const MAX_RETRIES = 3;

interface QueueResult {
  queued: string[];
  invalid: string[];
  duplicates: string[];
  total: number;
}

/**
 * Add emails to the queue.
 * Each email is scheduled in a sequential 5-minute slot
 * with a random delay inside that slot.
 */
export async function addEmailsToQueue(
  rawEmails: string | string[],
  subject: string,
  body: string
): Promise<QueueResult> {
  // 1. Validate emails
  const { valid, invalid, duplicates, total } =
    await validateEmailList(rawEmails);

  if (valid.length === 0) {
    return {
      queued: [],
      invalid,
      duplicates,
      total,
    };
  }

  // 2. Schedule each email
  const now = new Date();

  const queueEntries = valid.map((email, index) => {
    // Each email gets its own 5-minute slot
    const slotOffsetMinutes = index * 5;

    const slotStart = new Date(
      now.getTime() + slotOffsetMinutes * 60 * 1000
    );

    // Random delay between 0 and 300 seconds
    const randomOffsetSeconds = getRandomDelaySeconds(0, 300);

    const scheduledAt = new Date(
      slotStart.getTime() + randomOffsetSeconds * 1000
    );

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

/**
 * Fetch one due email, lock it (QUEUED -> PROCESSING),
 * send it, then move it to sent/failed.
 */
export async function processNextDueEmail(): Promise<{
  processed: boolean;
  emailId?: string;
  error?: string;
}> {
  // 1. Check rate limits
  const rateCheck = await canSendEmail();

  if (!rateCheck.allowed) {
    return {
      processed: false,
      error: rateCheck.reason,
    };
  }

  // 2. Find the earliest due email
  const now = new Date().toISOString();

  const { data: dueEmails, error: findError } = await supabaseAdmin
    .from('email_queue')
    .select('*')
    .eq('status', 'QUEUED')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(1);

  if (findError) {
    throw findError;
  }

  if (!dueEmails || dueEmails.length === 0) {
    return {
      processed: false,
    };
  }

  const email = dueEmails[0];

  // 3. Lock the email
  //
  // Only update if the status is still QUEUED.
  // This prevents processing an email that has already
  // been picked by another worker.
  const { data: lockedEmail, error: lockError } =
    await supabaseAdmin
      .from('email_queue')
      .update({
        status: 'PROCESSING',
      })
      .eq('id', email.id)
      .eq('status', 'QUEUED')
      .select()
      .single();

  if (lockError) {
    // Another worker may have already taken this email.
    if (lockError.code === 'PGRST116') {
      return {
        processed: false,
      };
    }

    throw lockError;
  }

  if (!lockedEmail) {
    return {
      processed: false,
    };
  }

  // 4. Send the email
  try {
    const gmailMessageId = await sendEmail(
      email.recipient,
      email.subject,
      email.body
    );

    // 5. Save successfully sent email
    const { error: sentError } = await supabaseAdmin
      .from('sent_emails')
      .insert({
        recipient: email.recipient,
        subject: email.subject,
        sent_at: new Date().toISOString(),
        gmail_message_id: gmailMessageId,
      });

    if (sentError) {
      throw sentError;
    }

    // 6. Remove email from queue
    const { error: deleteError } = await supabaseAdmin
      .from('email_queue')
      .delete()
      .eq('id', email.id);

    if (deleteError) {
      throw deleteError;
    }

    return {
      processed: true,
      emailId: email.id,
    };
  } catch (error: any) {
    // 7. Email sending failed
    const newAttempts = (email.attempts || 0) + 1;

    const errorMessage =
      error?.message || 'Unknown error';

    // 8. Maximum retries reached
    if (newAttempts >= MAX_RETRIES) {
      // Move to failed_emails
      const { error: failedInsertError } =
        await supabaseAdmin
          .from('failed_emails')
          .insert({
            recipient: email.recipient,
            subject: email.subject,
            body: email.body,
            error: errorMessage,
            attempts: newAttempts,
            failed_at: new Date().toISOString(),
          });

      if (failedInsertError) {
        console.error(
          'Error inserting failed email:',
          failedInsertError
        );
      }

      // Remove from queue
      const { error: deleteError } =
        await supabaseAdmin
          .from('email_queue')
          .delete()
          .eq('id', email.id);

      if (deleteError) {
        console.error(
          'Error deleting failed email:',
          deleteError
        );
      }
    } else {
      // 9. Retry later with exponential backoff
      //
      // Attempt 1 -> 1 minute
      // Attempt 2 -> 2 minutes
      // Attempt 3 -> 4 minutes
      const retryDelayMinutes =
        Math.pow(2, newAttempts - 1);

      const scheduledAt = new Date(
        Date.now() +
          retryDelayMinutes * 60 * 1000
      ).toISOString();

      const { error: retryError } =
        await supabaseAdmin
          .from('email_queue')
          .update({
            attempts: newAttempts,
            status: 'QUEUED',
            scheduled_at: scheduledAt,
          })
          .eq('id', email.id);

      if (retryError) {
        console.error(
          'Error scheduling email retry:',
          retryError
        );
      }
    }

    return {
      processed: false,
      emailId: email.id,
      error: errorMessage,
    };
  }
}
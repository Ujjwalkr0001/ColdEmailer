import { supabaseAdmin } from '../config/supabase';

const DAILY_LIMIT = 150;
const HOURLY_LIMIT = 12; // because 12 emails/hour

export async function canSendEmail(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const now = new Date();

  // Get today's start (midnight)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Get this hour's start
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  // Count sent today
  const { count: sentToday, error: err1 } = await supabaseAdmin
    .from('sent_emails')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', todayStart.toISOString());

  if (err1) throw err1;

  if (sentToday >= DAILY_LIMIT) {
    return { allowed: false, reason: `Daily limit of ${DAILY_LIMIT} reached` };
  }

  // Count sent this hour
  const { count: sentThisHour, error: err2 } = await supabaseAdmin
    .from('sent_emails')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', hourStart.toISOString());

  if (err2) throw err2;

  if (sentThisHour >= HOURLY_LIMIT) {
    return { allowed: false, reason: `Hourly limit of ${HOURLY_LIMIT} reached` };
  }

  return { allowed: true };
}
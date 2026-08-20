import { supabaseAdmin } from '../config/supabase';

interface DashboardStats {
  totalSent: number;
  sentToday: number;
  scheduledToday: number;
  inQueue: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  
  // Get today's start (midnight) in ISO format
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartISO = todayStart.toISOString();

  // 1. Total Sent (all-time)
  const { count: totalSent, error: err1 } = await supabaseAdmin
    .from('sent_emails')
    .select('*', { count: 'exact', head: true });

  if (err1) throw err1;

  // 2. Sent Today
  const { count: sentToday, error: err2 } = await supabaseAdmin
    .from('sent_emails')
    .select('*', { count: 'exact', head: true })
    .gte('sent_at', todayStartISO);

  if (err2) throw err2;

  // 3. Scheduled Today (emails in queue scheduled for today, regardless of status)
  const { count: scheduledToday, error: err3 } = await supabaseAdmin
    .from('email_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'QUEUED')
    .gte('scheduled_at', todayStartISO);

  if (err3) throw err3;

  // 4. In Queue (all queued emails, including those scheduled for future days)
  const { count: inQueue, error: err4 } = await supabaseAdmin
    .from('email_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'QUEUED');

  if (err4) throw err4;

  return {
    totalSent: totalSent || 0,
    sentToday: sentToday || 0,
    scheduledToday: scheduledToday || 0,
    inQueue: inQueue || 0,
  };
}
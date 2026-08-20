import { supabaseAdmin } from '../config/supabase';

interface Template {
  id: number;
  subject: string;
  body: string;
  updated_at: string;
}

export async function getTemplate(): Promise<Template> {
  const { data, error } = await supabaseAdmin
    .from('email_template')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) throw error;
  return data;
}

export async function updateTemplate(subject: string, body: string): Promise<Template> {
  const { data, error } = await supabaseAdmin
    .from('email_template')
    .update({ subject, body, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();

  if (error) throw error;
  return data;
}
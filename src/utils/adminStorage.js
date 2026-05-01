import { supabase } from '../lib/supabase';

export async function hasAdmin() {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'admin_created')
    .single();
  return !!data;
}

export async function saveAdmin(email, password) {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  await supabase
    .from('app_config')
    .upsert({ key: 'admin_created', value: 'true' });
}

export async function verifyAdmin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

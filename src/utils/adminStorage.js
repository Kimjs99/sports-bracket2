import { supabase } from '../lib/supabase';

export async function hasAdmin() {
  const { data, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'admin_created')
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function saveAdmin(email, password) {
  const { error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) throw signUpError;
  const { error: configError } = await supabase
    .from('app_config')
    .upsert({ key: 'admin_created', value: 'true' });
  if (configError) throw configError;
}

export async function verifyAdmin(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

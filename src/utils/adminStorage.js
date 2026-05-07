import { supabase } from '../lib/supabase';

// Single admin account — uses a fixed synthetic email internally.
// Username is a display label stored in Supabase user_metadata.
const ADMIN_EMAIL = 'admin@school-bracket.app';
const ADMIN_CREATED_KEY = 'tournament_admin_created_v1'; // value = username string

export function hasAdmin() {
  return !!localStorage.getItem(ADMIN_CREATED_KEY);
}

export async function saveAdmin(username, password) {
  const { data, error } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password,
    options: { data: { username } },
  });
  if (error) throw error;
  // session is null when account already exists (email confirm disabled + duplicate)
  if (!data.session) throw new Error('ALREADY_EXISTS');
  localStorage.setItem(ADMIN_CREATED_KEY, username);
}

export async function verifyAdmin(password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  });
  if (error || !data.session) return false;
  const uname = data.user?.user_metadata?.username
    ?? localStorage.getItem(ADMIN_CREATED_KEY)
    ?? 'admin';
  localStorage.setItem(ADMIN_CREATED_KEY, uname);
  return true;
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
  // keep ADMIN_CREATED_KEY so hasAdmin() stays true on same device
}

export function subscribeAuth(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
    callback(session);
  });
  return subscription;
}

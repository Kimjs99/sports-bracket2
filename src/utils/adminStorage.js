import { supabase } from '../lib/supabase';

// Org-scoped synthetic email — keeps auth simple without exposing real emails
const orgEmail = slug => `admin+${slug}@school-bracket.app`;

// ── Organizations ──────────────────────────────────────────────────────────────

export async function loadOrganizations() {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug, created_at')
      .order('name');
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

export async function registerOrg(name, slug, password) {
  const email = orgEmail(slug);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { org_name: name, org_slug: slug } },
  });
  if (error) {
    if (error.message?.toLowerCase().includes('already registered')) throw new Error('ALREADY_EXISTS');
    throw error;
  }
  if (!data.session) throw new Error('ALREADY_EXISTS');

  const { error: orgErr } = await supabase.from('organizations').insert({
    name,
    slug,
    user_id: data.user.id,
  });
  if (orgErr) throw orgErr;

  return { user: data.user, org: { id: null, name, slug } };
}

export async function loginOrg(slug, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: orgEmail(slug),
    password,
  });
  if (error || !data.session) return null;

  // Fetch org record to get id and canonical name
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('user_id', data.user.id)
    .single();

  return {
    user: data.user,
    org: org ?? { id: null, name: data.user.user_metadata?.org_name ?? slug, slug },
  };
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

export function subscribeAuth(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
    callback(session);
  });
  return subscription;
}

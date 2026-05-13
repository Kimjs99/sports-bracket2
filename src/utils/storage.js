import { supabase } from '../lib/supabase';

// ── localStorage (primary — always works) ─────────────────────────────────────

const IDS_KEY = 'tournament_ids_v2';
const dataKey = id => `tournament_data_${id}`;

function lsGetIds() {
  try { return JSON.parse(localStorage.getItem(IDS_KEY)) ?? []; }
  catch { return []; }
}
function lsSetIds(ids) { localStorage.setItem(IDS_KEY, JSON.stringify(ids)); }

function lsSave(data) {
  const id = data.meta.id;
  const ids = lsGetIds();
  if (!ids.includes(id)) lsSetIds([id, ...ids]);
  localStorage.setItem(dataKey(id), JSON.stringify(data));
}

function lsLoad(id) {
  try { return JSON.parse(localStorage.getItem(dataKey(id))); }
  catch { return null; }
}

function lsLoadAll() {
  return lsGetIds().map(id => lsLoad(id)).filter(Boolean);
}

function lsDelete(id) {
  lsSetIds(lsGetIds().filter(i => i !== id));
  localStorage.removeItem(dataKey(id));
}

function lsClear() {
  lsGetIds().forEach(id => localStorage.removeItem(dataKey(id)));
  lsSetIds([]);
}

// Wipe localStorage tournament cache (call on logout or org switch)
export function clearLocalCache() {
  lsClear();
}

// ── Supabase (secondary — best-effort cross-device sync) ──────────────────────

async function sbSave(data) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('tournaments').upsert({
      id: data.meta.id,
      school_level: data.meta.schoolLevel,
      org_id: data.meta.orgId ?? null,
      user_id: session.user.id,
      data,
      created_at: data.meta.createdAt,
    });
  } catch { /* localStorage is authoritative */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveTournament(data) {
  lsSave(data);
  sbSave(data);
}

export async function loadTournament(id) {
  try {
    const { data, error } = await supabase
      .from('tournaments').select('data').eq('id', id).single();
    if (!error && data?.data) {
      lsSave(data.data);
      return data.data;
    }
  } catch { /* fallback */ }
  return lsLoad(id);
}

export async function loadAllTournaments() {
  // Supabase RLS returns only current user's tournaments
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase
        .from('tournaments').select('data').order('created_at', { ascending: false });
      if (!error) {
        // Authenticated: always trust Supabase result (even empty array).
        // Do NOT fall back to localStorage — it may contain stale data from a
        // previous org session and RLS already guarantees correct isolation.
        const list = (data ?? []).map(row => row.data).filter(Boolean);
        lsClear();                          // sync: purge any stale local cache
        list.forEach(t => lsSave(t));       // repopulate with fresh org data
        return list;
      }
      // Supabase error (network etc.) → use localStorage as emergency fallback
      return lsLoadAll();
    }
  } catch { /* Supabase unavailable */ }
  // Not authenticated → fully private, return nothing
  return [];
}

export async function deleteTournament(id) {
  lsDelete(id);
  try { await supabase.from('tournaments').delete().eq('id', id); } catch { /* ignore */ }
}

// ── Guest (public) access ─────────────────────────────────────────────────────

export async function loadPublicOrgInfo(orgSlug) {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single();
  if (error) throw error;
  return data;
}

export async function loadPublicOrgTournaments(orgSlug) {
  const { data, error } = await supabase.rpc('get_org_tournaments', { org_slug: orgSlug });
  if (error) throw error;
  return (data ?? []).map(row => row.data).filter(Boolean);
}

export async function clearAllTournaments() {
  lsClear();
  try {
    await supabase.from('tournaments').delete().not('id', 'is', null);
  } catch { /* ignore */ }
}

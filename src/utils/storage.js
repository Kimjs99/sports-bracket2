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

// ── Supabase (secondary — best-effort cross-device sync) ──────────────────────

async function sbSave(data) {
  try {
    await supabase.from('tournaments').upsert({
      id: data.meta.id,
      school_level: data.meta.schoolLevel,
      data,
      created_at: data.meta.createdAt,
    });
  } catch { /* ignore — localStorage is authoritative */ }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function saveTournament(data) {
  lsSave(data);     // always save locally first
  sbSave(data);     // best-effort remote sync (fire-and-forget)
}

export async function loadTournament(id) {
  // Try Supabase for freshest cross-device data
  try {
    const { data, error } = await supabase
      .from('tournaments').select('data').eq('id', id).single();
    if (!error && data?.data) {
      lsSave(data.data); // keep localStorage in sync
      return data.data;
    }
  } catch { /* fallback */ }
  return lsLoad(id);
}

export async function loadAllTournaments() {
  // Try Supabase first (cross-device data)
  try {
    const { data, error } = await supabase
      .from('tournaments').select('data').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) {
      data.forEach(row => row.data && lsSave(row.data)); // sync to localStorage
      return data.map(row => row.data).filter(Boolean);
    }
  } catch { /* fallback */ }
  return lsLoadAll();
}

export async function deleteTournament(id) {
  lsDelete(id);
  try { await supabase.from('tournaments').delete().eq('id', id); } catch { /* ignore */ }
}

export async function clearAllTournaments() {
  lsClear();
  try {
    await supabase.from('tournaments').delete().not('id', 'is', null);
  } catch { /* ignore */ }
}

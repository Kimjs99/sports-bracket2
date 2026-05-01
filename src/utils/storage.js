import { supabase } from '../lib/supabase';

export async function saveTournament(data) {
  const { error } = await supabase.from('tournaments').upsert({
    id: data.meta.id,
    school_level: data.meta.schoolLevel,
    data: data,
    created_at: data.meta.createdAt,
  });
  if (error) console.error('saveTournament error:', error);
}

export async function loadTournament(id) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('data')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data.data;
}

export async function loadAllTournaments() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('data')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(row => row.data);
}

export async function deleteTournament(id) {
  const { error } = await supabase.from('tournaments').delete().eq('id', id);
  if (error) throw error;
}

export async function clearAllTournaments() {
  const { error } = await supabase.from('tournaments').delete().not('id', 'is', null);
  if (error) throw error;
}

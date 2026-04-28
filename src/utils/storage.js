import { STORAGE_KEY } from '../constants';

const IDS_KEY = 'tournament_ids_v2';
const DATA_PREFIX = 'tournament_data_';

function getIds() {
  try { return JSON.parse(localStorage.getItem(IDS_KEY) ?? '[]'); }
  catch { return []; }
}

function setIds(ids) {
  try { localStorage.setItem(IDS_KEY, JSON.stringify(ids)); }
  catch (e) { if (e.name !== 'QuotaExceededError' && e.name !== 'SecurityError') throw e; }
}

export function saveTournament(data) {
  try {
    const key = DATA_PREFIX + data.meta.id;
    localStorage.setItem(key, JSON.stringify(data));
    const ids = getIds();
    if (!ids.includes(data.meta.id)) setIds([...ids, data.meta.id]);
  } catch (e) {
    if (e.name === 'QuotaExceededError') console.error('저장 공간 부족:', e);
    else if (e.name === 'SecurityError') console.warn('프라이빗 모드에서는 저장이 제한됩니다.');
    else console.error('저장 실패:', e);
  }
}

export function loadTournament(id) {
  try {
    const raw = localStorage.getItem(DATA_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function deleteTournament(id) {
  try {
    localStorage.removeItem(DATA_PREFIX + id);
    setIds(getIds().filter(i => i !== id));
  } catch {}
}

export function loadAllTournaments() {
  return getIds()
    .map(id => loadTournament(id))
    .filter(Boolean)
    .sort((a, b) => b.meta.createdAt.localeCompare(a.meta.createdAt));
}

export function clearAllTournaments() {
  try {
    getIds().forEach(id => localStorage.removeItem(DATA_PREFIX + id));
    localStorage.removeItem(IDS_KEY);
  } catch {}
}

// Migrate from old single-tournament format (runs once, then removes old key)
export function migrateFromLegacy() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.meta?.id) {
      saveTournament(data);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

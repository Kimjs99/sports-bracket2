const KEY = 'tournament_admin_v1';

export function getAdmin() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function hasAdmin() {
  return !!getAdmin();
}

export function saveAdmin(username, password) {
  localStorage.setItem(KEY, JSON.stringify({ username, password }));
}

export function verifyAdmin(username, password) {
  const a = getAdmin();
  return !!(a && a.username === username && a.password === password);
}

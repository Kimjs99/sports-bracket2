const CRED_KEY = 'tournament_admin_v1';
const SESSION_KEY = 'tournament_admin_session_v1';

export function hasAdmin() {
  try { return !!JSON.parse(localStorage.getItem(CRED_KEY)); }
  catch { return false; }
}

export function saveAdmin(username, password) {
  localStorage.setItem(CRED_KEY, JSON.stringify({ username, password }));
}

export function verifyAdmin(username, password) {
  try {
    const a = JSON.parse(localStorage.getItem(CRED_KEY));
    return !!(a && a.username === username && a.password === password);
  } catch { return false; }
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

export function saveSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

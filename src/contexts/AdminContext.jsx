import { createContext, useContext, useState, useCallback } from 'react';
import { hasAdmin, saveAdmin, verifyAdmin, getSession, saveSession, clearSession } from '../utils/adminStorage';

const Ctx = createContext(null);

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!getSession());
  const [username, setUsername] = useState(() => getSession()?.username ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const login = useCallback((uname, password) => {
    const ok = verifyAdmin(uname, password);
    if (ok) {
      saveSession(uname);
      setIsLoggedIn(true);
      setUsername(uname);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setIsLoggedIn(false);
    setUsername(null);
  }, []);

  const createAccount = useCallback((uname, password) => {
    try {
      saveAdmin(uname, password);
      saveSession(uname);
      setIsLoggedIn(true);
      setUsername(uname);
      return true;
    } catch {
      return false;
    }
  }, []);

  const requireAdmin = useCallback((action) => {
    if (isLoggedIn) { action?.(); }
    else { setPending(() => action); setModalOpen(true); }
  }, [isLoggedIn]);

  const onSuccess = useCallback(() => {
    setModalOpen(false);
    const fn = pending;
    setPending(null);
    fn?.();
  }, [pending]);

  const openModal = useCallback(() => {
    setPending(null);
    setModalOpen(true);
  }, []);

  return (
    <Ctx.Provider value={{
      isLoggedIn, username,
      login, logout, createAccount, hasAdmin,
      requireAdmin, openModal,
      modalOpen, setModalOpen, onSuccess,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAdmin = () => useContext(Ctx);

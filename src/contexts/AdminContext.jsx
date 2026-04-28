import { createContext, useContext, useState, useCallback } from 'react';
import { verifyAdmin, saveAdmin } from '../utils/adminStorage';

const Ctx = createContext(null);

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(null);

  const login = useCallback((u, p) => {
    if (verifyAdmin(u, p)) {
      setIsLoggedIn(true);
      setUsername(u);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setUsername(null);
  }, []);

  const createAccount = useCallback((u, p) => {
    saveAdmin(u, p);
    setIsLoggedIn(true);
    setUsername(u);
  }, []);

  // If already logged in, run action immediately; otherwise show modal first.
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
      login, logout, createAccount,
      requireAdmin, openModal,
      modalOpen, setModalOpen, onSuccess,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAdmin = () => useContext(Ctx);

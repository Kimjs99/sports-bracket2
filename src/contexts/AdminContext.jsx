import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { hasAdmin, saveAdmin, verifyAdmin, signOutAdmin, subscribeAuth, ADMIN_CREATED_KEY } from '../utils/adminStorage';

const Ctx = createContext(null);

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(null);

  // Restore session from Supabase Auth on mount / across refreshes
  useEffect(() => {
    const sub = subscribeAuth(session => {
      if (session?.user) {
        setIsLoggedIn(true);
        const uname = session.user.user_metadata?.username
          ?? localStorage.getItem(ADMIN_CREATED_KEY)
          ?? 'admin';
        setUsername(uname);
      } else {
        setIsLoggedIn(false);
        setUsername(null);
      }
    });
    return () => sub.unsubscribe();
  }, []);

  const login = useCallback(async (_uname, password) => {
    const ok = await verifyAdmin(password);
    if (ok) {
      const stored = localStorage.getItem(ADMIN_CREATED_KEY) ?? _uname;
      setIsLoggedIn(true);
      setUsername(stored);
    }
    return ok;
  }, []);

  const logout = useCallback(async () => {
    await signOutAdmin();
    setIsLoggedIn(false);
    setUsername(null);
  }, []);

  // throws 'ALREADY_EXISTS' if account already exists in Supabase
  const createAccount = useCallback(async (uname, password) => {
    await saveAdmin(uname, password);
    setIsLoggedIn(true);
    setUsername(uname);
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

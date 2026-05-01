import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { saveAdmin, verifyAdmin, signOutAdmin } from '../utils/adminStorage';
import { supabase } from '../lib/supabase';

const Ctx = createContext(null);

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(null);

  // 페이지 로드 시 기존 세션 복원
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUsername(session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        setUsername(session.user.email);
      } else {
        setIsLoggedIn(false);
        setUsername(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const ok = await verifyAdmin(email, password);
    if (ok) {
      setIsLoggedIn(true);
      setUsername(email);
    }
    return ok;
  }, []);

  const logout = useCallback(async () => {
    await signOutAdmin();
    setIsLoggedIn(false);
    setUsername(null);
  }, []);

  const createAccount = useCallback(async (email, password) => {
    try {
      await saveAdmin(email, password);
      setIsLoggedIn(true);
      setUsername(email);
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
      login, logout, createAccount,
      requireAdmin, openModal,
      modalOpen, setModalOpen, onSuccess,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAdmin = () => useContext(Ctx);

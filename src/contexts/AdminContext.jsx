import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { loadOrganizations, loginOrg, registerOrg, signOutAdmin, subscribeAuth } from '../utils/adminStorage';
import { clearLocalCache } from '../utils/storage';
import { supabase } from '../lib/supabase';

const Ctx = createContext(null);

export function AdminProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(null);   // org name
  const [orgSlug, setOrgSlug] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOrgSlug, setModalOrgSlug] = useState(null); // which org the modal is for
  const [pending, setPending] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const sub = subscribeAuth(async session => {
      if (session?.user) {
        const orgName = session.user.user_metadata?.org_name ?? null;
        const slug = session.user.user_metadata?.org_slug ?? null;
        setIsLoggedIn(true);
        setUsername(orgName);
        setOrgSlug(slug);
        // Fetch org id if not in metadata
        if (slug && !orgId) {
          try {
            const { data } = await supabase
              .from('organizations').select('id').eq('slug', slug).single();
            if (data) setOrgId(data.id);
          } catch { /* ignore */ }
        }
      } else {
        setIsLoggedIn(false);
        setUsername(null);
        setOrgSlug(null);
        setOrgId(null);
      }
    });
    return () => sub.unsubscribe();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (slug, password) => {
    const result = await loginOrg(slug, password);
    if (result) {
      setIsLoggedIn(true);
      setUsername(result.org.name);
      setOrgSlug(result.org.slug);
      setOrgId(result.org.id ?? null);
      clearLocalCache(); // wipe any stale cache from a previous org session
    }
    return !!result;
  }, []);

  const logout = useCallback(async () => {
    await signOutAdmin();
    clearLocalCache();
    setIsLoggedIn(false);
    setUsername(null);
    setOrgSlug(null);
    setOrgId(null);
  }, []);

  const createOrg = useCallback(async (name, slug, password) => {
    const result = await registerOrg(name, slug, password);
    setIsLoggedIn(true);
    setUsername(result.org.name);
    setOrgSlug(result.org.slug);
    setOrgId(result.org.id ?? null);
    clearLocalCache();
    return result;
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

  const openModal = useCallback((slug = null) => {
    setModalOrgSlug(slug);
    setPending(null);
    setModalOpen(true);
  }, []);

  return (
    <Ctx.Provider value={{
      isLoggedIn, username, orgSlug, orgId,
      login, logout, createOrg,
      requireAdmin, openModal,
      modalOpen, setModalOpen, modalOrgSlug, onSuccess,
      loadOrganizations,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAdmin = () => useContext(Ctx);

import { createContext, useReducer, useEffect, useState } from 'react';
import { reducer, initialState } from './store/reducer';
import { ACTIONS } from './store/actions';
import { SCREENS } from './constants';
import { migrateFromLegacy } from './utils/storage';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import Home from './components/Home';
import Setup from './components/Setup';
import Draw from './components/Draw';
import MatchPlay from './components/MatchPlay';
import Dashboard from './components/Dashboard';
import AdminLoginModal from './components/ui/AdminLoginModal';
import GlobalBar from './components/GlobalBar';

export const AppContext = createContext(null);

function AppInner({ theme, setTheme }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { modalOpen } = useAdmin();

  useEffect(() => {
    migrateFromLegacy();
    dispatch({ type: ACTIONS.LOAD_TOURNAMENT_LIST });
  }, []);

  const screen = state.currentScreen;

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <GlobalBar theme={theme} setTheme={setTheme} />
      {screen === SCREENS.HOME && <Home />}
      {screen === SCREENS.SETUP && <Setup />}
      {screen === SCREENS.DRAW && <Draw />}
      {screen === SCREENS.MATCH_PLAY && <MatchPlay />}
      {screen === SCREENS.DASHBOARD && <Dashboard />}
      {modalOpen && <AdminLoginModal />}
    </AppContext.Provider>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') ?? 'auto');

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      root.classList.toggle('dark', mq.matches);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = e => document.documentElement.classList.toggle('dark', e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <AdminProvider>
      <AppInner theme={theme} setTheme={setTheme} />
    </AdminProvider>
  );
}

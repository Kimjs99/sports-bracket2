import { createContext, useReducer, useEffect, useRef, useState, useCallback } from 'react';
import { reducer, initialState, makeSummary } from './store/reducer';
import { ACTIONS } from './store/actions';
import { SCREENS } from './constants';
import { saveTournament, loadTournament, loadAllTournaments, deleteTournament, clearAllTournaments } from './utils/storage';
import { readShareParam, clearShareParam } from './utils/shareUtils';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import Home from './components/Home';
import Setup from './components/Setup';
import Draw from './components/Draw';
import MatchPlay from './components/MatchPlay';
import Dashboard from './components/Dashboard';
import OrgSelectScreen from './components/OrgSelectScreen';
import AdminLoginModal from './components/ui/AdminLoginModal';
import GlobalBar from './components/GlobalBar';

export const AppContext = createContext(null);

function AppInner({ theme, setTheme }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { isLoggedIn, modalOpen } = useAdmin();
  const [importedLevel, setImportedLevel] = useState(null);
  const tournamentRef = useRef(null);

  // 로그인 후 대진 목록 로드
  const loadTournamentList = useCallback(async () => {
    const all = await loadAllTournaments();
    dispatch({
      type: ACTIONS.LOAD_TOURNAMENT_LIST,
      payload: { list: all.map(makeSummary) },
    });
  }, []);

  // 로그인 상태 변경 시 대진 목록 갱신
  useEffect(() => {
    if (isLoggedIn) {
      async function init() {
        const shared = readShareParam();
        if (shared?.meta?.id) {
          await saveTournament(shared);
          clearShareParam();
          setImportedLevel(shared.meta.schoolLevel ?? null);
          setTimeout(() => setImportedLevel(null), 4000);
        }
        await loadTournamentList();
        dispatch({ type: ACTIONS.SET_SCREEN, payload: { screen: SCREENS.HOME } });
      }
      init();
    } else {
      // 로그아웃 시 홈으로 리셋 (다음 로그인을 위해 초기 상태 유지)
      dispatch({ type: ACTIONS.RESET_ALL_TOURNAMENTS });
    }
  }, [isLoggedIn, loadTournamentList]);

  // state.tournament 변경 시 저장
  useEffect(() => {
    if (state.tournament && state.tournament !== tournamentRef.current) {
      saveTournament(state.tournament).catch(console.error);
    }
    tournamentRef.current = state.tournament;
  }, [state.tournament]);

  const asyncDispatch = useCallback(async (action) => {
    switch (action.type) {
      case ACTIONS.LOAD_TOURNAMENT_LIST: {
        const all = await loadAllTournaments();
        dispatch({ type: ACTIONS.LOAD_TOURNAMENT_LIST, payload: { list: all.map(makeSummary) } });
        break;
      }
      case ACTIONS.BACK_TO_HOME: {
        const all = await loadAllTournaments();
        dispatch({ type: ACTIONS.BACK_TO_HOME, payload: { list: all.map(makeSummary) } });
        break;
      }
      case ACTIONS.SELECT_TOURNAMENT: {
        const data = await loadTournament(action.payload.id);
        dispatch({ ...action, payload: { ...action.payload, data } });
        break;
      }
      case ACTIONS.DELETE_TOURNAMENT: {
        await deleteTournament(action.payload.id);
        dispatch(action);
        break;
      }
      case ACTIONS.RESET_ALL_TOURNAMENTS: {
        await clearAllTournaments();
        dispatch(action);
        break;
      }
      default:
        dispatch(action);
    }
  }, []);

  // 로그인 전: org 선택 화면
  if (!isLoggedIn) {
    return (
      <AppContext.Provider value={{ state, dispatch, asyncDispatch, importedLevel }}>
        <GlobalBar theme={theme} setTheme={setTheme} />
        <OrgSelectScreen onOrgLogin={() => {}} />
        {modalOpen && <AdminLoginModal />}
      </AppContext.Provider>
    );
  }

  const screen = state.currentScreen;

  return (
    <AppContext.Provider value={{ state, dispatch, asyncDispatch, importedLevel }}>
      <GlobalBar theme={theme} setTheme={setTheme} />
      {screen === SCREENS.HOME && <Home />}
      {screen === SCREENS.SETUP && <Setup />}
      {screen === SCREENS.DRAW && <Draw />}
      {screen === SCREENS.MATCH_PLAY && <MatchPlay />}
      {screen === SCREENS.DASHBOARD && <Dashboard />}
      {modalOpen && <AdminLoginModal />}
      <footer className="text-center text-[11px] text-gray-400 dark:text-gray-600 py-4 pb-6 select-none">
        © 2026 kimjs · 학교스포츠클럽 대진 관리 시스템. Designed for school sports.
      </footer>
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

import { ACTIONS } from './actions';
import { SCREENS, SPORT_NAME, MAX_HISTORY, MATCH_STATUS, GENDER_TYPES } from '../constants';
import { generateBracket, generateLeague, submitMatchResult, submitLeagueResult } from '../utils/tournament';

export const initialState = {
  currentScreen: SCREENS.HOME,
  tournament: null,
  tournamentList: [],
  setupMeta: { schoolLevel: '고등', gender: GENDER_TYPES[2], sport: SPORT_NAME, gameFormat: 'tournament' },
  setupTeams: [],
  ui: {
    errorMessage: null,
    reshuffleConfirmOpen: false,
  },
};

function buildTournament(meta, teams, seed) {
  const fmt = meta.gameFormat ?? 'tournament';
  const bracketData = fmt === 'league' ? generateLeague(teams) : generateBracket(teams, seed);
  return {
    meta: {
      id: `tournament_${seed}`,
      schoolLevel: meta.schoolLevel,
      gender: meta.gender ?? GENDER_TYPES[2],
      sport: meta.sport ?? SPORT_NAME,
      gameFormat: fmt,
      totalTeams: teams.length,
      bracketSize: bracketData.bracketSize,
      byeCount: bracketData.byeCount,
      createdAt: new Date().toISOString(),
      seed,
      status: 'in_progress',
    },
    teams: [...teams],
    bracket: { rounds: bracketData.rounds },
    notices: [],
    history: [],
  };
}

export function makeSummary(t) {
  const lastRound = t.bracket.rounds[t.bracket.rounds.length - 1];
  const winner = lastRound?.matches[0]?.winner ?? null;
  const allMatches = t.bracket.rounds.flatMap(r => r.matches);
  return {
    id: t.meta.id,
    schoolLevel: t.meta.schoolLevel,
    sport: t.meta.sport,
    totalTeams: t.meta.totalTeams,
    bracketSize: t.meta.bracketSize,
    createdAt: t.meta.createdAt,
    winner,
    doneCount: allMatches.filter(m => m.status === MATCH_STATUS.DONE).length,
    totalNonBye: allMatches.filter(m => !m.isBye).length,
  };
}

export function reducer(state, action) {
  switch (action.type) {

    case ACTIONS.SET_SCREEN:
      return { ...state, currentScreen: action.payload.screen };

    case ACTIONS.BACK_TO_HOME:
      return {
        ...state,
        tournament: null,
        tournamentList: action.payload?.list ?? state.tournamentList,
        currentScreen: SCREENS.HOME,
      };

    case ACTIONS.LOAD_TOURNAMENT_LIST:
      return { ...state, tournamentList: action.payload?.list ?? state.tournamentList };

    case ACTIONS.SELECT_TOURNAMENT: {
      const data = action.payload.data;
      if (!data) return state;
      let screen = action.payload.targetScreen ?? null;
      if (!screen) {
        const lastRound = data.bracket.rounds[data.bracket.rounds.length - 1];
        const hasWinner = lastRound?.matches[0]?.winner;
        const doneCount = data.bracket.rounds.flatMap(r => r.matches).filter(m => m.status === MATCH_STATUS.DONE).length;
        screen = SCREENS.DRAW;
        if (hasWinner) screen = SCREENS.DASHBOARD;
        else if (doneCount > 0) screen = SCREENS.MATCH_PLAY;
      }
      return {
        ...state,
        tournament: data,
        setupMeta: { schoolLevel: data.meta.schoolLevel, gender: data.meta.gender ?? GENDER_TYPES[2], sport: data.meta.sport, gameFormat: data.meta.gameFormat ?? 'tournament' },
        setupTeams: [...data.teams],
        currentScreen: screen,
      };
    }

    case ACTIONS.DELETE_TOURNAMENT: {
      const { id } = action.payload;
      return {
        ...state,
        tournament: state.tournament?.meta.id === id ? null : state.tournament,
        tournamentList: state.tournamentList.filter(t => t.id !== id),
      };
    }

    case ACTIONS.SET_META:
      return { ...state, setupMeta: { ...state.setupMeta, ...action.payload } };

    case ACTIONS.ADD_TEAM: {
      const name = action.payload.name.trim();
      if (!name) return state;
      return { ...state, setupTeams: [...state.setupTeams, name], ui: { ...state.ui, errorMessage: null } };
    }

    case ACTIONS.REMOVE_TEAM:
      return { ...state, setupTeams: state.setupTeams.filter((_, i) => i !== action.payload.index) };

    case ACTIONS.UPDATE_TEAM:
      return {
        ...state,
        setupTeams: state.setupTeams.map((t, i) => i === action.payload.index ? action.payload.name : t),
      };

    case ACTIONS.GENERATE_BRACKET: {
      const seed = action.payload?.seed ?? Date.now();
      const tournament = buildTournament(state.setupMeta, state.setupTeams, seed);
      return {
        ...state,
        tournament,
        tournamentList: [makeSummary(tournament), ...state.tournamentList],
        currentScreen: SCREENS.DRAW,
        ui: { ...state.ui, errorMessage: null },
      };
    }

    case ACTIONS.RESHUFFLE: {
      if (!state.tournament) return state;
      const seed = action.payload?.seed ?? Date.now();
      const oldEntry = {
        seed: state.tournament.meta.seed,
        reshuffledAt: new Date().toISOString(),
        teams: [...state.tournament.teams],
      };
      const newHistory = [...state.tournament.history, oldEntry].slice(-MAX_HISTORY);
      const isLeagueReshuffle = state.tournament.meta.gameFormat === 'league';
      const bracketData = isLeagueReshuffle
        ? generateLeague(state.tournament.teams)
        : generateBracket(state.tournament.teams, seed);
      const updated = {
        ...state.tournament,
        meta: { ...state.tournament.meta, seed, bracketSize: bracketData.bracketSize, byeCount: bracketData.byeCount },
        bracket: { rounds: bracketData.rounds },
        history: newHistory,
      };
      const newList = state.tournamentList.map(t => t.id === updated.meta.id ? makeSummary(updated) : t);
      return {
        ...state,
        tournament: updated,
        tournamentList: newList,
        ui: { ...state.ui, reshuffleConfirmOpen: false },
      };
    }

    case ACTIONS.UPDATE_SCHEDULE: {
      if (!state.tournament) return state;
      const { matchId, date, time, venue } = action.payload;
      const rounds = state.tournament.bracket.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => m.id === matchId ? { ...m, date, time, venue } : m),
      }));
      const updated = { ...state.tournament, bracket: { rounds } };
      return { ...state, tournament: updated };
    }

    case ACTIONS.SUBMIT_RESULT: {
      if (!state.tournament) return state;
      const { matchId, homeScore, awayScore } = action.payload;
      const isLeague = state.tournament.meta.gameFormat === 'league';
      const rounds = isLeague
        ? submitLeagueResult(state.tournament.bracket.rounds, matchId, homeScore, awayScore)
        : submitMatchResult(state.tournament.bracket.rounds, matchId, homeScore, awayScore);
      const updated = { ...state.tournament, bracket: { rounds } };
      const newList = state.tournamentList.map(t => t.id === updated.meta.id ? makeSummary(updated) : t);
      return { ...state, tournament: updated, tournamentList: newList };
    }

    case ACTIONS.EDIT_RESULT: {
      if (!state.tournament) return state;
      const { matchId } = action.payload;
      const rounds = state.tournament.bracket.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m =>
          m.id === matchId
            ? { ...m, homeScore: null, awayScore: null, winner: null, status: MATCH_STATUS.SCHEDULED, completedAt: null }
            : m
        ),
      }));
      const updated = { ...state.tournament, bracket: { rounds } };
      const newList = state.tournamentList.map(t => t.id === updated.meta.id ? makeSummary(updated) : t);
      return { ...state, tournament: updated, tournamentList: newList };
    }

    case ACTIONS.ADD_NOTICE: {
      if (!state.tournament) return state;
      const notice = {
        id: `n${Date.now()}`,
        title: action.payload.title,
        content: action.payload.content,
        createdAt: new Date().toISOString(),
      };
      const updated = { ...state.tournament, notices: [notice, ...state.tournament.notices] };
      return { ...state, tournament: updated };
    }

    case ACTIONS.DELETE_NOTICE: {
      if (!state.tournament) return state;
      const updated = {
        ...state.tournament,
        notices: state.tournament.notices.filter(n => n.id !== action.payload.id),
      };
      return { ...state, tournament: updated };
    }

    case ACTIONS.SET_UI_ERROR:
      return { ...state, ui: { ...state.ui, errorMessage: action.payload.message } };

    case ACTIONS.TOGGLE_RESHUFFLE_CONFIRM:
      return { ...state, ui: { ...state.ui, reshuffleConfirmOpen: action.payload.open } };

    case ACTIONS.RESET_BRACKET: {
      if (!state.tournament) return state;
      const bracketData = generateBracket(state.tournament.teams, state.tournament.meta.seed);
      const updated = {
        ...state.tournament,
        meta: { ...state.tournament.meta, bracketSize: bracketData.bracketSize, byeCount: bracketData.byeCount, status: 'in_progress' },
        bracket: { rounds: bracketData.rounds },
      };
      const newList = state.tournamentList.map(t => t.id === updated.meta.id ? makeSummary(updated) : t);
      return { ...state, tournament: updated, tournamentList: newList };
    }

    case ACTIONS.RESET_ALL_TOURNAMENTS:
      return {
        ...initialState,
        tournamentList: [],
        currentScreen: SCREENS.HOME,
      };

    case ACTIONS.RESET_TOURNAMENT:
      return {
        ...state,
        tournament: null,
        setupMeta: { schoolLevel: '고등', gender: GENDER_TYPES[2], sport: SPORT_NAME, gameFormat: 'tournament' },
        setupTeams: [],
        currentScreen: SCREENS.HOME,
        ui: { errorMessage: null, reshuffleConfirmOpen: false },
      };

    default:
      return state;
  }
}

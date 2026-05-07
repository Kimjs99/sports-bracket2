import { ACTIONS } from './actions';
import { SCREENS, SPORT_NAME, MAX_HISTORY, MATCH_STATUS, GENDER_TYPES } from '../constants';
import {
  generateBracket, generateLeague, generateGroupTournament,
  submitMatchResult, submitLeagueResult,
  submitGroupTournamentResult, editGroupTournamentResult,
  isGroupStageComplete, buildKnockoutFromGroups, calcGroupConfig,
} from '../utils/tournament';

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

  // Auto-upgrade league → group_tournament for 7+ teams
  if (fmt === 'league' && teams.length >= 7) {
    const bracketData = generateGroupTournament(teams, seed);
    return {
      meta: {
        id: `tournament_${seed}`,
        schoolLevel: meta.schoolLevel,
        gender: meta.gender ?? GENDER_TYPES[2],
        sport: meta.sport ?? SPORT_NAME,
        gameFormat: 'group_tournament',
        totalTeams: teams.length,
        bracketSize: bracketData.knockoutSize,
        byeCount: 0,
        groupCount: bracketData.groupCount,
        advancePerGroup: bracketData.advancePerGroup,
        knockoutSize: bracketData.knockoutSize,
        phase: 'group',
        createdAt: new Date().toISOString(),
        seed,
        status: 'in_progress',
      },
      teams: [...teams],
      bracket: { groups: bracketData.groups, knockout: null },
      notices: [],
      history: [],
    };
  }

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
  if (t.meta.gameFormat === 'group_tournament') {
    const allGroupMatches = t.bracket.groups.flatMap(g => g.rounds.flatMap(r => r.matches));
    const knockoutMatches = t.bracket.knockout?.rounds.flatMap(r => r.matches) ?? [];
    const allMatches = [...allGroupMatches, ...knockoutMatches];
    const lastKO = t.bracket.knockout?.rounds[t.bracket.knockout.rounds.length - 1];
    const winner = lastKO?.matches[0]?.winner ?? null;
    return {
      id: t.meta.id,
      schoolLevel: t.meta.schoolLevel,
      gender: t.meta.gender ?? '혼성',
      sport: t.meta.sport,
      gameFormat: 'group_tournament',
      totalTeams: t.meta.totalTeams,
      bracketSize: t.meta.bracketSize,
      createdAt: t.meta.createdAt,
      winner,
      doneCount: allMatches.filter(m => m.status === MATCH_STATUS.DONE).length,
      totalNonBye: allMatches.filter(m => !m.isBye).length,
    };
  }

  const lastRound = t.bracket.rounds[t.bracket.rounds.length - 1];
  const winner = lastRound?.matches[0]?.winner ?? null;
  const allMatches = t.bracket.rounds.flatMap(r => r.matches);
  return {
    id: t.meta.id,
    schoolLevel: t.meta.schoolLevel,
    gender: t.meta.gender ?? '혼성',
    sport: t.meta.sport,
    gameFormat: t.meta.gameFormat ?? 'tournament',
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
        const isGroupTournament = data.meta.gameFormat === 'group_tournament';
        let hasWinner = false;
        let doneCount = 0;
        if (isGroupTournament) {
          const allGroupMatches = data.bracket.groups.flatMap(g => g.rounds.flatMap(r => r.matches));
          const knockoutMatches = data.bracket.knockout?.rounds.flatMap(r => r.matches) ?? [];
          doneCount = [...allGroupMatches, ...knockoutMatches].filter(m => m.status === MATCH_STATUS.DONE).length;
          const lastKO = data.bracket.knockout?.rounds[data.bracket.knockout.rounds.length - 1];
          hasWinner = !!lastKO?.matches[0]?.winner;
        } else {
          const lastRound = data.bracket.rounds[data.bracket.rounds.length - 1];
          hasWinner = !!lastRound?.matches[0]?.winner;
          doneCount = data.bracket.rounds.flatMap(r => r.matches).filter(m => m.status === MATCH_STATUS.DONE).length;
        }
        screen = SCREENS.DRAW;
        if (hasWinner) screen = SCREENS.DASHBOARD;
        else if (doneCount > 0) screen = SCREENS.MATCH_PLAY;
      }
      return {
        ...state,
        tournament: data,
        setupMeta: {
          schoolLevel: data.meta.schoolLevel,
          gender: data.meta.gender ?? GENDER_TYPES[2],
          sport: data.meta.sport,
          // group_tournament maps back to 'league' in setup UI
          gameFormat: data.meta.gameFormat === 'group_tournament' ? 'league' : (data.meta.gameFormat ?? 'tournament'),
        },
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
        gameFormat: state.tournament.meta.gameFormat,
      };
      const newHistory = [...state.tournament.history, oldEntry].slice(-MAX_HISTORY);
      const isGroupTournament = state.tournament.meta.gameFormat === 'group_tournament';
      const isLeague = state.tournament.meta.gameFormat === 'league';

      let newBracket, newMeta;
      if (isGroupTournament) {
        const bracketData = generateGroupTournament(state.tournament.teams, seed);
        newBracket = { groups: bracketData.groups, knockout: null };
        newMeta = { ...state.tournament.meta, seed, bracketSize: bracketData.knockoutSize, byeCount: 0, phase: 'group' };
      } else if (isLeague) {
        const bracketData = generateLeague(state.tournament.teams);
        newBracket = { rounds: bracketData.rounds };
        newMeta = { ...state.tournament.meta, seed, bracketSize: bracketData.bracketSize, byeCount: bracketData.byeCount };
      } else {
        const bracketData = generateBracket(state.tournament.teams, seed);
        newBracket = { rounds: bracketData.rounds };
        newMeta = { ...state.tournament.meta, seed, bracketSize: bracketData.bracketSize, byeCount: bracketData.byeCount };
      }

      const updated = { ...state.tournament, meta: newMeta, bracket: newBracket, history: newHistory };
      const newList = state.tournamentList.map(t => t.id === updated.meta.id ? makeSummary(updated) : t);
      return { ...state, tournament: updated, tournamentList: newList, ui: { ...state.ui, reshuffleConfirmOpen: false } };
    }

    case ACTIONS.UPDATE_SCHEDULE: {
      if (!state.tournament) return state;
      const { matchId, date, time, venue } = action.payload;

      if (state.tournament.meta.gameFormat === 'group_tournament') {
        const groups = state.tournament.bracket.groups.map(g => ({
          ...g,
          rounds: g.rounds.map(r => ({
            ...r,
            matches: r.matches.map(m => m.id === matchId ? { ...m, date, time, venue } : m),
          })),
        }));
        const knockout = state.tournament.bracket.knockout ? {
          rounds: state.tournament.bracket.knockout.rounds.map(r => ({
            ...r,
            matches: r.matches.map(m => m.id === matchId ? { ...m, date, time, venue } : m),
          })),
        } : null;
        const updated = { ...state.tournament, bracket: { groups, knockout } };
        return { ...state, tournament: updated };
      }

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
      const fmt = state.tournament.meta.gameFormat;

      let updated;
      if (fmt === 'group_tournament') {
        updated = submitGroupTournamentResult(state.tournament, matchId, homeScore, awayScore);
      } else if (fmt === 'league') {
        const rounds = submitLeagueResult(state.tournament.bracket.rounds, matchId, homeScore, awayScore);
        updated = { ...state.tournament, bracket: { rounds } };
      } else {
        const rounds = submitMatchResult(state.tournament.bracket.rounds, matchId, homeScore, awayScore);
        updated = { ...state.tournament, bracket: { rounds } };
      }

      const newList = state.tournamentList.map(t => t.id === updated.meta.id ? makeSummary(updated) : t);
      return { ...state, tournament: updated, tournamentList: newList };
    }

    case ACTIONS.EDIT_RESULT: {
      if (!state.tournament) return state;
      const { matchId } = action.payload;
      const fmt = state.tournament.meta.gameFormat;

      let updated;
      if (fmt === 'group_tournament') {
        updated = editGroupTournamentResult(state.tournament, matchId);
      } else {
        const rounds = state.tournament.bracket.rounds.map(r => ({
          ...r,
          matches: r.matches.map(m =>
            m.id === matchId
              ? { ...m, homeScore: null, awayScore: null, winner: null, status: MATCH_STATUS.SCHEDULED, completedAt: null }
              : m
          ),
        }));
        updated = { ...state.tournament, bracket: { rounds } };
      }

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
      const isGroupTournament = state.tournament.meta.gameFormat === 'group_tournament';

      let newBracket, newMeta;
      if (isGroupTournament) {
        const bracketData = generateGroupTournament(state.tournament.teams, state.tournament.meta.seed);
        newBracket = { groups: bracketData.groups, knockout: null };
        newMeta = { ...state.tournament.meta, bracketSize: bracketData.knockoutSize, byeCount: 0, phase: 'group', status: 'in_progress' };
      } else {
        const bracketData = generateBracket(state.tournament.teams, state.tournament.meta.seed);
        newBracket = { rounds: bracketData.rounds };
        newMeta = { ...state.tournament.meta, bracketSize: bracketData.bracketSize, byeCount: bracketData.byeCount, status: 'in_progress' };
      }

      const updated = { ...state.tournament, meta: newMeta, bracket: newBracket };
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

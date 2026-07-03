import { describe, it, expect } from 'vitest';
import { reducer, initialState, makeSummary } from './reducer';
import { ACTIONS } from './actions';
import { SCREENS, MATCH_STATUS, GENDER_TYPES, MAX_HISTORY } from '../constants';

// 헬퍼: 팀 목록으로 대회를 생성한 state 반환 (seed 고정으로 재현 가능)
function genState(teams, { seed = 1, meta = {} } = {}) {
  const base = {
    ...initialState,
    setupMeta: { ...initialState.setupMeta, ...meta },
    setupTeams: [...teams],
  };
  return reducer(base, { type: ACTIONS.GENERATE_BRACKET, payload: { seed } });
}

// 헬퍼: 4팀 토너먼트를 결승까지 완주
function playToFinal(state) {
  let s = state;
  s = reducer(s, { type: ACTIONS.SUBMIT_RESULT, payload: { matchId: 'r1m1', homeScore: 21, awayScore: 10 } });
  s = reducer(s, { type: ACTIONS.SUBMIT_RESULT, payload: { matchId: 'r1m2', homeScore: 21, awayScore: 10 } });
  s = reducer(s, { type: ACTIONS.SUBMIT_RESULT, payload: { matchId: 'r2m1', homeScore: 25, awayScore: 20 } });
  return s;
}

const TEAMS4 = ['A중', 'B중', 'C중', 'D중'];

describe('네비게이션 액션', () => {
  it('SET_SCREEN은 화면만 바꾼다', () => {
    const s = reducer(initialState, { type: ACTIONS.SET_SCREEN, payload: { screen: SCREENS.SETUP } });
    expect(s.currentScreen).toBe(SCREENS.SETUP);
    expect(s.tournament).toBeNull();
  });

  it('BACK_TO_HOME은 현재 대회를 비우고 목록을 갱신한다', () => {
    const before = genState(TEAMS4);
    const list = [{ id: 'x' }];
    const s = reducer(before, { type: ACTIONS.BACK_TO_HOME, payload: { list } });
    expect(s.currentScreen).toBe(SCREENS.HOME);
    expect(s.tournament).toBeNull();
    expect(s.tournamentList).toBe(list);
  });

  it('LOAD_TOURNAMENT_LIST는 payload가 없으면 기존 목록을 유지한다', () => {
    const before = { ...initialState, tournamentList: [{ id: 'keep' }] };
    const s = reducer(before, { type: ACTIONS.LOAD_TOURNAMENT_LIST, payload: {} });
    expect(s.tournamentList).toEqual([{ id: 'keep' }]);
  });

  it('알 수 없는 액션은 state를 그대로 반환한다', () => {
    expect(reducer(initialState, { type: 'NOPE' })).toBe(initialState);
  });
});

describe('SELECT_TOURNAMENT 화면 자동 판별', () => {
  it('결과가 없으면 DRAW로 간다', () => {
    const data = genState(TEAMS4).tournament;
    const s = reducer(initialState, { type: ACTIONS.SELECT_TOURNAMENT, payload: { data } });
    expect(s.currentScreen).toBe(SCREENS.DRAW);
    expect(s.tournament).toBe(data);
  });

  it('진행 중(일부 완료)이면 MATCH_PLAY로 간다', () => {
    const st = genState(TEAMS4);
    const data = reducer(st, { type: ACTIONS.SUBMIT_RESULT, payload: { matchId: 'r1m1', homeScore: 21, awayScore: 10 } }).tournament;
    const s = reducer(initialState, { type: ACTIONS.SELECT_TOURNAMENT, payload: { data } });
    expect(s.currentScreen).toBe(SCREENS.MATCH_PLAY);
  });

  it('우승자가 나왔으면 DASHBOARD로 간다', () => {
    const data = playToFinal(genState(TEAMS4)).tournament;
    const s = reducer(initialState, { type: ACTIONS.SELECT_TOURNAMENT, payload: { data } });
    expect(s.currentScreen).toBe(SCREENS.DASHBOARD);
  });

  it('targetScreen 지정 시 자동 판별을 건너뛴다', () => {
    const data = playToFinal(genState(TEAMS4)).tournament;
    const s = reducer(initialState, {
      type: ACTIONS.SELECT_TOURNAMENT,
      payload: { data, targetScreen: SCREENS.DRAW },
    });
    expect(s.currentScreen).toBe(SCREENS.DRAW);
  });

  it('data가 없으면 state를 그대로 반환한다', () => {
    expect(reducer(initialState, { type: ACTIONS.SELECT_TOURNAMENT, payload: { data: null } })).toBe(initialState);
  });

  it('setupMeta를 대회 메타로 채우고 group_tournament는 league로 되돌린다', () => {
    const teams7 = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const data = genState(teams7, { meta: { gameFormat: 'league' } }).tournament;
    expect(data.meta.gameFormat).toBe('group_tournament'); // 7팀 자동 승격 전제
    const s = reducer(initialState, { type: ACTIONS.SELECT_TOURNAMENT, payload: { data } });
    expect(s.setupMeta.gameFormat).toBe('league');
    expect(s.setupTeams).toEqual(teams7);
  });
});

describe('설정(셋업) 액션', () => {
  it('SET_META는 기존 메타에 병합한다', () => {
    const s = reducer(initialState, { type: ACTIONS.SET_META, payload: { schoolLevel: '중등' } });
    expect(s.setupMeta.schoolLevel).toBe('중등');
    expect(s.setupMeta.gameFormat).toBe('tournament'); // 나머지 유지
  });

  it('ADD_TEAM은 공백을 제거하고, 빈 이름은 무시한다', () => {
    let s = reducer(initialState, { type: ACTIONS.ADD_TEAM, payload: { name: '  한밭중  ' } });
    expect(s.setupTeams).toEqual(['한밭중']);
    s = reducer(s, { type: ACTIONS.ADD_TEAM, payload: { name: '   ' } });
    expect(s.setupTeams).toEqual(['한밭중']);
  });

  it('REMOVE_TEAM / UPDATE_TEAM은 인덱스 기준으로 동작한다', () => {
    const base = { ...initialState, setupTeams: ['A', 'B', 'C'] };
    expect(reducer(base, { type: ACTIONS.REMOVE_TEAM, payload: { index: 1 } }).setupTeams).toEqual(['A', 'C']);
    expect(reducer(base, { type: ACTIONS.UPDATE_TEAM, payload: { index: 2, name: 'C2' } }).setupTeams).toEqual(['A', 'B', 'C2']);
  });
});

describe('GENERATE_BRACKET', () => {
  it('토너먼트를 생성하고 요약을 목록 맨 앞에 추가하며 DRAW로 이동한다', () => {
    const s = genState(TEAMS4, { seed: 7 });
    expect(s.currentScreen).toBe(SCREENS.DRAW);
    expect(s.tournament.meta.id).toBe('tournament_7');
    expect(s.tournament.meta.totalTeams).toBe(4);
    expect(s.tournamentList[0].id).toBe('tournament_7');
    expect(s.tournamentList[0].winner).toBeNull();
  });

  it('league 6팀 이하는 리그전으로 생성된다', () => {
    const s = genState(['A', 'B', 'C', 'D'], { meta: { gameFormat: 'league' } });
    expect(s.tournament.meta.gameFormat).toBe('league');
    expect(s.tournament.bracket.rounds).toHaveLength(3);
  });

  it('league 7팀 이상은 조별리그→토너먼트로 자동 승격된다', () => {
    const s = genState(['A', 'B', 'C', 'D', 'E', 'F', 'G'], { meta: { gameFormat: 'league' } });
    const { meta, bracket } = s.tournament;
    expect(meta.gameFormat).toBe('group_tournament');
    expect(meta.phase).toBe('group');
    expect(bracket.groups.length).toBeGreaterThan(1);
    expect(bracket.knockout).toBeNull();
  });
});

describe('RESHUFFLE', () => {
  it('이전 시드를 history에 남기고 새 대진을 만든다', () => {
    const before = genState(TEAMS4, { seed: 1 });
    const s = reducer(before, { type: ACTIONS.RESHUFFLE, payload: { seed: 2 } });
    expect(s.tournament.meta.seed).toBe(2);
    expect(s.tournament.history).toHaveLength(1);
    expect(s.tournament.history[0].seed).toBe(1);
    expect(s.ui.reshuffleConfirmOpen).toBe(false);
  });

  it(`history는 최대 ${MAX_HISTORY}개까지만 보관한다`, () => {
    let s = genState(TEAMS4, { seed: 0 });
    for (let i = 1; i <= MAX_HISTORY + 3; i++) {
      s = reducer(s, { type: ACTIONS.RESHUFFLE, payload: { seed: i } });
    }
    expect(s.tournament.history).toHaveLength(MAX_HISTORY);
  });

  it('대회가 없으면 아무 것도 하지 않는다', () => {
    expect(reducer(initialState, { type: ACTIONS.RESHUFFLE, payload: { seed: 9 } })).toBe(initialState);
  });
});

describe('UPDATE_SCHEDULE', () => {
  it('해당 경기에만 날짜·시간·장소를 기록한다', () => {
    const before = genState(TEAMS4);
    const s = reducer(before, {
      type: ACTIONS.UPDATE_SCHEDULE,
      payload: { matchId: 'r1m1', date: '2026-07-10', time: '10:00', venue: '체육관' },
    });
    const [m1, m2] = s.tournament.bracket.rounds[0].matches;
    expect(m1).toMatchObject({ date: '2026-07-10', time: '10:00', venue: '체육관' });
    expect(m2.date).toBeNull();
  });

  it('조별리그 형식에서도 조 경기 일정이 기록된다', () => {
    const before = genState(['A', 'B', 'C', 'D', 'E', 'F', 'G'], { meta: { gameFormat: 'league' } });
    const targetId = before.tournament.bracket.groups[0].rounds[0].matches[0].id;
    const s = reducer(before, {
      type: ACTIONS.UPDATE_SCHEDULE,
      payload: { matchId: targetId, date: '2026-07-11', time: '13:00', venue: '강당' },
    });
    const updated = s.tournament.bracket.groups[0].rounds[0].matches[0];
    expect(updated).toMatchObject({ date: '2026-07-11', venue: '강당' });
  });
});

describe('SUBMIT_RESULT / EDIT_RESULT', () => {
  it('결과 입력 시 목록 요약(doneCount)도 함께 갱신된다', () => {
    const before = genState(TEAMS4);
    const s = reducer(before, { type: ACTIONS.SUBMIT_RESULT, payload: { matchId: 'r1m1', homeScore: 21, awayScore: 10 } });
    expect(s.tournamentList[0].doneCount).toBe(1);
    expect(s.tournament.bracket.rounds[0].matches[0].status).toBe(MATCH_STATUS.DONE);
  });

  it('결승 완료 시 요약에 winner가 기록된다', () => {
    const s = playToFinal(genState(TEAMS4));
    expect(s.tournamentList[0].winner).not.toBeNull();
    expect(s.tournamentList[0].doneCount).toBe(3);
  });

  it('EDIT_RESULT는 경기를 초기화하고 요약도 되돌린다', () => {
    const done = playToFinal(genState(TEAMS4));
    const s = reducer(done, { type: ACTIONS.EDIT_RESULT, payload: { matchId: 'r2m1' } });
    const final = s.tournament.bracket.rounds[1].matches[0];
    expect(final.status).toBe(MATCH_STATUS.SCHEDULED);
    expect(final.winner).toBeNull();
    expect(s.tournamentList[0].winner).toBeNull();
    expect(s.tournamentList[0].doneCount).toBe(2);
  });

  it('대회가 없으면 아무 것도 하지 않는다', () => {
    expect(reducer(initialState, { type: ACTIONS.SUBMIT_RESULT, payload: { matchId: 'x', homeScore: 1, awayScore: 0 } })).toBe(initialState);
  });
});

describe('공지 액션', () => {
  it('ADD_NOTICE는 최신 공지를 맨 앞에 추가한다', () => {
    const before = genState(TEAMS4);
    let s = reducer(before, { type: ACTIONS.ADD_NOTICE, payload: { title: '첫 공지', content: '내용1' } });
    s = reducer(s, { type: ACTIONS.ADD_NOTICE, payload: { title: '둘째 공지', content: '내용2' } });
    expect(s.tournament.notices.map(n => n.title)).toEqual(['둘째 공지', '첫 공지']);
  });

  it('DELETE_NOTICE는 id로 삭제한다', () => {
    const before = genState(TEAMS4);
    const withNotice = reducer(before, { type: ACTIONS.ADD_NOTICE, payload: { title: 't', content: 'c' } });
    const id = withNotice.tournament.notices[0].id;
    const s = reducer(withNotice, { type: ACTIONS.DELETE_NOTICE, payload: { id } });
    expect(s.tournament.notices).toHaveLength(0);
  });
});

describe('삭제·초기화 액션', () => {
  it('DELETE_TOURNAMENT는 목록에서 제거하고, 보고 있던 대회면 비운다', () => {
    const before = genState(TEAMS4, { seed: 5 });
    const s = reducer(before, { type: ACTIONS.DELETE_TOURNAMENT, payload: { id: 'tournament_5' } });
    expect(s.tournament).toBeNull();
    expect(s.tournamentList).toHaveLength(0);
  });

  it('DELETE_TOURNAMENT는 다른 대회를 보고 있으면 유지한다', () => {
    const before = genState(TEAMS4, { seed: 5 });
    const withOther = { ...before, tournamentList: [...before.tournamentList, { id: 'other' }] };
    const s = reducer(withOther, { type: ACTIONS.DELETE_TOURNAMENT, payload: { id: 'other' } });
    expect(s.tournament).not.toBeNull();
    expect(s.tournamentList.map(t => t.id)).toEqual(['tournament_5']);
  });

  it('RESET_BRACKET은 결과를 지우고 같은 시드로 대진을 되살린다', () => {
    const done = playToFinal(genState(TEAMS4, { seed: 3 }));
    const s = reducer(done, { type: ACTIONS.RESET_BRACKET });
    const matches = s.tournament.bracket.rounds.flatMap(r => r.matches);
    expect(matches.every(m => m.status !== MATCH_STATUS.DONE)).toBe(true);
    expect(s.tournament.meta.seed).toBe(3);
    expect(s.tournament.meta.status).toBe('in_progress');
    expect(s.tournamentList[0].doneCount).toBe(0);
  });

  it('RESET_ALL_TOURNAMENTS는 초기 상태로 되돌린다', () => {
    const s = reducer(playToFinal(genState(TEAMS4)), { type: ACTIONS.RESET_ALL_TOURNAMENTS });
    expect(s.tournament).toBeNull();
    expect(s.tournamentList).toEqual([]);
    expect(s.currentScreen).toBe(SCREENS.HOME);
  });

  it('RESET_TOURNAMENT는 셋업 상태를 기본값으로 되돌린다', () => {
    const dirty = {
      ...genState(TEAMS4),
      setupMeta: { schoolLevel: '중등', gender: GENDER_TYPES[0], sport: '축구', gameFormat: 'league', grade: 1 },
    };
    const s = reducer(dirty, { type: ACTIONS.RESET_TOURNAMENT });
    expect(s.tournament).toBeNull();
    expect(s.setupTeams).toEqual([]);
    expect(s.setupMeta.gameFormat).toBe('tournament');
    expect(s.currentScreen).toBe(SCREENS.HOME);
  });
});

describe('UI 액션', () => {
  it('SET_UI_ERROR / TOGGLE_RESHUFFLE_CONFIRM', () => {
    let s = reducer(initialState, { type: ACTIONS.SET_UI_ERROR, payload: { message: '동점은 입력할 수 없습니다' } });
    expect(s.ui.errorMessage).toBe('동점은 입력할 수 없습니다');
    s = reducer(s, { type: ACTIONS.TOGGLE_RESHUFFLE_CONFIRM, payload: { open: true } });
    expect(s.ui.reshuffleConfirmOpen).toBe(true);
  });
});

describe('makeSummary', () => {
  it('토너먼트: 부전승 제외 경기 수와 완료 수를 집계한다', () => {
    // 6팀 → 8브라켓, 부전승 2 → 비부전승 경기 = 7경기 - 2부전승 = 5
    const t = genState(['A', 'B', 'C', 'D', 'E', 'F']).tournament;
    const summary = makeSummary(t);
    expect(summary.totalNonBye).toBe(5);
    expect(summary.doneCount).toBe(0);
    expect(summary.winner).toBeNull();
    expect(summary.gameFormat).toBe('tournament');
  });

  it('조별리그: 조 경기 전체를 집계하고 본선 미생성 시 winner는 null', () => {
    const t = genState(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], { meta: { gameFormat: 'league' } }).tournament;
    const summary = makeSummary(t);
    expect(summary.gameFormat).toBe('group_tournament');
    expect(summary.totalNonBye).toBe(12); // 4팀 조 2개 × 6경기
    expect(summary.winner).toBeNull();
  });
});

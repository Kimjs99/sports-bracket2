import { describe, it, expect } from 'vitest';
import {
  nextPowerOfTwo,
  getRoundName,
  distributeByes,
  generateBracket,
  submitMatchResult,
  generateLeague,
  submitLeagueResult,
  calcLeagueStandings,
  calcGroupConfig,
  generateGroupTournament,
  rebuildGroupStage,
  isGroupStageComplete,
  submitGroupTournamentResult,
  editGroupTournamentResult,
} from './tournament';
import { fisherYatesShuffle } from './shuffle';
import { MATCH_STATUS } from '../constants';

// ── 공통 유틸 ─────────────────────────────────────────────────────────────────

describe('nextPowerOfTwo', () => {
  it('1 이하는 1을 반환한다', () => {
    expect(nextPowerOfTwo(0)).toBe(1);
    expect(nextPowerOfTwo(1)).toBe(1);
  });

  it('2의 거듭제곱은 그대로 반환한다', () => {
    expect(nextPowerOfTwo(2)).toBe(2);
    expect(nextPowerOfTwo(8)).toBe(8);
    expect(nextPowerOfTwo(64)).toBe(64);
  });

  it('그 외에는 다음 2의 거듭제곱으로 올림한다', () => {
    expect(nextPowerOfTwo(3)).toBe(4);
    expect(nextPowerOfTwo(5)).toBe(8);
    expect(nextPowerOfTwo(9)).toBe(16);
    expect(nextPowerOfTwo(33)).toBe(64);
  });
});

describe('getRoundName', () => {
  it('브라켓 크기와 라운드 번호로 라운드 이름을 만든다', () => {
    expect(getRoundName(8, 1)).toBe('8강');
    expect(getRoundName(8, 2)).toBe('준결승');
    expect(getRoundName(8, 3)).toBe('결승');
    expect(getRoundName(16, 1)).toBe('16강');
    expect(getRoundName(64, 1)).toBe('64강');
  });
});

describe('distributeByes', () => {
  it('부전승이 없으면 빈 배열을 반환한다', () => {
    expect(distributeByes(8, 0)).toEqual([]);
  });

  it('짝수 위치(0, 2, 4, ...)부터 배치한다', () => {
    expect(distributeByes(8, 1)).toEqual([0]);
    expect(distributeByes(8, 2)).toEqual([0, 2]);
    expect(distributeByes(16, 3)).toEqual([0, 2, 4]);
  });

  it('짝수 위치가 부족하면 홀수 위치도 사용하며 중복이 없다', () => {
    const positions = distributeByes(8, 3);
    expect(positions).toHaveLength(3);
    expect(new Set(positions).size).toBe(3);
    positions.forEach(p => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThan(4);
    });
  });
});

describe('fisherYatesShuffle', () => {
  const teams = ['A', 'B', 'C', 'D', 'E'];

  it('같은 시드는 같은 순서를 만든다 (재현 가능)', () => {
    expect(fisherYatesShuffle(teams, 42)).toEqual(fisherYatesShuffle(teams, 42));
  });

  it('원본 배열을 변경하지 않는다', () => {
    fisherYatesShuffle(teams, 42);
    expect(teams).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('모든 팀이 결과에 그대로 포함된다', () => {
    const shuffled = fisherYatesShuffle(teams, 7);
    expect([...shuffled].sort()).toEqual([...teams].sort());
  });
});

// ── 토너먼트 (싱글 엘리미네이션) ──────────────────────────────────────────────

describe('generateBracket', () => {
  it('2의 거듭제곱 팀 수는 부전승 없이 생성된다', () => {
    const teams = ['A', 'B', 'C', 'D'];
    const { rounds, bracketSize, byeCount } = generateBracket(teams, 1);
    expect(bracketSize).toBe(4);
    expect(byeCount).toBe(0);
    expect(rounds).toHaveLength(2);
    expect(rounds[0].matches).toHaveLength(2);
    expect(rounds[1].matches).toHaveLength(1);
    expect(rounds[0].matches.every(m => !m.isBye)).toBe(true);
  });

  it('팀 수가 모자라면 부전승으로 채운다', () => {
    const teams = ['A', 'B', 'C', 'D', 'E', 'F'];
    const { rounds, bracketSize, byeCount } = generateBracket(teams, 1);
    expect(bracketSize).toBe(8);
    expect(byeCount).toBe(2);
    const byeMatches = rounds[0].matches.filter(m => m.isBye);
    expect(byeMatches).toHaveLength(2);
    byeMatches.forEach(m => {
      expect(m.away).toBe('BYE');
      expect(m.winner).toBe(m.home);
      expect(m.status).toBe(MATCH_STATUS.BYE);
    });
  });

  it('부전승 승자는 다음 라운드 슬롯에 미리 배정된다', () => {
    const teams = ['A', 'B', 'C', 'D', 'E', 'F'];
    const { rounds } = generateBracket(teams, 1);
    rounds[0].matches.forEach((match, matchIdx) => {
      if (match.isBye) {
        const nextMatch = rounds[1].matches[Math.floor(matchIdx / 2)];
        const slot = matchIdx % 2 === 0 ? 'home' : 'away';
        expect(nextMatch[slot]).toBe(match.winner);
      }
    });
  });

  it('모든 팀이 1라운드에 정확히 한 번씩 등장한다', () => {
    const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const { rounds } = generateBracket(teams, 99);
    const placed = rounds[0].matches
      .flatMap(m => [m.home, m.away])
      .filter(t => t !== null && t !== 'BYE');
    expect(placed.sort()).toEqual([...teams].sort());
  });

  it('라운드 이름이 규칙대로 붙는다', () => {
    const teams = Array.from({ length: 8 }, (_, i) => `팀${i + 1}`);
    const { rounds } = generateBracket(teams, 1);
    expect(rounds.map(r => r.name)).toEqual(['8강', '준결승', '결승']);
  });
});

describe('submitMatchResult', () => {
  const setup = () => generateBracket(['A', 'B', 'C', 'D'], 1).rounds;

  it('점수·승자·상태를 기록한다', () => {
    const rounds = setup();
    const match = rounds[0].matches[0];
    const updated = submitMatchResult(rounds, match.id, 21, 15);
    const done = updated[0].matches[0];
    expect(done.homeScore).toBe(21);
    expect(done.awayScore).toBe(15);
    expect(done.winner).toBe(done.home);
    expect(done.status).toBe(MATCH_STATUS.DONE);
    expect(done.completedAt).toBeTruthy();
  });

  it('어웨이 점수가 높으면 어웨이가 승자다', () => {
    const rounds = setup();
    const updated = submitMatchResult(rounds, 'r1m1', 10, 20);
    expect(updated[0].matches[0].winner).toBe(updated[0].matches[0].away);
  });

  it('승자를 다음 라운드의 올바른 슬롯에 전파한다', () => {
    const rounds = setup();
    let updated = submitMatchResult(rounds, 'r1m1', 21, 15); // matchIdx 0 → home 슬롯
    expect(updated[1].matches[0].home).toBe(updated[0].matches[0].winner);
    updated = submitMatchResult(updated, 'r1m2', 15, 21); // matchIdx 1 → away 슬롯
    expect(updated[1].matches[0].away).toBe(updated[0].matches[1].winner);
  });

  it('결승 결과 입력 시 다음 라운드가 없어도 오류가 없다', () => {
    const rounds = setup();
    let updated = submitMatchResult(rounds, 'r1m1', 21, 15);
    updated = submitMatchResult(updated, 'r1m2', 21, 15);
    updated = submitMatchResult(updated, 'r2m1', 25, 20);
    expect(updated[1].matches[0].winner).toBe(updated[1].matches[0].home);
  });

  it('존재하지 않는 matchId는 변경 없이 복사본을 반환한다', () => {
    const rounds = setup();
    const updated = submitMatchResult(rounds, 'no-such-id', 1, 0);
    expect(updated).not.toBe(rounds);
    expect(updated[0].matches[0].winner).toBeNull();
  });

  it('원본 rounds를 변경하지 않는다 (불변성)', () => {
    const rounds = setup();
    submitMatchResult(rounds, 'r1m1', 21, 15);
    expect(rounds[0].matches[0].homeScore).toBeNull();
    expect(rounds[0].matches[0].winner).toBeNull();
  });

  it('결과 재입력(수정) 시 승자가 갱신된다', () => {
    const rounds = setup();
    let updated = submitMatchResult(rounds, 'r1m1', 21, 15);
    const firstWinner = updated[0].matches[0].winner;
    updated = submitMatchResult(updated, 'r1m1', 10, 30);
    expect(updated[0].matches[0].winner).not.toBe(firstWinner);
    expect(updated[1].matches[0].home).toBe(updated[0].matches[0].winner);
  });
});

// ── 리그전 (풀리그) ───────────────────────────────────────────────────────────

describe('generateLeague', () => {
  it('짝수 팀: n-1라운드, 모든 팀 쌍이 정확히 한 번씩 만난다', () => {
    const teams = ['A', 'B', 'C', 'D'];
    const { rounds, byeCount } = generateLeague(teams);
    expect(rounds).toHaveLength(3);
    expect(byeCount).toBe(0);
    const pairs = rounds
      .flatMap(r => r.matches)
      .map(m => [m.home, m.away].sort().join('-'));
    expect(new Set(pairs).size).toBe(6); // 4C2
    expect(pairs).toHaveLength(6);
  });

  it('홀수 팀: 라운드마다 부전승 1경기가 생기고 byeCount는 1이다', () => {
    const teams = ['A', 'B', 'C', 'D', 'E'];
    const { rounds, byeCount } = generateLeague(teams);
    expect(rounds).toHaveLength(5);
    expect(byeCount).toBe(1);
    rounds.forEach(r => {
      const byes = r.matches.filter(m => m.isBye);
      expect(byes).toHaveLength(1);
      expect(byes[0].away).toBe('BYE');
      expect(byes[0].status).toBe(MATCH_STATUS.BYE);
    });
    // 실제 경기 수 = 5C2 = 10
    const real = rounds.flatMap(r => r.matches).filter(m => !m.isBye);
    expect(real).toHaveLength(10);
  });
});

describe('submitLeagueResult', () => {
  it('승자를 기록하고 원본은 변경하지 않는다', () => {
    const { rounds } = generateLeague(['A', 'B', 'C', 'D']);
    const target = rounds[0].matches[0];
    const updated = submitLeagueResult(rounds, target.id, 30, 20);
    const done = updated[0].matches[0];
    expect(done.winner).toBe(done.home);
    expect(done.status).toBe(MATCH_STATUS.DONE);
    expect(rounds[0].matches[0].winner).toBeNull();
  });

  it('동점이면 승자는 null (무승부)', () => {
    const { rounds } = generateLeague(['A', 'B', 'C', 'D']);
    const updated = submitLeagueResult(rounds, rounds[0].matches[0].id, 10, 10);
    const done = updated[0].matches[0];
    expect(done.winner).toBeNull();
    expect(done.status).toBe(MATCH_STATUS.DONE);
  });
});

describe('calcLeagueStandings', () => {
  it('승 3점·무 1점·패 0점, 승점→득실차→다득점 순으로 정렬한다', () => {
    const teams = ['A', 'B', 'C'];
    const rounds = [
      {
        roundNum: 1,
        name: '1라운드',
        matches: [
          { id: 'm1', home: 'A', away: 'B', homeScore: 20, awayScore: 10, isBye: false, status: MATCH_STATUS.DONE },
          { id: 'm2', home: 'B', away: 'C', homeScore: 15, awayScore: 15, isBye: false, status: MATCH_STATUS.DONE },
          { id: 'm3', home: 'A', away: 'C', homeScore: 25, awayScore: 5, isBye: false, status: MATCH_STATUS.DONE },
        ],
      },
    ];
    const standings = calcLeagueStandings(teams, rounds);
    expect(standings.map(s => s.team)).toEqual(['A', 'B', 'C']);
    expect(standings[0].pts).toBe(6); // 2승
    expect(standings[1].pts).toBe(1); // 1무 1패
    expect(standings[2].pts).toBe(1); // 1무 1패, 득실차에서 밀림
    expect(standings[1].gf - standings[1].ga).toBeGreaterThan(standings[2].gf - standings[2].ga);
  });

  it('부전승·미완료 경기는 집계에서 제외한다', () => {
    const teams = ['A', 'B'];
    const rounds = [
      {
        roundNum: 1,
        name: '1라운드',
        matches: [
          { id: 'm1', home: 'A', away: 'BYE', homeScore: null, awayScore: null, isBye: true, status: MATCH_STATUS.BYE },
          { id: 'm2', home: 'A', away: 'B', homeScore: null, awayScore: null, isBye: false, status: MATCH_STATUS.SCHEDULED },
        ],
      },
    ];
    const standings = calcLeagueStandings(teams, rounds);
    expect(standings.every(s => s.played === 0 && s.pts === 0)).toBe(true);
  });
});

// ── 조별리그 → 토너먼트 ───────────────────────────────────────────────────────

describe('calcGroupConfig', () => {
  it('팀 수에 따라 조 수와 본선 규모를 계산한다', () => {
    expect(calcGroupConfig(8)).toEqual({ groupCount: 2, advancePerGroup: 2, knockoutSize: 4 });
    expect(calcGroupConfig(12)).toEqual({ groupCount: 2, advancePerGroup: 2, knockoutSize: 4 });
    expect(calcGroupConfig(13)).toEqual({ groupCount: 4, advancePerGroup: 2, knockoutSize: 8 });
    expect(calcGroupConfig(24)).toEqual({ groupCount: 4, advancePerGroup: 2, knockoutSize: 8 });
  });
});

describe('generateGroupTournament', () => {
  it('모든 팀이 조에 빠짐없이 배정되고 본선은 비어 있다', () => {
    const teams = Array.from({ length: 8 }, (_, i) => `팀${i + 1}`);
    const result = generateGroupTournament(teams);
    expect(result.groups).toHaveLength(2);
    expect(result.knockout).toBeNull();
    const placed = result.groups.flatMap(g => g.teams);
    expect(placed.sort()).toEqual([...teams].sort());
    expect(result.groups.map(g => g.id)).toEqual(['A', 'B']);
  });

  it('각 조에 라운드로빈 라운드가 생성된다', () => {
    const teams = Array.from({ length: 8 }, (_, i) => `팀${i + 1}`);
    const result = generateGroupTournament(teams);
    result.groups.forEach(g => {
      expect(g.teams).toHaveLength(4);
      expect(g.rounds).toHaveLength(3); // 4팀 → 3라운드
      const pairs = g.rounds.flatMap(r => r.matches).map(m => [m.home, m.away].sort().join('-'));
      expect(new Set(pairs).size).toBe(6);
    });
  });
});

// 조별리그 진행 헬퍼: 모든 조별 경기를 홈 승으로 완료
function playAllGroupMatches(tournament) {
  let t = tournament;
  const ids = t.bracket.groups.flatMap(g =>
    g.rounds.flatMap(r => r.matches.filter(m => !m.isBye).map(m => m.id))
  );
  ids.forEach((id, i) => {
    t = submitGroupTournamentResult(t, id, 20 + i, 10); // 홈팀 승
  });
  return t;
}

function makeGroupTournament(teamCount = 8) {
  const teams = Array.from({ length: teamCount }, (_, i) => `팀${i + 1}`);
  const bracket = generateGroupTournament(teams);
  return {
    meta: { id: 'test', gameFormat: 'group_tournament', advancePerGroup: bracket.advancePerGroup, phase: 'group' },
    teams,
    bracket: { groups: bracket.groups, knockout: null },
  };
}

describe('isGroupStageComplete / buildKnockoutFromGroups', () => {
  it('조별리그가 끝나기 전에는 미완료, 끝나면 완료다', () => {
    const t = makeGroupTournament(8);
    expect(isGroupStageComplete(t.bracket.groups)).toBe(false);
    const done = playAllGroupMatches(t);
    expect(isGroupStageComplete(done.bracket.groups)).toBe(true);
  });

  it('각 조 상위 2팀이 크로스 시드로 본선에 진출한다 (A1-B2, B1-A2)', () => {
    const t = playAllGroupMatches(makeGroupTournament(8));
    const knockout = t.bracket.knockout;
    expect(knockout).not.toBeNull();
    expect(knockout.rounds[0].matches).toHaveLength(2);

    const standingsA = calcLeagueStandings(t.bracket.groups[0].teams, t.bracket.groups[0].rounds);
    const standingsB = calcLeagueStandings(t.bracket.groups[1].teams, t.bracket.groups[1].rounds);
    const [m1, m2] = knockout.rounds[0].matches;
    expect(m1.home).toBe(standingsA[0].team); // A조 1위
    expect(m1.away).toBe(standingsB[1].team); // B조 2위
    expect(m2.home).toBe(standingsB[0].team); // B조 1위
    expect(m2.away).toBe(standingsA[1].team); // A조 2위
  });
});

describe('submitGroupTournamentResult', () => {
  it('조별 경기 결과를 기록하고 phase를 유지한다', () => {
    const t = makeGroupTournament(8);
    const firstId = t.bracket.groups[0].rounds[0].matches[0].id;
    const updated = submitGroupTournamentResult(t, firstId, 20, 10);
    const match = updated.bracket.groups[0].rounds[0].matches[0];
    expect(match.status).toBe(MATCH_STATUS.DONE);
    expect(match.winner).toBe(match.home);
    expect(updated.meta.phase).toBe('group');
    expect(updated.bracket.knockout).toBeNull();
  });

  it('마지막 조별 경기 완료 시 본선이 자동 생성되고 phase가 knockout이 된다', () => {
    const t = playAllGroupMatches(makeGroupTournament(8));
    expect(t.meta.phase).toBe('knockout');
    expect(t.bracket.knockout.rounds.map(r => r.name)).toEqual(['준결승', '결승']);
  });

  it('본선 경기 결과는 승자를 다음 라운드로 전파한다', () => {
    let t = playAllGroupMatches(makeGroupTournament(8));
    t = submitGroupTournamentResult(t, 'kr1m1', 30, 20);
    const semi = t.bracket.knockout.rounds[0].matches[0];
    const final = t.bracket.knockout.rounds[1].matches[0];
    expect(final.home).toBe(semi.winner);
  });

  it('원본 tournament를 변경하지 않는다 (불변성)', () => {
    const t = makeGroupTournament(8);
    const firstId = t.bracket.groups[0].rounds[0].matches[0].id;
    submitGroupTournamentResult(t, firstId, 20, 10);
    expect(t.bracket.groups[0].rounds[0].matches[0].status).not.toBe(MATCH_STATUS.DONE);
  });
});

describe('editGroupTournamentResult', () => {
  it('조별 경기 수정 시 해당 경기를 초기화하고 본선을 무효화한다', () => {
    const t = playAllGroupMatches(makeGroupTournament(8));
    const anyGroupMatchId = t.bracket.groups[0].rounds[0].matches[0].id;
    const edited = editGroupTournamentResult(t, anyGroupMatchId);
    const match = edited.bracket.groups[0].rounds[0].matches[0];
    expect(match.status).toBe(MATCH_STATUS.SCHEDULED);
    expect(match.winner).toBeNull();
    expect(edited.bracket.knockout).toBeNull();
    expect(edited.meta.phase).toBe('group');
  });

  it('본선 경기 수정 시 다음 라운드에 전파된 슬롯도 비운다', () => {
    let t = playAllGroupMatches(makeGroupTournament(8));
    t = submitGroupTournamentResult(t, 'kr1m1', 30, 20);
    const edited = editGroupTournamentResult(t, 'kr1m1');
    const semi = edited.bracket.knockout.rounds[0].matches[0];
    const final = edited.bracket.knockout.rounds[1].matches[0];
    expect(semi.status).toBe(MATCH_STATUS.SCHEDULED);
    expect(semi.winner).toBeNull();
    expect(final.home).toBeNull();
  });

  it('존재하지 않는 matchId는 원본을 그대로 반환한다', () => {
    const t = makeGroupTournament(8);
    expect(editGroupTournamentResult(t, 'no-such-id')).toBe(t);
  });
});

// ── 수동 배정 (manual placement) ──────────────────────────────────────────────

describe('수동 배정', () => {
  it('generateBracket ordered 옵션은 추첨 없이 입력 순서를 유지한다', () => {
    const teams = ['1번팀', '2번팀', '3번팀', '4번팀'];
    const { rounds } = generateBracket(teams, 12345, { ordered: true });
    const m = rounds[0].matches;
    expect(m[0].home).toBe('1번팀');
    expect(m[0].away).toBe('2번팀');
    expect(m[1].home).toBe('3번팀');
    expect(m[1].away).toBe('4번팀');
  });

  it('ordered + 부전승: 부전승 배치 규칙에 따라 순서대로 채운다', () => {
    // 6팀 → 8강, 부전승 2개는 짝수 위치(0, 2)에 배치
    const teams = ['t1', 't2', 't3', 't4', 't5', 't6'];
    const { rounds, byeCount } = generateBracket(teams, 1, { ordered: true });
    expect(byeCount).toBe(2);
    const m = rounds[0].matches;
    expect([m[0].home, m[0].away]).toEqual(['t1', 'BYE']);
    expect([m[1].home, m[1].away]).toEqual(['t2', 't3']);
    expect([m[2].home, m[2].away]).toEqual(['t4', 'BYE']);
    expect([m[3].home, m[3].away]).toEqual(['t5', 't6']);
  });

  it('generateGroupTournament manualGroups는 지정한 조 편성을 그대로 사용한다', () => {
    const manualGroups = [['a', 'b', 'c'], ['d', 'e', 'f', 'g']];
    const teams = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const res = generateGroupTournament(teams, { manualGroups });
    expect(res.groupCount).toBe(2);
    expect(res.knockoutSize).toBe(4);
    expect(res.groups[0].id).toBe('A');
    expect(res.groups[0].teams).toEqual(['a', 'b', 'c']);
    expect(res.groups[1].teams).toEqual(['d', 'e', 'f', 'g']);
    // 조별 라운드로빈이 정상 생성됐는지 (3팀 조 → 3라운드, 각 라운드 부전승 1)
    expect(res.groups[0].rounds).toHaveLength(3);
  });

  it('rebuildGroupStage는 조 편성을 유지하고 경기 결과만 초기화한다', () => {
    const manualGroups = [['a', 'b'], ['c', 'd']];
    const res = generateGroupTournament(['a', 'b', 'c', 'd'], { manualGroups });
    // 결과가 입력된 상태를 흉내
    const played = res.groups.map(g => ({
      ...g,
      rounds: g.rounds.map(r => ({
        ...r,
        matches: r.matches.map(m => ({ ...m, homeScore: 10, awayScore: 5, winner: m.home, status: MATCH_STATUS.DONE })),
      })),
    }));
    const rebuilt = rebuildGroupStage(played);
    expect(rebuilt.map(g => g.teams)).toEqual([['a', 'b'], ['c', 'd']]);
    rebuilt.forEach(g => g.rounds.forEach(r => r.matches.forEach(m => {
      expect(m.homeScore).toBeNull();
      expect(m.status === MATCH_STATUS.SCHEDULED || m.status === MATCH_STATUS.BYE).toBe(true);
    })));
  });
});

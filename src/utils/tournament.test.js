import { describe, it, expect } from 'vitest';
import {
  nextPowerOfTwo,
  getRoundName,
  distributeByes,
  generateBracket,
  submitMatchResult,
} from './tournament';
import { fisherYatesShuffle } from './shuffle';
import { MATCH_STATUS } from '../constants';

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

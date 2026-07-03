import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  encodeTournament,
  decodeTournament,
  buildShareUrl,
  readShareParam,
} from './shareUtils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('encodeTournament / decodeTournament', () => {
  it('인코딩 → 디코딩 왕복 시 원본과 동일하다', () => {
    const data = {
      meta: { id: 'tournament_1', schoolLevel: '중등', sport: '농구', totalTeams: 4 },
      teams: ['한밭중', '유성중', '갑천중', '도안중'],
      bracket: { rounds: [] },
    };
    const encoded = encodeTournament(data);
    expect(typeof encoded).toBe('string');
    expect(decodeTournament(encoded)).toEqual(data);
  });

  it('인코딩 결과는 URL에 안전한 문자만 포함한다', () => {
    const encoded = encodeTournament({ teams: ['한글 팀 이름 & 특수문자?'] });
    expect(encoded).toMatch(/^[A-Za-z0-9+$\-_.!*'()]+$/);
  });

  it('깨진 문자열을 디코딩하면 null을 반환한다', () => {
    expect(decodeTournament('%%%not-valid%%%')).toBeNull();
    expect(decodeTournament('')).toBeNull();
  });

  it('순환 참조 등 직렬화 불가 데이터는 null을 반환한다', () => {
    const cyclic = {};
    cyclic.self = cyclic;
    expect(encodeTournament(cyclic)).toBeNull();
  });
});

describe('buildShareUrl / readShareParam', () => {
  it('현재 경로에 ?t= 파라미터를 붙인 공유 URL을 만든다', () => {
    vi.stubGlobal('location', {
      origin: 'https://kimjs99.github.io',
      pathname: '/sports-bracket2/',
      search: '',
      href: 'https://kimjs99.github.io/sports-bracket2/',
    });
    const url = buildShareUrl({ meta: { id: 't1' } });
    expect(url.startsWith('https://kimjs99.github.io/sports-bracket2/?t=')).toBe(true);
  });

  it('공유 URL의 ?t= 파라미터를 다시 읽으면 원본 데이터가 복원된다', () => {
    const data = { meta: { id: 't1' }, teams: ['A', 'B'] };
    const encoded = encodeTournament(data);
    vi.stubGlobal('location', { search: `?t=${encoded}` });
    expect(readShareParam()).toEqual(data);
  });

  it('?t= 파라미터가 없으면 null을 반환한다', () => {
    vi.stubGlobal('location', { search: '' });
    expect(readShareParam()).toBeNull();
  });
});

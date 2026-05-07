export const SCHOOL_LEVELS = ['초등', '중등', '고등'];
export const GENDER_TYPES = ['남성', '여성', '혼성'];
export const SPORT_NAME = '농구'; // legacy
export const STORAGE_KEY = 'school_tournament_data';

export const SPORTS = [
  '농구', '축구', '배구', '풋살', '핸드볼',
  '배드민턴', '탁구', '넷볼', '킨볼', '족구',
  '피구', '연식야구', '티볼', '플로어볼', '육상',
  '줄넘기', '치어리딩', '스포츠스태킹', '플라잉디스크',
  '보치아', '슐런', '기타',
];

export const SPORT_EMOJI = {
  '농구': '🏀', '축구': '⚽', '배구': '🏐',
  '풋살': '⚽', '핸드볼': '🤾', '배드민턴': '🏸',
  '탁구': '🏓', '넷볼': '🥅', '킨볼': '🔵',
  '족구': '🦶', '피구': '🔴', '연식야구': '⚾',
  '티볼': '🏏', '플로어볼': '🏑', '육상': '🏃',
  '줄넘기': '🪢', '치어리딩': '📣', '스포츠스태킹': '🥤',
  '플라잉디스크': '🥏', '보치아': '🎯', '슐런': '🎳',
  '기타': '🏅',
};

export const GAME_FORMATS = [
  { id: 'tournament', label: '토너먼트', desc: '단판 승부 · 진 팀 탈락' },
  { id: 'league',     label: '리그전',   desc: '전팀 맞대결 · 승점 누적' },
  { id: 'link',       label: '링크전',   desc: '조별리그 후 토너먼트 (준비 중)' },
];

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  BYE: 'bye',
  DONE: 'done',
};

export const SCREENS = {
  HOME: 'home',
  SETUP: 'setup',
  DRAW: 'draw',
  MATCH_PLAY: 'matchplay',
  DASHBOARD: 'dashboard',
};

export const MIN_TEAMS = 2;
export const MAX_TEAMS = 64;
export const MAX_TEAM_NAME_LENGTH = 20;
export const MAX_HISTORY = 10;

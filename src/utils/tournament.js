import { fisherYatesShuffle } from './shuffle';
import { MATCH_STATUS } from '../constants';

export function nextPowerOfTwo(n) {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

export function getRoundName(bracketSize, roundNum) {
  const matchCount = bracketSize / Math.pow(2, roundNum);
  const map = { 1: '결승', 2: '준결승', 4: '8강', 8: '16강', 16: '32강', 32: '64강' };
  return map[matchCount] ?? `${matchCount}강`;
}

// Returns pair indices (0-based) where the 'away' slot should be BYE.
// Interleaved distribution: byes at even positions (0, 2, 4, ...)
// so each Round-2 group has at most 1 bye → bye team sits "between" rounds.
export function distributeByes(bracketSize, byeCount) {
  if (byeCount === 0) return [];
  const totalPairs = bracketSize / 2;
  const positions = [];

  // Fill even positions first (0, 2, 4, ...)
  for (let i = 0; i < totalPairs && positions.length < byeCount; i += 2) {
    positions.push(i);
  }

  // If still need more, fill remaining odd positions from the end
  for (let j = totalPairs - (totalPairs % 2 === 0 ? 1 : 2); j >= 0 && positions.length < byeCount; j -= 2) {
    if (!positions.includes(j)) positions.push(j);
  }

  return positions.sort((a, b) => a - b);
}

function buildFirstRoundMatches(shuffledTeams, byePairIndices, bracketSize, roundName) {
  const totalPairs = bracketSize / 2;
  const byeSet = new Set(byePairIndices);
  const matches = [];
  let teamCursor = 0;

  for (let pairIdx = 0; pairIdx < totalPairs; pairIdx++) {
    const isBye = byeSet.has(pairIdx);
    const home = shuffledTeams[teamCursor++] ?? null;
    const away = isBye ? 'BYE' : (shuffledTeams[teamCursor++] ?? null);

    const winner = isBye ? home : null;
    matches.push({
      id: `r1m${pairIdx + 1}`,
      home,
      away,
      homeScore: null,
      awayScore: null,
      winner,
      isBye,
      date: null,
      time: null,
      venue: null,
      status: isBye ? MATCH_STATUS.BYE : MATCH_STATUS.SCHEDULED,
    });
  }
  return matches;
}

function buildAllRounds(firstRoundMatches, bracketSize) {
  const rounds = [];
  const totalRounds = Math.log2(bracketSize);

  rounds.push({
    roundNum: 1,
    name: getRoundName(bracketSize, 1),
    matches: firstRoundMatches,
  });

  for (let r = 2; r <= totalRounds; r++) {
    const matchCount = bracketSize / Math.pow(2, r);
    const matches = [];
    for (let m = 0; m < matchCount; m++) {
      matches.push({
        id: `r${r}m${m + 1}`,
        home: null,
        away: null,
        homeScore: null,
        awayScore: null,
        winner: null,
        isBye: false,
        date: null,
        time: null,
        venue: null,
        status: MATCH_STATUS.SCHEDULED,
      });
    }
    rounds.push({ roundNum: r, name: getRoundName(bracketSize, r), matches });
  }

  // Propagate BYE winners across all rounds
  for (let rIdx = 0; rIdx < rounds.length - 1; rIdx++) {
    const current = rounds[rIdx];
    const next = rounds[rIdx + 1];
    current.matches.forEach((match, matchIdx) => {
      if (match.isBye && match.winner) {
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const slot = matchIdx % 2 === 0 ? 'home' : 'away';
        if (next.matches[nextMatchIdx]) {
          next.matches[nextMatchIdx][slot] = match.winner;
        }
      }
    });
  }

  return rounds;
}

export function generateBracket(teams, seed) {
  const bracketSize = nextPowerOfTwo(teams.length);
  const byeCount = bracketSize - teams.length;
  const shuffled = fisherYatesShuffle(teams, seed);
  const byePairIndices = distributeByes(bracketSize, byeCount);
  const firstRound = buildFirstRoundMatches(shuffled, byePairIndices, bracketSize);
  const rounds = buildAllRounds(firstRound, bracketSize);

  return { rounds, bracketSize, byeCount };
}

// ── League (round-robin) ──────────────────────────────────────────────────────

export function generateLeague(teams) {
  const ts = [...teams];
  if (ts.length % 2 !== 0) ts.push(null); // null = bye dummy
  const size = ts.length;
  const numRounds = size - 1;
  const rounds = [];

  for (let r = 0; r < numRounds; r++) {
    const matches = [];
    for (let m = 0; m < size / 2; m++) {
      const home = ts[m];
      const away = ts[size - 1 - m];
      const isBye = home === null || away === null;
      matches.push({
        id: `r${r + 1}m${m + 1}`,
        home: isBye ? (home ?? away) : home,
        away: isBye ? 'BYE' : away,
        homeScore: null,
        awayScore: null,
        winner: isBye ? (home ?? away) : null,
        isBye,
        date: null, time: null, venue: null,
        status: isBye ? MATCH_STATUS.BYE : MATCH_STATUS.SCHEDULED,
      });
    }
    rounds.push({ roundNum: r + 1, name: `${r + 1}라운드`, matches });
    // Rotate ts[1..size-1] clockwise: last element moves to index 1
    const last = ts.splice(size - 1, 1)[0];
    ts.splice(1, 0, last);
  }

  return { rounds, bracketSize: teams.length, byeCount: teams.length % 2 !== 0 ? 1 : 0 };
}

export function submitLeagueResult(bracketRounds, matchId, homeScore, awayScore) {
  const rounds = bracketRounds.map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) }));
  for (const round of rounds) {
    const match = round.matches.find(m => m.id === matchId);
    if (match) {
      match.homeScore = homeScore;
      match.awayScore = awayScore;
      match.winner = homeScore !== awayScore ? (homeScore > awayScore ? match.home : match.away) : null;
      match.status = MATCH_STATUS.DONE;
      match.completedAt = new Date().toISOString();
      break;
    }
  }
  return rounds;
}

export function calcLeagueStandings(teams, rounds) {
  const stats = Object.fromEntries(
    teams.map(t => [t, { team: t, played: 0, win: 0, draw: 0, loss: 0, gf: 0, ga: 0, pts: 0 }])
  );
  for (const round of rounds) {
    for (const m of round.matches) {
      if (m.isBye || m.status !== MATCH_STATUS.DONE) continue;
      const h = stats[m.home]; const a = stats[m.away];
      if (!h || !a) continue;
      h.played++; a.played++;
      h.gf += m.homeScore ?? 0; h.ga += m.awayScore ?? 0;
      a.gf += m.awayScore ?? 0; a.ga += m.homeScore ?? 0;
      if (m.homeScore > m.awayScore)      { h.win++; h.pts += 3; a.loss++; }
      else if (m.homeScore < m.awayScore) { a.win++; a.pts += 3; h.loss++; }
      else                                { h.draw++; h.pts += 1; a.draw++; a.pts += 1; }
    }
  }
  return Object.values(stats).sort(
    (a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf
  );
}

// ── Tournament (single elimination) ──────────────────────────────────────────

export function submitMatchResult(bracketRounds, matchId, homeScore, awayScore) {
  const rounds = bracketRounds.map(r => ({
    ...r,
    matches: r.matches.map(m => ({ ...m })),
  }));

  let foundRoundIdx = -1;
  let foundMatchIdx = -1;

  for (let ri = 0; ri < rounds.length; ri++) {
    const mi = rounds[ri].matches.findIndex(m => m.id === matchId);
    if (mi !== -1) {
      foundRoundIdx = ri;
      foundMatchIdx = mi;
      break;
    }
  }

  if (foundRoundIdx === -1) return rounds;

  const match = rounds[foundRoundIdx].matches[foundMatchIdx];
  match.homeScore = homeScore;
  match.awayScore = awayScore;
  match.winner = homeScore > awayScore ? match.home : match.away;
  match.status = MATCH_STATUS.DONE;
  match.completedAt = new Date().toISOString();

  // Propagate winner to next round
  const nextRound = rounds[foundRoundIdx + 1];
  if (nextRound) {
    const nextMatchIdx = Math.floor(foundMatchIdx / 2);
    const slot = foundMatchIdx % 2 === 0 ? 'home' : 'away';
    if (nextRound.matches[nextMatchIdx]) {
      nextRound.matches[nextMatchIdx][slot] = match.winner;
    }
  }

  return rounds;
}

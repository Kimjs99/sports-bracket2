import { useState, useMemo } from 'react';
import {
  Trophy, ArrowLeft, Layers, Swords, Users, ChevronRight, Lock,
} from 'lucide-react';
import { SCHOOL_LEVELS, SPORT_EMOJI, MATCH_STATUS } from '../constants';
import { makeSummary } from '../store/reducer';
import { calcLeagueStandings } from '../utils/tournament';
import BracketTree from './ui/BracketTree';

const LEVEL_COLORS = {
  '초등': {
    badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    activeTab: 'border-orange-500 text-orange-600 dark:text-orange-400 dark:border-orange-400',
    dot: 'bg-orange-400',
  },
  '중등': {
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    activeTab: 'border-green-600 text-green-600 dark:text-green-400 dark:border-green-400',
    dot: 'bg-green-500',
  },
  '고등': {
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    activeTab: 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400',
    dot: 'bg-blue-500',
  },
};

// ─── Group standings for league/group_tournament ───────────────────────────────

function GroupCard({ group, advancePerGroup }) {
  const standings = calcLeagueStandings(group.teams, group.rounds);
  const completedMatches = group.rounds
    .flatMap(r => r.matches.map(m => ({ ...m, roundName: r.name })))
    .filter(m => m.status === MATCH_STATUS.DONE && !m.isBye);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
        <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{group.name}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">{group.teams.length}팀</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500">
              <th className="px-3 py-1.5 text-left font-medium">팀</th>
              <th className="px-2 py-1.5 text-center font-medium">승</th>
              <th className="px-2 py-1.5 text-center font-medium">무</th>
              <th className="px-2 py-1.5 text-center font-medium">패</th>
              <th className="px-2 py-1.5 text-center font-medium">득실</th>
              <th className="px-2 py-1.5 text-center font-medium">승점</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.team} className={`border-b border-gray-50 dark:border-gray-700 last:border-0 ${i < advancePerGroup ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                  {i < advancePerGroup && <span className="inline-block w-4 text-blue-500 font-bold">{i + 1}</span>}
                  {i >= advancePerGroup && <span className="inline-block w-4 text-gray-400">{i + 1}</span>}
                  {row.team}
                </td>
                <td className="px-2 py-2 text-center text-gray-700 dark:text-gray-300">{row.win}</td>
                <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">{row.draw}</td>
                <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">{row.loss}</td>
                <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">
                  {row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}
                </td>
                <td className="px-2 py-2 text-center font-bold text-blue-600 dark:text-blue-400">{row.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {completedMatches.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50">
          {completedMatches.map(m => (
            <div key={m.id} className="px-3 py-2 flex items-center justify-between text-xs">
              <span className={`flex-1 text-right font-medium truncate ${m.winner === m.home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{m.home}</span>
              <span className="mx-2 font-bold text-gray-700 dark:text-gray-200 shrink-0 tabular-nums">{m.homeScore} : {m.awayScore}</span>
              <span className={`flex-1 font-medium truncate ${m.winner === m.away ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{m.away}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Per-tournament detail view ────────────────────────────────────────────────

function GuestTournamentView({ tournament, onBack }) {
  const { meta, bracket, teams } = tournament;
  const isGroup = meta.gameFormat === 'group_tournament';
  const isLeague = meta.gameFormat === 'league';
  const summary = makeSummary(tournament);
  const [tab, setTab] = useState('bracket');

  const genderLabel = meta.gender && meta.gender !== '혼성' ? `${meta.gender} ` : '';
  const formatLabel = isGroup ? '조별리그' : isLeague ? '리그전' : '토너먼트';
  const rounds = isGroup ? [] : (bracket.rounds ?? []);
  const doneMatches = isGroup
    ? bracket.groups.flatMap(g => g.rounds.flatMap(r => r.matches)).filter(m => m.status === MATCH_STATUS.DONE && !m.isBye)
    : rounds.flatMap(r => r.matches.filter(m => m.status === MATCH_STATUS.DONE && !m.isBye));

  const leagueStandings = isLeague ? calcLeagueStandings(teams, rounds) : null;

  return (
    <div>
      <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
            <ArrowLeft size={13} /> 종목 목록으로
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-bold text-gray-900 dark:text-gray-100">
            {SPORT_EMOJI[meta.sport] ?? '🏅'} {genderLabel}{meta.sport} {formatLabel}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {meta.schoolLevel}부 · {meta.totalTeams}팀
          </p>
          {summary.winner && (
            <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
              <Trophy size={13} className="text-amber-500 flex-shrink-0" />
              <span className="font-bold text-amber-800 dark:text-amber-300 text-sm">{summary.winner} 우승</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {[
            { id: 'bracket', label: isGroup ? '조별 현황' : isLeague ? '순위표' : '대진표' },
            { id: 'feed', label: `결과 피드 (${doneMatches.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${tab === t.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {tab === 'bracket' && (
          isGroup ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bracket.groups.map(g => (
                  <GroupCard key={g.id} group={g} advancePerGroup={meta.advancePerGroup ?? 2} />
                ))}
              </div>
              {bracket.knockout ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    <Trophy size={13} className="text-amber-500" />
                    <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{meta.knockoutSize}강 본선 대진</span>
                  </div>
                  <BracketTree rounds={bracket.knockout.rounds} />
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                  <Layers size={14} className="shrink-0" />
                  조별 리그 진행 중 — 모든 경기 완료 후 {meta.knockoutSize}강 대진이 자동 생성됩니다.
                </div>
              )}
            </div>
          ) : isLeague ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50">
                    <th className="px-4 py-2.5 text-left font-medium">팀</th>
                    <th className="px-3 py-2.5 text-center font-medium">승</th>
                    <th className="px-3 py-2.5 text-center font-medium">무</th>
                    <th className="px-3 py-2.5 text-center font-medium">패</th>
                    <th className="px-3 py-2.5 text-center font-medium">득실</th>
                    <th className="px-3 py-2.5 text-center font-medium">승점</th>
                  </tr>
                </thead>
                <tbody>
                  {leagueStandings.map((row, i) => (
                    <tr key={row.team} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-5">{i + 1}</span> {row.team}
                      </td>
                      <td className="px-3 py-3 text-center text-gray-700 dark:text-gray-300">{row.win}</td>
                      <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400">{row.draw}</td>
                      <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400">{row.loss}</td>
                      <td className="px-3 py-3 text-center text-gray-500 dark:text-gray-400">{row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}</td>
                      <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400">{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <BracketTree rounds={rounds} />
            </div>
          )
        )}

        {tab === 'feed' && (
          <div className="space-y-3">
            {doneMatches.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Swords size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">완료된 경기가 없습니다</p>
              </div>
            ) : (
              doneMatches.map(m => (
                <div key={m.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${m.winner === m.home ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {m.home}{m.winner === m.home && <Trophy size={12} className="inline ml-1 text-orange-400" />}
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-base mx-3 tabular-nums">{m.homeScore} : {m.awayScore}</span>
                    <span className={`font-semibold text-sm ${m.winner === m.away ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {m.winner === m.away && <Trophy size={12} className="inline mr-1 text-orange-400" />}{m.away}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sport card in the overview grid ──────────────────────────────────────────

function SportCard({ group, onSelect }) {
  const latest = group.items[0];
  const summary = makeSummary(latest);
  const count = group.items.length;
  const isOver = !!summary.winner;
  const isInProgress = !isOver && summary.doneCount > 0;
  const pct = summary.totalNonBye > 0 ? Math.round((summary.doneCount / summary.totalNonBye) * 100) : 0;
  const genderLabel = group.gender !== '혼성' ? ` ${group.gender}` : '';
  const formatLabel = summary.gameFormat === 'league' ? '리그' : summary.gameFormat === 'group_tournament' ? '조별리그' : '토너먼트';

  return (
    <button onClick={() => onSelect(latest)}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-left shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-2xl mb-1">{SPORT_EMOJI[group.sport] ?? '🏅'}</div>
          <div className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">
            {group.sport}{genderLabel}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {summary.totalTeams}팀 · {formatLabel}{count > 1 ? ` · ${count}차 대진` : ''}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isOver ? (
            <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Trophy size={9} /> 종료
            </span>
          ) : isInProgress ? (
            <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
              진행중
            </span>
          ) : (
            <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
              대기중
            </span>
          )}
          <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>

      {isOver ? (
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
          <Trophy size={10} /> 우승: {summary.winner}
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
            <span>진행률</span>
            <span>{pct}% ({summary.doneCount}/{summary.totalNonBye})</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}

// ─── GuestView (root) ─────────────────────────────────────────────────────────

export default function GuestView({ org, tournaments }) {
  const [activeLevel, setActiveLevel] = useState(() => {
    const found = ['고등', '중등', '초등'].find(lv =>
      tournaments.some(t => t.meta.schoolLevel === lv)
    );
    return found ?? '고등';
  });
  const [selectedTournament, setSelectedTournament] = useState(null);

  const levelTournaments = useMemo(() =>
    tournaments
      .filter(t => t.meta.schoolLevel === activeLevel)
      .sort((a, b) => b.meta.createdAt?.localeCompare(a.meta.createdAt ?? '') ?? 0),
    [tournaments, activeLevel]
  );

  const sportGroups = useMemo(() => {
    const map = new Map();
    levelTournaments.forEach(t => {
      const key = `${t.meta.sport}__${t.meta.gender ?? '혼성'}`;
      if (!map.has(key)) map.set(key, { key, sport: t.meta.sport, gender: t.meta.gender ?? '혼성', items: [] });
      map.get(key).items.push(t);
    });
    return [...map.values()];
  }, [levelTournaments]);

  function goAdmin() {
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    window.location.href = url.toString();
  }

  if (selectedTournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <GuestTournamentView tournament={selectedTournament} onBack={() => setSelectedTournament(null)} />
        <footer className="text-center text-[11px] text-gray-400 dark:text-gray-600 py-4 pb-6">
          © 2026 kimjs · 학교스포츠클럽 대진관리
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏀</span>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">{org.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">학교스포츠클럽 대진 현황</p>
            </div>
          </div>
          <button
            onClick={goAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Lock size={12} /> 관리자
          </button>
        </div>

        {/* Level tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-0">
          {SCHOOL_LEVELS.map(level => {
            const hasData = tournaments.some(t => t.meta.schoolLevel === level);
            const colors = LEVEL_COLORS[level];
            return (
              <button key={level} onClick={() => setActiveLevel(level)}
                className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5
                  ${activeLevel === level ? colors.activeTab : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                {level}부
                {hasData && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        {sportGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="text-5xl opacity-30">🏀</div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">{activeLevel}부 대진이 없습니다</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sportGroups.map(group => (
              <SportCard
                key={group.key}
                group={group}
                onSelect={t => setSelectedTournament(t)}
              />
            ))}
          </div>
        )}
      </div>

      <footer className="text-center text-[11px] text-gray-400 dark:text-gray-600 py-4 pb-6 select-none">
        © 2026 kimjs · 학교스포츠클럽 대진관리
      </footer>
    </div>
  );
}

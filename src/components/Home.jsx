import { useContext, useState, useEffect, useMemo } from 'react';
import {
  Plus, Trophy, Lock, Settings, Swords, CalendarDays,
  Users, Layers, Bell, Search, MapPin, Clock, Trash2, HelpCircle,
  Share2, Check, LinkIcon, RotateCcw, AlertTriangle, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { AppContext } from '../App';
import { ACTIONS } from '../store/actions';
import { SCREENS, MATCH_STATUS, SPORT_EMOJI } from '../constants';
import { useAdmin } from '../contexts/AdminContext';
import { loadTournament, saveTournament } from '../utils/storage';
import { generateBracket, generateGroupTournament, calcLeagueStandings } from '../utils/tournament';
import BracketTree from './ui/BracketTree';
import HelpModal from './ui/HelpModal';
import ConfirmDialog from './ui/ConfirmDialog';
import { buildShareUrl } from '../utils/shareUtils';

const LEVELS = ['초등', '중등', '고등'];
const LEVEL_COLOR = {
  '초등': { badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300', activeTab: 'border-orange-500 text-orange-600 dark:text-orange-400 dark:border-orange-400', dot: 'bg-orange-400' },
  '중등': { badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300', activeTab: 'border-green-600 text-green-600 dark:text-green-400 dark:border-green-400', dot: 'bg-green-500' },
  '고등': { badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300', activeTab: 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400', dot: 'bg-blue-500' },
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function getFinalRankings(rounds) {
  if (!rounds || rounds.length === 0) return { winner: null, runnerUp: null, third: null, fourth: null };
  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound?.matches[0];
  const winner = finalMatch?.winner ?? null;
  const runnerUp = finalMatch ? (finalMatch.winner === finalMatch.home ? finalMatch.away : finalMatch.home) : null;
  let third = null, fourth = null;
  if (rounds.length >= 2) {
    const semiLosers = rounds[rounds.length - 2]?.matches
      .filter(m => m.status === MATCH_STATUS.DONE && m.winner)
      .map(m => (m.winner === m.home ? m.away : m.home));
    if (semiLosers?.length >= 1) third = semiLosers[0];
    if (semiLosers?.length >= 2) fourth = semiLosers[1];
  }
  return { winner, runnerUp, third, fourth };
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
  };
  return (
    <div className={`rounded-xl p-3 text-center ${colors[color]}`}>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs mt-0.5 opacity-75">{label}</div>
    </div>
  );
}

// ─── GroupDashboardView ────────────────────────────────────────────────────────

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

      {/* Standings */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500">
              <th className="px-3 py-1.5 text-left font-medium">팀</th>
              <th className="px-2 py-1.5 text-center font-medium">경기</th>
              <th className="px-2 py-1.5 text-center font-medium">승</th>
              <th className="px-2 py-1.5 text-center font-medium">무</th>
              <th className="px-2 py-1.5 text-center font-medium">패</th>
              <th className="px-2 py-1.5 text-center font-medium">득실</th>
              <th className="px-2 py-1.5 text-center font-medium text-blue-600 dark:text-blue-400">승점</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => {
              const isAdvancing = i < advancePerGroup;
              return (
                <tr key={row.team}
                  className={`border-b border-gray-50 dark:border-gray-700/50 last:border-0
                    ${isAdvancing ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                  <td className="px-3 py-2 font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    {isAdvancing && <span className="text-blue-500 text-[10px] font-bold">▲</span>}
                    <span className="truncate max-w-[80px]">{row.team}</span>
                  </td>
                  <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">{row.played}</td>
                  <td className="px-2 py-2 text-center text-gray-700 dark:text-gray-300">{row.win}</td>
                  <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">{row.draw}</td>
                  <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">{row.loss}</td>
                  <td className="px-2 py-2 text-center text-gray-500 dark:text-gray-400">
                    {row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-blue-600 dark:text-blue-400">{row.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Completed match results */}
      {completedMatches.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700/50">
          {completedMatches.map(m => (
            <div key={m.id} className="px-3 py-2 flex items-center justify-between text-xs">
              <span className={`flex-1 text-right font-medium truncate ${m.winner === m.home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {m.home}
              </span>
              <span className="mx-2 font-bold text-gray-700 dark:text-gray-200 shrink-0 tabular-nums">
                {m.homeScore} : {m.awayScore}
              </span>
              <span className={`flex-1 font-medium truncate ${m.winner === m.away ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {m.away}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupDashboardView({ bracket, meta }) {
  const { groups, knockout } = bracket;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {groups.map(g => (
          <GroupCard key={g.id} group={g} advancePerGroup={meta.advancePerGroup ?? 2} />
        ))}
      </div>
      {knockout && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Trophy size={13} className="text-amber-500" />
            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{meta.knockoutSize}강 본선 대진</span>
          </div>
          <BracketTree rounds={knockout.rounds} />
        </div>
      )}
      {!knockout && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          <Layers size={14} className="shrink-0" />
          조별 리그 진행 중 — 모든 경기 완료 후 {meta.knockoutSize}강 대진이 자동 생성됩니다.
        </div>
      )}
    </div>
  );
}

// ─── SchoolScheduleTab ─────────────────────────────────────────────────────────

function SchoolScheduleTab({ rounds, teams }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');

  const suggestions = query.trim()
    ? teams.filter(t => t.toLowerCase().includes(query.toLowerCase()) && t !== selected)
    : [];

  const teamMatches = selected
    ? rounds.flatMap(r =>
        r.matches
          .filter(m => m.home === selected || m.away === selected)
          .map(m => ({ ...m, roundName: r.name }))
      )
    : [];
  const realMatches = teamMatches.filter(m => !m.isBye);
  const byeMatches = teamMatches.filter(m => m.isBye);

  function selectTeam(name) { setSelected(name); setQuery(name); }
  function clearSearch() { setSelected(''); setQuery(''); }

  const statusLabel = {
    [MATCH_STATUS.SCHEDULED]: { text: '예정', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' },
    [MATCH_STATUS.BYE]: { text: '부전승', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
    [MATCH_STATUS.DONE]: { text: '완료', cls: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' },
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
          <Search size={14} className="text-blue-600" /> 학교별 경기 일정 조회
        </h3>
        <div className="relative">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); if (e.target.value !== selected) setSelected(''); }}
                placeholder="학교명 입력"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              />
              {query && (
                <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs">✕</button>
              )}
            </div>
          </div>
          {suggestions.length > 0 && !selected && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
              {suggestions.slice(0, 8).map(t => (
                <button key={t} onClick={() => selectTeam(t)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0">
                  🏀 {t}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {teams.map(t => (
            <button key={t} onClick={() => selectTeam(t)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                ${selected === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300'
                }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <div className="space-y-3">
          <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-bold text-base">🏀 {selected}</div>
              <div className="text-xs text-blue-200 mt-0.5">
                전체 {teamMatches.length}경기{byeMatches.length > 0 && ` (부전승 ${byeMatches.length}개 포함)`}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-bold text-lg">{realMatches.filter(m => m.status === MATCH_STATUS.DONE && m.winner === selected).length}승</div>
              <div className="text-blue-200 text-xs">{realMatches.filter(m => m.status === MATCH_STATUS.DONE && m.winner !== selected).length}패</div>
            </div>
          </div>
          {teamMatches.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">경기 정보가 없습니다</div>
          ) : (
            teamMatches.map(m => {
              const isHome = m.home === selected;
              const opponent = isHome ? m.away : m.home;
              const myScore = isHome ? m.homeScore : m.awayScore;
              const oppScore = isHome ? m.awayScore : m.homeScore;
              const isWinner = m.status === MATCH_STATUS.DONE && m.winner === selected;
              const isLoser = m.status === MATCH_STATUS.DONE && m.winner !== selected && !m.isBye;
              const sl = statusLabel[m.status] ?? statusLabel[MATCH_STATUS.SCHEDULED];
              return (
                <div key={m.id} className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden
                  ${isWinner ? 'border-green-200 dark:border-green-800' : isLoser ? 'border-red-100 dark:border-red-900' : m.isBye ? 'border-blue-200 dark:border-blue-800' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{m.roundName}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sl.cls}`}>{sl.text}</span>
                  </div>
                  <div className="px-4 py-3">
                    {m.isBye ? (
                      <div className="text-center text-sm text-blue-600 dark:text-blue-400 font-semibold py-1">부전승으로 다음 라운드 직행</div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className={`font-bold text-sm flex-1 text-center ${isWinner ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            {selected}{isWinner && ' 🏆'}
                          </span>
                          <span className="text-gray-400 text-xs font-bold shrink-0">
                            {m.status === MATCH_STATUS.DONE ? `${myScore ?? 0} : ${oppScore ?? 0}` : 'VS'}
                          </span>
                          <span className={`text-sm flex-1 text-center ${isLoser ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                            {opponent ?? '미정'}
                          </span>
                        </div>
                        {(m.date || m.time || m.venue) && (
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-50 dark:border-gray-700">
                            {m.date && <span className="flex items-center gap-1"><CalendarDays size={10} />{m.date}</span>}
                            {m.time && <span className="flex items-center gap-1"><Clock size={10} />{m.time}</span>}
                            {m.venue && <span className="flex items-center gap-1"><MapPin size={10} />{m.venue}</span>}
                          </div>
                        )}
                        {!m.date && !m.time && !m.venue && m.status === MATCH_STATUS.SCHEDULED && (
                          <div className="text-xs text-gray-300 dark:text-gray-600 mt-2 text-center">일정 미정</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : query.trim() && suggestions.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Search size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">"{query}"와 일치하는 팀이 없습니다</p>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">
          <Search size={28} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">위에서 학교명을 검색하거나 버튼을 눌러주세요</p>
        </div>
      )}
    </div>
  );
}

// ─── TournamentChasu ───────────────────────────────────────────────────────────

function TournamentChasu({ list, currentId, onSelect }) {
  if (list.length <= 1) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      {list.map((t, i) => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors
            ${t.id === currentId
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-400'
            }`}>
          {list.length - i}차 ({new Date(t.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })})
        </button>
      ))}
    </div>
  );
}

// ─── EmptyLevel ────────────────────────────────────────────────────────────────

function EmptyLevel({ level, isLoggedIn, onNew, onLogin }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-5xl opacity-30">🏀</div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">{level}부 대진이 없습니다</p>
      {isLoggedIn ? (
        <button onClick={onNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
          <Plus size={15} /> 새 대진 만들기
        </button>
      ) : (
        <button onClick={onLogin}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <Lock size={13} /> 관리자 로그인
        </button>
      )}
    </div>
  );
}

// ─── LevelOverview ─────────────────────────────────────────────────────────────

function LevelOverview({ level, sportGroups, onSelectSport, isAdmin, onNew, onLogin }) {
  const colors = LEVEL_COLOR[level];
  return (
    <div>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors?.badge}`}>{level}부</span>
            <h2 className="font-bold text-gray-900 dark:text-gray-100">종목별 현황</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{sportGroups.length}개 종목</span>
          </div>
          {isAdmin ? (
            <button onClick={onNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <Plus size={12} /> 새 대진 만들기
            </button>
          ) : (
            <button onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Lock size={12} /> 관리자 로그인
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sportGroups.map(group => {
            const latest = group.items[0];
            const count = group.items.length;
            const isOver = !!latest.winner;
            const isInProgress = !isOver && latest.doneCount > 0;
            const pct = latest.totalNonBye > 0 ? Math.round((latest.doneCount / latest.totalNonBye) * 100) : 0;
            const genderLabel = group.gender !== '혼성' ? ` ${group.gender}` : '';
            const formatLabel = latest.gameFormat === 'league' ? '리그' : latest.gameFormat === 'group_tournament' ? '조별리그' : '토너먼트';

            return (
              <button key={group.key} onClick={() => onSelectSport(group.key)}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-left shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl mb-1">{SPORT_EMOJI[group.sport] ?? '🏅'}</div>
                    <div className="font-bold text-gray-900 dark:text-gray-100 text-base truncate">
                      {group.sport}{genderLabel}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {latest.totalTeams}팀 · {formatLabel}{count > 1 ? ` · ${count}차 대진` : ''}
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
                    <Trophy size={10} /> 우승: {latest.winner}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                      <span>진행률</span>
                      <span>{pct}% ({latest.doneCount}/{latest.totalNonBye})</span>
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
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LevelPanel ───────────────────────────────────────────────────────────────

function LevelPanel({ level, summaryList, isAdmin, dispatch, asyncDispatch, requireAdmin, setModalOpen }) {
  // ── 종목별 그룹화 ──────────────────────────────────────────────────────────
  const sportGroups = useMemo(() => {
    const map = new Map();
    summaryList.forEach(t => {
      const key = `${t.sport}__${t.gender ?? '혼성'}`;
      if (!map.has(key)) map.set(key, { key, sport: t.sport, gender: t.gender ?? '혼성', items: [] });
      map.get(key).items.push(t);
    });
    return [...map.values()];
  }, [summaryList]);

  // null = show overview (when multiple sport groups)
  const [activeSportKey, setActiveSportKey] = useState(null);

  // Auto-select when there's only one sport group
  useEffect(() => {
    if (sportGroups.length === 1) {
      setActiveSportKey(sportGroups[0].key);
    } else if (sportGroups.length === 0) {
      setActiveSportKey(null);
    }
  }, [sportGroups]);

  const activeGroup = activeSportKey ? (sportGroups.find(g => g.key === activeSportKey) ?? null) : null;
  const filteredList = activeGroup?.items ?? [];

  const [currentId, setCurrentId] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmResetBracket, setConfirmResetBracket] = useState(false);

  // Keep currentId valid when filteredList changes (including sport group changes)
  useEffect(() => {
    if (filteredList.length > 0) {
      if (!filteredList.find(t => t.id === currentId)) {
        setCurrentId(filteredList[0].id);
      }
    } else {
      setCurrentId(null);
    }
  }, [filteredList]);

  // Load full tournament data when currentId changes
  useEffect(() => {
    if (currentId) {
      loadTournament(currentId).then(data => {
        setTournament(data);
      });
    } else {
      setTournament(null);
    }
  }, [currentId, summaryList]);

  function handleNew() {
    requireAdmin(() => {
      dispatch({ type: ACTIONS.RESET_TOURNAMENT });
      dispatch({ type: ACTIONS.SET_META, payload: { schoolLevel: level } });
      dispatch({ type: ACTIONS.SET_SCREEN, payload: { screen: SCREENS.SETUP } });
    });
  }

  async function resetBracket() {
    if (!tournament) return;
    let updated;
    if (tournament.meta.gameFormat === 'group_tournament') {
      const bracketData = generateGroupTournament(tournament.teams, tournament.meta.seed);
      updated = {
        ...tournament,
        meta: { ...tournament.meta, bracketSize: bracketData.knockoutSize, byeCount: 0, phase: 'group', status: 'in_progress' },
        bracket: { groups: bracketData.groups, knockout: null },
      };
    } else {
      const bracketData = generateBracket(tournament.teams, tournament.meta.seed);
      updated = {
        ...tournament,
        meta: { ...tournament.meta, bracketSize: bracketData.bracketSize, byeCount: bracketData.byeCount, status: 'in_progress' },
        bracket: { rounds: bracketData.rounds },
      };
    }
    await saveTournament(updated);
    setTournament(updated);
    asyncDispatch({ type: ACTIONS.LOAD_TOURNAMENT_LIST });
    setConfirmResetBracket(false);
    setActiveTab('overview');
  }

  function copyShareLink() {
    if (!tournament) return;
    const url = buildShareUrl(tournament);
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function addNotice() {
    if (!tournament || !noticeTitle.trim() || !noticeContent.trim()) return;
    const notice = {
      id: `n${Date.now()}`,
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = { ...tournament, notices: [notice, ...tournament.notices] };
    await saveTournament(updated);
    setTournament(updated);
    setNoticeTitle('');
    setNoticeContent('');
  }

  async function deleteNotice(id) {
    if (!tournament) return;
    const updated = { ...tournament, notices: tournament.notices.filter(n => n.id !== id) };
    await saveTournament(updated);
    setTournament(updated);
  }

  function navigate(targetScreen) {
    asyncDispatch({ type: ACTIONS.SELECT_TOURNAMENT, payload: { id: currentId, targetScreen } });
  }

  // ── Early returns ──────────────────────────────────────────────────────────

  if (summaryList.length === 0) {
    return <EmptyLevel level={level} isLoggedIn={isAdmin} onNew={handleNew} onLogin={() => setModalOpen(true)} />;
  }

  // Show overview when multiple sport groups and none selected
  if (!activeGroup) {
    return (
      <LevelOverview
        level={level}
        sportGroups={sportGroups}
        onSelectSport={setActiveSportKey}
        isAdmin={isAdmin}
        onNew={handleNew}
        onLogin={() => setModalOpen(true)}
      />
    );
  }

  // Loading state
  if (!tournament) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 dark:text-gray-500 text-sm">불러오는 중…</div>
      </div>
    );
  }

  // ── Detail view ────────────────────────────────────────────────────────────

  const { meta, bracket, notices, teams } = tournament;
  const isGroupTournament = meta.gameFormat === 'group_tournament';

  let rounds;
  if (isGroupTournament) {
    const groupRounds = bracket.groups.flatMap(g =>
      g.rounds.map(r => ({ ...r, name: `${g.name} ${r.name}` }))
    );
    rounds = [...groupRounds, ...(bracket.knockout?.rounds ?? [])];
  } else {
    rounds = bracket.rounds;
  }

  const allMatches = rounds.flatMap(r => r.matches);
  const doneCount = allMatches.filter(m => m.status === MATCH_STATUS.DONE).length;
  const totalNonBye = allMatches.filter(m => !m.isBye).length;

  const rankingRounds = isGroupTournament ? (bracket.knockout?.rounds ?? []) : rounds;
  const { winner, runnerUp, third, fourth } = getFinalRankings(rankingRounds);
  const isTournamentOver = !!winner;

  const doneMatchesFeed = rounds
    .flatMap(r => r.matches.map(m => ({ ...m, roundName: r.name })))
    .filter(m => m.status === MATCH_STATUS.DONE)
    .sort((a, b) => {
      if (a.completedAt && b.completedAt) return b.completedAt.localeCompare(a.completedAt);
      return 0;
    });

  const tabs = [
    { id: 'overview', label: '현황' },
    { id: 'school', label: '학교 조회' },
    { id: 'bracket', label: isGroupTournament ? '조별 현황' : '대진표' },
    { id: 'feed', label: `결과 피드 (${doneMatchesFeed.length})` },
    { id: 'notices', label: `공지 (${notices.length})`, adminOnly: true },
  ];

  const formatLabel = meta.gameFormat === 'league' ? '리그전' : meta.gameFormat === 'group_tournament' ? '조별리그' : '토너먼트';
  const genderLabel = meta.gender && meta.gender !== '혼성' ? `${meta.gender} ` : '';

  return (
    <div className="space-y-0">
      {/* Back to overview button (only when multiple sport groups) */}
      {sportGroups.length > 1 && (
        <div className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setActiveSportKey(null)}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              <ArrowLeft size={13} /> 종목 목록으로
            </button>
          </div>
        </div>
      )}

      {/* Tournament info + admin controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${LEVEL_COLOR[level]?.badge}`}>{level}부</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {SPORT_EMOJI[meta.sport] ?? '🏅'} {genderLabel}{meta.sport} {formatLabel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><Layers size={11} />{isGroupTournament ? `${meta.groupCount}조 → ${meta.knockoutSize}강` : meta.gameFormat === 'league' ? `${meta.bracketSize}팀 리그` : `${meta.bracketSize}강`}</span>
                <span className="flex items-center gap-1"><Users size={11} />{meta.totalTeams}팀</span>
                <span className="flex items-center gap-1">
                  <CalendarDays size={11} />
                  {new Date(meta.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </span>
              </div>
              <TournamentChasu list={filteredList} currentId={currentId} onSelect={setCurrentId} />
            </div>
            <div className="flex flex-col items-end gap-1">
              {winner ? (
                <span className="flex items-center gap-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full">
                  <Trophy size={11} /> 대회 종료
                </span>
              ) : doneCount > 0 ? (
                <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full">
                  진행중 {doneCount}/{totalNonBye}
                </span>
              ) : (
                <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2.5 py-1 rounded-full">대기중</span>
              )}
            </div>
          </div>

          {winner && (
            <div className="mt-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2">
              <Trophy size={14} className="text-amber-500 flex-shrink-0" />
              <span className="font-bold text-amber-800 dark:text-amber-300 text-sm">{winner}</span>
              <span className="text-xs text-amber-500 ml-1">우승</span>
            </div>
          )}

          {!winner && doneCount > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                <span>경기 진행률</span>
                <span>{Math.round((doneCount / totalNonBye) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(doneCount / totalNonBye) * 100}%` }} />
              </div>
            </div>
          )}

          {confirmResetBracket && (
            <ConfirmDialog
              title="대진 초기화"
              message="현재 대진의 모든 경기 결과와 일정이 초기화됩니다. 팀 구성은 유지됩니다. 이 작업은 되돌릴 수 없습니다."
              confirmLabel="초기화"
              onConfirm={resetBracket}
              onCancel={() => setConfirmResetBracket(false)}
            />
          )}

          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <>
                <button onClick={() => navigate(SCREENS.DRAW)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors">
                  <Settings size={12} /> 대진 관리
                </button>
                <button onClick={() => navigate(SCREENS.MATCH_PLAY)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
                  <Swords size={12} /> 경기 진행
                </button>
              </>
            )}
            <button
              onClick={copyShareLink}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
                ${copied
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              {copied ? <><Check size={12} /> 복사됨!</> : <><Share2 size={12} /> 공유 링크</>}
            </button>
            {isAdmin && (
              <>
                <button onClick={handleNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors ml-auto">
                  <Plus size={12} /> 새 대진
                </button>
                <button onClick={() => setConfirmResetBracket(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors">
                  <RotateCcw size={12} /> 대진 초기화
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1
                ${activeTab === t.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
              {t.id === 'notices' && !isAdmin && <Lock size={10} />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* 현황 */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {isTournamentOver ? (
              <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🏆</div>
                  <div className="text-2xl font-bold">{winner}</div>
                  <div className="text-sm opacity-90">우승</div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {runnerUp && (
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <div className="text-xl">🥈</div>
                      <div className="font-bold text-sm mt-1">{runnerUp}</div>
                      <div className="text-xs opacity-80">준우승</div>
                    </div>
                  )}
                  {(third || fourth) && (
                    <div className="bg-white/20 rounded-xl p-3 text-center">
                      <div className="text-xl">🥉</div>
                      <div className="font-bold text-sm mt-1">{third ?? '—'}</div>
                      <div className="text-xs opacity-80">3위</div>
                    </div>
                  )}
                </div>
                {fourth && <div className="mt-3 text-center text-sm opacity-80">4위: {fourth}</div>}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Swords size={20} className="text-blue-600" />
                  <h2 className="font-bold text-gray-900 dark:text-gray-100">대회 현황</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="참가팀" value={`${meta.totalTeams}팀`} color="blue" />
                  {isGroupTournament
                    ? <StatCard label={`${meta.groupCount}조 편성`} value={`${meta.knockoutSize}강`} color="indigo" />
                    : <StatCard label="브라켓" value={`${meta.bracketSize}강`} color="indigo" />
                  }
                  <StatCard label="완료 경기" value={`${doneCount}/${totalNonBye}`} color="green" />
                  {isGroupTournament
                    ? <StatCard label="단계" value={bracket.knockout ? '토너먼트' : '조별리그'} color="orange" />
                    : <StatCard label="부전승" value={`${meta.byeCount}개`} color="orange" />
                  }
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>진행률</span>
                    <span>{totalNonBye > 0 ? Math.round((doneCount / totalNonBye) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${totalNonBye > 0 ? (doneCount / totalNonBye) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">라운드별 진행</h3>
              <div className="space-y-2">
                {rounds.map((r, idx) => {
                  const real = r.matches.filter(m => !m.isBye);
                  const done = r.matches.filter(m => m.status === MATCH_STATUS.DONE);
                  const pct = real.length > 0 ? (done.length / real.length) * 100 : 100;
                  return (
                    <div key={`${r.name}_${idx}`}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-300">{r.name}</span>
                        <span className="text-gray-400 dark:text-gray-500">{done.length}/{real.length}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-blue-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isTournamentOver && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">최종 순위</h3>
                </div>
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      { rank: '🥇 1위', team: winner, note: '우승' },
                      { rank: '🥈 2위', team: runnerUp, note: '준우승' },
                      { rank: '🥉 3위', team: third, note: '3위' },
                      { rank: '4위', team: fourth, note: '4위' },
                    ].filter(r => r.team).map(({ rank, team, note }) => (
                      <tr key={rank} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-20">{rank}</td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100">{team}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 text-right">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 학교 조회 */}
        {activeTab === 'school' && <SchoolScheduleTab rounds={rounds} teams={teams} />}

        {/* 대진표 */}
        {activeTab === 'bracket' && (
          isGroupTournament ? (
            <GroupDashboardView bracket={bracket} meta={meta} />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <BracketTree rounds={rounds} />
            </div>
          )
        )}

        {/* 결과 피드 */}
        {activeTab === 'feed' && (
          <div className="space-y-3">
            {doneMatchesFeed.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Swords size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">완료된 경기가 없습니다</p>
              </div>
            ) : (
              doneMatchesFeed.map(m => (
                <div key={m.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">{m.roundName}</span>
                    {m.completedAt && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(m.completedAt).toLocaleString('ko-KR')}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold text-sm ${m.winner === m.home ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {m.home}{m.winner === m.home && <Trophy size={12} className="inline ml-1 text-orange-400" />}
                    </span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-base mx-3">{m.homeScore} : {m.awayScore}</span>
                    <span className={`font-semibold text-sm ${m.winner === m.away ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {m.away}{m.winner === m.away && <Trophy size={12} className="inline ml-1 text-orange-400" />}
                    </span>
                  </div>
                  {m.venue && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">{m.venue}</div>}
                </div>
              ))
            )}
          </div>
        )}

        {/* 공지 */}
        {activeTab === 'notices' && (
          <div className="space-y-4">
            {isAdmin ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
                  <Bell size={14} className="text-blue-600" /> 공지 작성
                </h3>
                <input
                  type="text" value={noticeTitle} onChange={e => setNoticeTitle(e.target.value)} placeholder="제목"
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
                <textarea
                  value={noticeContent} onChange={e => setNoticeContent(e.target.value)} placeholder="내용" rows={3}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                />
                <button
                  onClick={addNotice} disabled={!noticeTitle.trim() || !noticeContent.trim()}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> 공지 등록
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm flex flex-col items-center gap-3">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
                  <Lock size={20} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">공지 작성은 관리자 전용입니다.</p>
                <button onClick={() => setModalOpen(true)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
                  관리자 로그인
                </button>
              </div>
            )}

            {notices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">등록된 공지가 없습니다</p>
              </div>
            ) : (
              notices.map(n => (
                <div key={n.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{n.title}</h4>
                    {isAdmin && (
                      <button onClick={() => deleteNotice(n.id)} className="text-gray-400 hover:text-red-500 ml-2">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{n.content}</p>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">{new Date(n.createdAt).toLocaleString('ko-KR')}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Home (root) ──────────────────────────────────────────────────────────────

export default function Home() {
  const { state, dispatch, asyncDispatch, importedLevel } = useContext(AppContext);
  const { tournamentList } = state;
  const { isLoggedIn, requireAdmin, setModalOpen } = useAdmin();
  const [activeLevel, setActiveLevel] = useState('고등');
  const [helpOpen, setHelpOpen] = useState(false);
  // false | 'step1' | 'step2'
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  useEffect(() => {
    if (importedLevel) {
      setActiveLevel(importedLevel);
      return;
    }
    if (tournamentList.length > 0) {
      const found = ['고등', '중등', '초등'].find(lv => tournamentList.some(t => t.schoolLevel === lv));
      if (found) setActiveLevel(found);
    }
  }, [importedLevel]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {/* App header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏀</span>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">학교스포츠클럽 축제</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">대진관리</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="사용 가이드">
              <HelpCircle size={13} /> 도움말
            </button>
            {!isLoggedIn && (
              <button onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Lock size={12} /> 관리자
              </button>
            )}
          </div>
        </div>

        {/* Level tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-0">
          {LEVELS.map(level => {
            const hasData = tournamentList.some(t => t.schoolLevel === level);
            const colors = LEVEL_COLOR[level];
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

      {/* Import banner */}
      {importedLevel && (
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-2.5 text-sm text-green-700 dark:text-green-400 font-medium">
            <LinkIcon size={14} className="shrink-0" />
            공유된 대진을 불러왔습니다. 현재 기기에 저장되었습니다.
          </div>
        </div>
      )}

      {/* Level panels */}
      <div className="pb-24">
        {LEVELS.map(level => {
          const levelList = tournamentList
            .filter(t => t.schoolLevel === level)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          return (
            <div key={level} className={activeLevel === level ? '' : 'hidden'}>
              <LevelPanel
                level={level}
                summaryList={levelList}
                isAdmin={isLoggedIn}
                dispatch={dispatch}
                asyncDispatch={asyncDispatch}
                requireAdmin={requireAdmin}
                setModalOpen={setModalOpen}
              />
            </div>
          );
        })}

        {/* 전체 초기화 — admin only */}
        {isLoggedIn && tournamentList.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 mt-8 mb-4">
            <div className="border border-red-200 dark:border-red-900/50 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-2 shrink-0 mt-0.5">
                    <AlertTriangle size={14} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">전체 초기화</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">모든 학교급의 대진 데이터를 삭제합니다.</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmResetAll('step1')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                >
                  <RotateCcw size={12} /> 전체 초기화
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 전체 초기화 — step 1 */}
      {confirmResetAll === 'step1' && (
        <ConfirmDialog
          title="전체 초기화"
          message="초등·중등·고등부의 모든 대진 데이터를 영구 삭제합니다. 계속하시겠습니까?"
          confirmLabel="다음 단계"
          onConfirm={() => setConfirmResetAll('step2')}
          onCancel={() => setConfirmResetAll(false)}
        />
      )}

      {/* 전체 초기화 — step 2 (final) */}
      {confirmResetAll === 'step2' && (
        <ConfirmDialog
          title="⚠️ 최종 확인"
          message="이 작업은 절대 되돌릴 수 없습니다. 모든 대진 데이터가 완전히 삭제됩니다. 정말로 진행하시겠습니까?"
          confirmLabel="전체 삭제"
          onConfirm={() => {
            asyncDispatch({ type: ACTIONS.RESET_ALL_TOURNAMENTS });
            setConfirmResetAll(false);
          }}
          onCancel={() => setConfirmResetAll(false)}
        />
      )}
    </div>
  );
}

import { useContext, useState, useRef } from 'react';
import { RefreshCw, AlertTriangle, ChevronRight, ChevronLeft, History, X, Clock, Hash, Lock, Trophy } from 'lucide-react';
import { AppContext } from '../App';
import { ACTIONS } from '../store/actions';
import { SCREENS, SPORT_EMOJI, GAME_FORMATS } from '../constants';
import { useAdmin } from '../contexts/AdminContext';
import { generateBracket, calcLeagueStandings } from '../utils/tournament';
import BracketTree from './ui/BracketTree';
import DownloadMenu from './ui/DownloadMenu';

function buildBracketHistory(tournament) {
  const { meta, teams, history } = tournament;
  const entries = [];
  history.forEach((h, idx) => {
    entries.push({
      num: idx + 1,
      seed: h.seed,
      teams: h.teams,
      gameFormat: h.gameFormat ?? meta.gameFormat,
      createdAt: idx === 0 ? meta.createdAt : history[idx - 1].reshuffledAt,
      replacedAt: h.reshuffledAt,
      isCurrent: false,
    });
  });
  entries.push({
    num: history.length + 1,
    seed: meta.seed,
    teams: [...teams],
    gameFormat: meta.gameFormat,
    createdAt: history.length > 0 ? history[history.length - 1].reshuffledAt : meta.createdAt,
    replacedAt: null,
    isCurrent: true,
  });
  return entries.reverse();
}

function ReshuffleDialog({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-yellow-100 dark:bg-yellow-900/40 rounded-full p-2">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">대진 재구성</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          새로운 랜덤 대진으로 재추첨합니다.<br />
          입력된 일정·결과는 초기화되며, 이전 대진은 이력에 보존됩니다.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            취소
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            재구성하기
          </button>
        </div>
      </div>
    </div>
  );
}

function BracketPreviewModal({ entry, onClose }) {
  const { rounds } = generateBracket(entry.teams, entry.seed);
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-xl p-2">
              <History size={16} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                {entry.num}차 대진
                {entry.num === 1 && <span className="ml-2 text-xs text-indigo-500">최초 생성</span>}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                <Clock size={10} />
                {new Date(entry.createdAt).toLocaleString('ko-KR')}
                <span className="text-gray-300">·</span>
                <Hash size={10} />
                시드 {entry.seed}
                <span className="text-gray-300">·</span>
                {entry.teams.length}팀
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1.5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4 flex flex-wrap gap-1.5">
            {entry.teams.map((t, i) => (
              <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                {i + 1}. {t}
              </span>
            ))}
          </div>
          <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900">
            <BracketTree rounds={rounds} />
          </div>
        </div>
        <div className="px-5 pb-4 text-right">
          <button onClick={onClose} className="px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function HistorySidebar({ entries, onSelectEntry }) {
  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden sticky top-4">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50">
          <History size={14} className="text-indigo-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">대진 생성 이력</span>
          <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
            {entries.length}회
          </span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto">
          {entries.map(entry => (
            <div
              key={entry.seed}
              className={`relative transition-colors
                ${entry.isCurrent
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                  : entry.gameFormat !== 'group_tournament'
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4 border-l-transparent'
                    : 'border-l-4 border-l-transparent opacity-60'
                }`}
              onClick={() => !entry.isCurrent && entry.gameFormat !== 'group_tournament' && onSelectEntry(entry)}
            >
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                      ${entry.isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                      {entry.num}차
                    </span>
                    {entry.isCurrent && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">현재</span>}
                    {entry.num === 1 && !entry.isCurrent && <span className="text-xs text-gray-400">최초</span>}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                  <Clock size={9} className="flex-shrink-0" />
                  {new Date(entry.createdAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                  <Hash size={9} className="flex-shrink-0" />
                  <span className="font-mono">{String(entry.seed).slice(-8)}</span>
                  {!entry.isCurrent && entry.gameFormat !== 'group_tournament' && (
                    <span className="ml-auto text-indigo-400 text-xs">대진 보기 →</span>
                  )}
                </div>
                {entry.replacedAt && (
                  <div className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                    <RefreshCw size={9} />
                    {new Date(entry.replacedAt).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} 재구성
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {entries.length > 1 && (
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">이전 대진을 클릭하면 확인할 수 있습니다</p>
          </div>
        )}
      </div>
    </aside>
  );
}

function ScheduleInput({ rounds, dispatch }) {
  function handleUpdate(matchId, field, value) {
    const match = rounds.flatMap(r => r.matches).find(m => m.id === matchId);
    if (!match) return;
    dispatch({
      type: ACTIONS.UPDATE_SCHEDULE,
      payload: {
        matchId,
        date: field === 'date' ? value : match.date,
        time: field === 'time' ? value : match.time,
        venue: field === 'venue' ? value : match.venue,
      },
    });
  }

  const realMatches = rounds.flatMap(r =>
    r.matches.filter(m => !m.isBye).map(m => ({ ...m, roundName: r.name }))
  );

  return (
    <div className="space-y-3">
      {realMatches.map(match => (
        <div key={match.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              {match.roundName}
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {match.home ?? '—'} <span className="text-gray-400 mx-1">vs</span> {match.away ?? '—'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">날짜</label>
              <input type="date" defaultValue={match.date ?? ''}
                onBlur={e => handleUpdate(match.id, 'date', e.target.value || null)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">시간</label>
              <input type="time" defaultValue={match.time ?? ''}
                onBlur={e => handleUpdate(match.id, 'time', e.target.value || null)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100" />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">장소</label>
              <input type="text" defaultValue={match.venue ?? ''}
                onBlur={e => handleUpdate(match.id, 'venue', e.target.value || null)}
                placeholder="예: 체육관A"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeagueStandings({ teams, rounds, advancePerGroup, groupName }) {
  const rows = calcLeagueStandings(teams, rounds);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">
          {groupName ? `${groupName} 순위표` : '순위표'}
        </span>
        {advancePerGroup && (
          <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full font-medium">
            상위 {advancePerGroup}팀 진출
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
              <th className="px-3 py-2 text-left w-6">#</th>
              <th className="px-3 py-2 text-left">팀명</th>
              <th className="px-3 py-2 text-center">경기</th>
              <th className="px-3 py-2 text-center">승</th>
              <th className="px-3 py-2 text-center">무</th>
              <th className="px-3 py-2 text-center">패</th>
              <th className="px-3 py-2 text-center">득점</th>
              <th className="px-3 py-2 text-center">실점</th>
              <th className="px-3 py-2 text-center">득실</th>
              <th className="px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400">승점</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {rows.map((r, i) => {
              const isAdvancing = advancePerGroup && i < advancePerGroup;
              return (
                <tr key={r.team} className={
                  isAdvancing
                    ? i === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-blue-50/50 dark:bg-blue-900/10'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }>
                  <td className="px-3 py-2.5 text-center text-xs text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-800 dark:text-gray-100">
                    {isAdvancing && <span className="mr-1 text-blue-500">▲</span>}
                    {r.team}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{r.played}</td>
                  <td className="px-3 py-2.5 text-center text-green-600 dark:text-green-400 font-medium">{r.win}</td>
                  <td className="px-3 py-2.5 text-center text-gray-500">{r.draw}</td>
                  <td className="px-3 py-2.5 text-center text-red-500">{r.loss}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{r.gf}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{r.ga}</td>
                  <td className="px-3 py-2.5 text-center text-gray-600 dark:text-gray-300">{r.gf - r.ga > 0 ? `+${r.gf - r.ga}` : r.gf - r.ga}</td>
                  <td className="px-3 py-2.5 text-center font-bold text-blue-600 dark:text-blue-400">{r.pts}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeagueSchedule({ rounds }) {
  return (
    <div className="space-y-4">
      {rounds.map(round => (
        <div key={round.roundNum} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold text-gray-700 dark:text-gray-300">
            {round.name}
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {round.matches.filter(m => !m.isBye).map(m => (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm">
                  <span className={`font-medium ${m.winner === m.home ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>{m.home}</span>
                  {m.status === 'done'
                    ? <span className="text-xs font-bold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{m.homeScore} : {m.awayScore}</span>
                    : <span className="text-xs text-gray-400">vs</span>
                  }
                  <span className={`font-medium ${m.winner === m.away ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>{m.away}</span>
                </div>
                {m.date && <span className="text-xs text-gray-400">{m.date} {m.time} {m.venue && `· ${m.venue}`}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function GroupStandingsView({ groups, advancePerGroup }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {groups.map(g => (
        <LeagueStandings key={g.id} teams={g.teams} rounds={g.rounds} advancePerGroup={advancePerGroup} groupName={g.name} />
      ))}
    </div>
  );
}

function GroupScheduleView({ groups }) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id ?? null);
  const group = groups.find(g => g.id === activeGroup) ?? groups[0];
  return (
    <div>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {groups.map(g => (
          <button key={g.id} onClick={() => setActiveGroup(g.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
              ${activeGroup === g.id
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-400'
              }`}>
            {g.name}
          </button>
        ))}
      </div>
      {group && <LeagueSchedule rounds={group.rounds} />}
    </div>
  );
}

function AdminGate({ message, onLogin }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4">
        <Lock size={28} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{message}</p>
      <button onClick={onLogin}
        className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
        관리자 로그인
      </button>
    </div>
  );
}

export default function Draw() {
  const { state, dispatch, asyncDispatch } = useContext(AppContext);
  const { tournament, ui } = state;
  const { requireAdmin, isLoggedIn, setModalOpen } = useAdmin();
  const [activeTab, setActiveTab] = useState('bracket');
  const [previewEntry, setPreviewEntry] = useState(null);
  const bracketRef = useRef(null);

  if (!tournament) return null;

  const { meta, bracket } = tournament;
  const isLeague = meta.gameFormat === 'league';
  const isGroupTournament = meta.gameFormat === 'group_tournament';
  const historyEntries = buildBracketHistory(tournament);
  const sportEmoji = SPORT_EMOJI[meta.sport] ?? '🏅';

  let formatLabel;
  if (isGroupTournament) {
    formatLabel = `조별리그→${meta.knockoutSize}강`;
  } else {
    formatLabel = GAME_FORMATS.find(f => f.id === meta.gameFormat)?.label ?? '토너먼트';
  }

  function handleReshuffle() {
    dispatch({ type: ACTIONS.RESHUFFLE, payload: { seed: Date.now() } });
  }

  // All rounds for schedule input
  const allScheduleRounds = isGroupTournament
    ? [
        ...bracket.groups.flatMap(g => g.rounds.map(r => ({ ...r, name: `${g.name} ${r.name}` }))),
        ...(bracket.knockout?.rounds ?? []),
      ]
    : bracket.rounds;

  // Stat line in header
  let statLine;
  if (isGroupTournament) {
    const groupMatches = bracket.groups.flatMap(g => g.rounds.flatMap(r => r.matches)).filter(m => !m.isBye).length;
    const knockoutMatches = bracket.knockout ? bracket.knockout.rounds.flatMap(r => r.matches).filter(m => !m.isBye).length : 0;
    statLine = `${meta.totalTeams}팀 · ${meta.groupCount}개조 · 조당 ${meta.advancePerGroup}팀 진출 · 총 ${groupMatches + knockoutMatches}경기`;
  } else if (isLeague) {
    statLine = `${meta.totalTeams}팀 · ${bracket.rounds.length}라운드 · 총 ${bracket.rounds.flatMap(r => r.matches).filter(m => !m.isBye).length}경기`;
  } else {
    statLine = `${meta.totalTeams}팀 · ${meta.bracketSize}강 · 부전승 ${meta.byeCount}개`;
  }

  let navItems;
  if (isGroupTournament) {
    navItems = [
      { id: 'group_standings', label: '조별 순위' },
      { id: 'group_schedule', label: '조별 경기' },
      { id: 'knockout', label: `${meta.knockoutSize}강 대진`, disabled: !bracket.knockout },
      { id: 'schedule', label: '일정 입력' },
    ];
  } else if (isLeague) {
    navItems = [
      { id: 'standings', label: '순위표' },
      { id: 'bracket', label: '경기 일정' },
      { id: 'schedule', label: '일정 입력' },
    ];
  } else {
    navItems = [
      { id: 'bracket', label: '대진표' },
      { id: 'schedule', label: '일정 입력' },
    ];
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm no-print">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => asyncDispatch({ type: ACTIONS.BACK_TO_HOME })}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mr-1">
              <ChevronLeft size={15} />
              <span className="hidden sm:inline">목록</span>
            </button>
            <span className="text-2xl">{sportEmoji}</span>
            <div>
              <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                {meta.schoolLevel}부 {meta.gender ? `${meta.gender} ` : ''}{meta.sport} {formatLabel}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{statLine}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DownloadMenu
              targetRef={bracketRef}
              filename={`${meta.schoolLevel}부_${meta.gender ?? ''}${meta.gender ? '_' : ''}${meta.sport}_${formatLabel}`}
            />
            <button
              onClick={() => requireAdmin(() => dispatch({ type: ACTIONS.TOGGLE_RESHUFFLE_CONFIRM, payload: { open: true } }))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {isLoggedIn ? <RefreshCw size={13} /> : <Lock size={13} />} 재구성
            </button>
            {isLoggedIn && (
              <button
                onClick={() => dispatch({ type: ACTIONS.SET_SCREEN, payload: { screen: SCREENS.MATCH_PLAY } })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">
                경기 진행 <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1400px] mx-auto px-4 flex gap-0">
          {navItems.map(item => (
            <button key={item.id} onClick={() => !item.disabled && setActiveTab(item.id)}
              disabled={item.disabled}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5
                ${item.disabled
                  ? 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : activeTab === item.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}>
              {item.id === 'schedule' && !isLoggedIn && <Lock size={11} className="text-gray-400" />}
              {item.label}
              {item.id === 'knockout' && !bracket.knockout && (
                <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded-full ml-1">조별리그 진행 중</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Knockout generated banner */}
      {isGroupTournament && bracket.knockout && activeTab !== 'knockout' && (
        <div className="max-w-[1400px] mx-auto px-4 pt-3">
          <button onClick={() => setActiveTab('knockout')}
            className="w-full flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-2.5 text-sm text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <Trophy size={14} className="shrink-0" />
            🎉 조별 리그 완료! {meta.knockoutSize}강 대진이 생성되었습니다. 클릭하여 확인하세요.
          </button>
        </div>
      )}

      {/* Body */}
      <div className="max-w-[1400px] mx-auto p-4 flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex-1 min-w-0">

          {/* Group Tournament tabs */}
          {isGroupTournament && activeTab === 'group_standings' && (
            <GroupStandingsView groups={bracket.groups} advancePerGroup={meta.advancePerGroup} />
          )}
          {isGroupTournament && activeTab === 'group_schedule' && (
            <GroupScheduleView groups={bracket.groups} />
          )}
          {isGroupTournament && activeTab === 'knockout' && bracket.knockout && (
            <div ref={bracketRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" />
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{meta.knockoutSize}강 본선 대진표</span>
              </div>
              <BracketTree rounds={bracket.knockout.rounds} />
            </div>
          )}

          {/* League tabs */}
          {isLeague && activeTab === 'standings' && (
            <LeagueStandings teams={tournament.teams} rounds={bracket.rounds} />
          )}
          {isLeague && activeTab === 'bracket' && <LeagueSchedule rounds={bracket.rounds} />}

          {/* Tournament tab */}
          {!isLeague && !isGroupTournament && activeTab === 'bracket' && (
            <div ref={bracketRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <BracketTree rounds={bracket.rounds} />
            </div>
          )}

          {/* Schedule input */}
          {activeTab === 'schedule' && (
            isLoggedIn
              ? <ScheduleInput rounds={allScheduleRounds} dispatch={dispatch} />
              : <AdminGate message="일정 입력은 관리자 전용입니다." onLogin={() => setModalOpen(true)} />
          )}
        </div>

        <HistorySidebar entries={historyEntries} onSelectEntry={setPreviewEntry} />
      </div>

      {ui.reshuffleConfirmOpen && (
        <ReshuffleDialog
          onConfirm={handleReshuffle}
          onCancel={() => dispatch({ type: ACTIONS.TOGGLE_RESHUFFLE_CONFIRM, payload: { open: false } })}
        />
      )}
      {previewEntry && previewEntry.gameFormat !== 'group_tournament' && (
        <BracketPreviewModal entry={previewEntry} onClose={() => setPreviewEntry(null)} />
      )}
    </div>
  );
}

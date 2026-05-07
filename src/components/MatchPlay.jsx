import { useContext, useState } from 'react';
import { CheckCircle, Circle, Trophy, ChevronLeft, ChevronRight, Edit2, Lock } from 'lucide-react';
import { AppContext } from '../App';
import { ACTIONS } from '../store/actions';
import { SCREENS, MATCH_STATUS } from '../constants';
import { useAdmin } from '../contexts/AdminContext';

function MatchResultCard({ match, roundName, dispatch, allowDraw }) {
  const [home, setHome] = useState(match.homeScore ?? '');
  const [away, setAwayScore] = useState(match.awayScore ?? '');
  const [error, setError] = useState('');
  const isDone = match.status === MATCH_STATUS.DONE;
  const isBye = match.isBye;

  function submit() {
    const hs = parseInt(home);
    const as = parseInt(away);
    if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) {
      setError('올바른 점수를 입력하세요.');
      return;
    }
    if (!allowDraw && hs === as) {
      setError('동점은 허용되지 않습니다. 연장전 결과를 입력해주세요.');
      return;
    }
    setError('');
    dispatch({ type: ACTIONS.SUBMIT_RESULT, payload: { matchId: match.id, homeScore: hs, awayScore: as } });
    setHome('');
    setAwayScore('');
  }

  function editResult() {
    dispatch({ type: ACTIONS.EDIT_RESULT, payload: { matchId: match.id } });
    setHome('');
    setAwayScore('');
    setError('');
  }

  const statusColor = {
    [MATCH_STATUS.SCHEDULED]: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
    [MATCH_STATUS.BYE]: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
    [MATCH_STATUS.DONE]: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10',
  };

  return (
    <div className={`rounded-xl border ${statusColor[match.status]} shadow-sm overflow-hidden`}>
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">{roundName}</span>
        <div className="flex items-center gap-2 text-xs">
          {isBye ? (
            <span className="text-blue-500 dark:text-blue-400 font-medium">부전승</span>
          ) : isDone ? (
            <>
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                <CheckCircle size={12} /> 완료
              </span>
              <button onClick={editResult} className="text-gray-400 hover:text-orange-500 transition-colors" title="결과 수정">
                <Edit2 size={12} />
              </button>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
              <Circle size={12} /> 예정
            </span>
          )}
        </div>
      </div>

      {match.date && (
        <div className="px-4 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
          {match.date} {match.time} {match.venue && `· ${match.venue}`}
        </div>
      )}

      <div className="p-4">
        {isBye ? (
          <div className="text-center text-sm text-blue-600 dark:text-blue-400 font-semibold py-2">
            🏆 {match.winner} — 부전승으로 진출
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`flex-1 text-center py-2 px-3 rounded-lg text-sm font-semibold
                ${isDone && match.winner === match.home
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                {match.home ?? '—'}
                {isDone && match.winner === match.home && <Trophy size={12} className="inline ml-1" />}
              </div>
              <span className="text-gray-400 text-xs font-bold">VS</span>
              <div className={`flex-1 text-center py-2 px-3 rounded-lg text-sm font-semibold
                ${isDone && match.winner === match.away
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                {match.away ?? '—'}
                {isDone && match.winner === match.away && <Trophy size={12} className="inline ml-1" />}
              </div>
            </div>

            {!isDone ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" value={home}
                    onChange={e => { setHome(e.target.value); setError(''); }}
                    disabled={!match.home} placeholder="0"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-800"
                  />
                  <span className="text-gray-400 font-bold text-lg">:</span>
                  <input
                    type="number" min="0" value={away}
                    onChange={e => { setAwayScore(e.target.value); setError(''); }}
                    disabled={!match.away} placeholder="0"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:disabled:bg-gray-800"
                  />
                  <button
                    onClick={submit} disabled={!match.home || !match.away}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors">
                    저장
                  </button>
                </div>
                {error && <p className="text-xs text-red-500 dark:text-red-400 text-center">{error}</p>}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-4 py-1">
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{match.homeScore}</span>
                <span className="text-gray-400">:</span>
                <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{match.awayScore}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Group Tournament MatchPlay ────────────────────────────────────────────────

function GroupMatchPlay({ tournament, dispatch }) {
  const { meta, bracket } = tournament;
  const [activeSection, setActiveSection] = useState(bracket.groups[0]?.id ?? null);
  const [activeKnockoutRound, setActiveKnockoutRound] = useState(0);

  const sections = [
    ...bracket.groups.map(g => ({ id: g.id, label: g.name, type: 'group', data: g })),
    ...(bracket.knockout ? [{ id: 'knockout', label: `${meta.knockoutSize}강 본선`, type: 'knockout', data: bracket.knockout }] : []),
  ];

  const activeS = sections.find(s => s.id === activeSection) ?? sections[0];

  const groupMatches = bracket.groups.flatMap(g => g.rounds.flatMap(r => r.matches));
  const knockoutMatches = bracket.knockout?.rounds.flatMap(r => r.matches) ?? [];
  const allMatches = [...groupMatches, ...knockoutMatches];
  const totalMatches = allMatches.filter(m => !m.isBye).length;
  const doneMatches = allMatches.filter(m => m.status === MATCH_STATUS.DONE).length;
  const progress = totalMatches > 0 ? Math.round((doneMatches / totalMatches) * 100) : 0;

  return (
    <>
      {/* Section tabs */}
      <div className="max-w-3xl mx-auto px-4 flex gap-0 overflow-x-auto">
        {sections.map(s => (
          <button key={s.id} onClick={() => { setActiveSection(s.id); setActiveKnockoutRound(0); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-1
              ${activeSection === s.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
            {s.type === 'knockout' && <Trophy size={12} className="text-amber-500" />}
            {s.label}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Knockout banner */}
      {bracket.knockout && activeSection !== 'knockout' && (
        <div className="max-w-3xl mx-auto px-4 pt-3">
          <button onClick={() => setActiveSection('knockout')}
            className="w-full flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 text-sm text-amber-700 dark:text-amber-400 font-medium">
            <Trophy size={14} /> 조별 리그 완료 — {meta.knockoutSize}강 본선 진행 중! 탭을 눌러 이동
          </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto p-4">
        {/* Group section: show all rounds vertically */}
        {activeS?.type === 'group' && (
          <div className="space-y-6">
            {activeS.data.rounds.map(round => (
              <div key={round.roundNum}>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                  {round.name}
                </div>
                <div className="space-y-3">
                  {round.matches.map(match => (
                    <MatchResultCard
                      key={match.id}
                      match={match}
                      roundName={`${activeS.data.name} ${round.name}`}
                      dispatch={dispatch}
                      allowDraw={true}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Knockout section: round tabs */}
        {activeS?.type === 'knockout' && bracket.knockout && (
          <div>
            <div className="flex gap-1.5 flex-wrap mb-4">
              {bracket.knockout.rounds.map((r, idx) => (
                <button key={r.roundNum} onClick={() => setActiveKnockoutRound(idx)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors
                    ${activeKnockoutRound === idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-blue-400'
                    }`}>
                  {r.name}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {bracket.knockout.rounds[activeKnockoutRound]?.matches.map(match => (
                <MatchResultCard
                  key={match.id}
                  match={match}
                  roundName={bracket.knockout.rounds[activeKnockoutRound].name}
                  dispatch={dispatch}
                  allowDraw={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Standard MatchPlay ────────────────────────────────────────────────────────

function StandardMatchPlay({ tournament, dispatch }) {
  const { bracket } = tournament;
  const rounds = bracket.rounds;
  const [activeRound, setActiveRound] = useState(0);

  const totalMatches = rounds.flatMap(r => r.matches).filter(m => !m.isBye).length;
  const doneMatches = rounds.flatMap(r => r.matches).filter(m => m.status === MATCH_STATUS.DONE).length;
  const progress = totalMatches > 0 ? Math.round((doneMatches / totalMatches) * 100) : 0;

  return (
    <>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700">
        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="max-w-3xl mx-auto px-4 flex gap-0 overflow-x-auto">
        {rounds.map((r, idx) => (
          <button key={r.roundNum} onClick={() => setActiveRound(idx)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
              ${activeRound === idx
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}>
            {r.name}
          </button>
        ))}
      </div>
      <div className="max-w-3xl mx-auto p-4">
        <div className="space-y-3">
          {rounds[activeRound]?.matches.map(match => (
            <MatchResultCard
              key={match.id}
              match={match}
              roundName={rounds[activeRound].name}
              dispatch={dispatch}
              allowDraw={tournament.meta.gameFormat === 'league'}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

export default function MatchPlay() {
  const { state, dispatch, asyncDispatch } = useContext(AppContext);
  const { tournament } = state;
  const { isLoggedIn, setModalOpen } = useAdmin();

  if (!tournament) return null;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 max-w-sm w-full text-center space-y-4">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-fit mx-auto">
            <Lock size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">관리자 전용 페이지</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">경기 결과 입력은 관리자만 가능합니다.</p>
          </div>
          <button onClick={() => setModalOpen(true)}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            관리자 로그인
          </button>
          <button onClick={() => asyncDispatch({ type: ACTIONS.BACK_TO_HOME })}
            className="w-full py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center gap-1">
            <ChevronLeft size={14} /> 홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isGroupTournament = tournament.meta.gameFormat === 'group_tournament';

  const groupMatches = isGroupTournament ? tournament.bracket.groups.flatMap(g => g.rounds.flatMap(r => r.matches)) : [];
  const knockoutMatches = isGroupTournament ? (tournament.bracket.knockout?.rounds.flatMap(r => r.matches) ?? []) : [];
  const regularMatches = isGroupTournament ? [] : tournament.bracket.rounds.flatMap(r => r.matches);
  const allForProgress = isGroupTournament ? [...groupMatches, ...knockoutMatches] : regularMatches;
  const totalMatches = allForProgress.filter(m => !m.isBye).length;
  const doneMatches = allForProgress.filter(m => m.status === MATCH_STATUS.DONE).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => asyncDispatch({ type: ACTIONS.BACK_TO_HOME })}
              className="flex items-center gap-0.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
              title="전체 목록">
              <ChevronLeft size={12} />
              <span className="hidden sm:inline">목록</span>
            </button>
            <button
              onClick={() => dispatch({ type: ACTIONS.SET_SCREEN, payload: { screen: SCREENS.DRAW } })}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <ChevronLeft size={16} /> 대진표
            </button>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900 dark:text-gray-100 text-sm">경기 진행</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{doneMatches}/{totalMatches} 경기 완료</div>
          </div>
          <button onClick={() => asyncDispatch({ type: ACTIONS.BACK_TO_HOME })}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700">
            홈 <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isGroupTournament
        ? <GroupMatchPlay tournament={tournament} dispatch={dispatch} />
        : <StandardMatchPlay tournament={tournament} dispatch={dispatch} />
      }
    </div>
  );
}

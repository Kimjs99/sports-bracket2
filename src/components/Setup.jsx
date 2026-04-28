import { useState, useContext } from 'react';
import { Plus, Trash2, Shuffle, AlertCircle, Lock, ChevronLeft } from 'lucide-react';
import { AppContext } from '../App';
import { ACTIONS } from '../store/actions';
import { useAdmin } from '../contexts/AdminContext';
import { SCHOOL_LEVELS, MIN_TEAMS, MAX_TEAMS, MAX_TEAM_NAME_LENGTH } from '../constants';

export default function Setup() {
  const { state, dispatch } = useContext(AppContext);
  const { setupMeta, setupTeams, ui } = state;
  const { requireAdmin, isLoggedIn } = useAdmin();
  const [newTeamName, setNewTeamName] = useState('');

  function addTeam() {
    const name = newTeamName.trim().slice(0, MAX_TEAM_NAME_LENGTH);
    if (!name) return;
    if (setupTeams.includes(name)) {
      dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: `"${name}" 팀이 이미 존재합니다.` } });
      return;
    }
    if (setupTeams.length >= MAX_TEAMS) {
      dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: `최대 ${MAX_TEAMS}팀까지 입력 가능합니다.` } });
      return;
    }
    dispatch({ type: ACTIONS.ADD_TEAM, payload: { name } });
    setNewTeamName('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') addTeam();
  }

  function updateTeam(index, value) {
    dispatch({ type: ACTIONS.UPDATE_TEAM, payload: { index, name: value.slice(0, MAX_TEAM_NAME_LENGTH) } });
  }

  function removeTeam(index) {
    dispatch({ type: ACTIONS.REMOVE_TEAM, payload: { index } });
  }

  function handleGenerate() {
    const emptyTeam = setupTeams.find(t => !t.trim());
    if (emptyTeam !== undefined) {
      dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: '빈 팀명이 있습니다. 모두 입력해주세요.' } });
      return;
    }
    const uniqueTeams = new Set(setupTeams.map(t => t.trim()));
    if (uniqueTeams.size !== setupTeams.length) {
      dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: '중복된 팀명이 있습니다.' } });
      return;
    }
    if (setupTeams.length < MIN_TEAMS) {
      dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: `최소 ${MIN_TEAMS}팀 이상 입력해야 합니다.` } });
      return;
    }
    requireAdmin(() => dispatch({ type: ACTIONS.GENERATE_BRACKET, payload: { seed: Date.now() } }));
  }

  const canGenerate = setupTeams.length >= MIN_TEAMS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-xl p-8">
        {/* Back button */}
        <button
          onClick={() => dispatch({ type: ACTIONS.BACK_TO_HOME })}
          className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
        >
          <ChevronLeft size={15} /> 전체 목록
        </button>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏀</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">새 대진 만들기</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">참가팀을 입력하고 대진을 생성하세요</p>
        </div>

        {/* School Level */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">학교급 선택</label>
          <div className="flex gap-3">
            {SCHOOL_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { schoolLevel: level } })}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all
                  ${setupMeta.schoolLevel === level
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {level}부
              </button>
            ))}
          </div>
        </div>

        {/* Team Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            참가팀 입력
            <span className="ml-2 text-blue-600 dark:text-blue-400 font-bold">{setupTeams.length}팀</span>
          </label>

          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="팀명 입력 후 Enter 또는 + 버튼"
              maxLength={MAX_TEAM_NAME_LENGTH}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
            <button
              onClick={addTeam}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {ui.errorMessage && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mb-3 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              <AlertCircle size={14} />
              {ui.errorMessage}
            </div>
          )}

          {setupTeams.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {setupTeams.map((team, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}</span>
                  <input
                    type="text"
                    value={team}
                    onChange={e => updateTeam(idx, e.target.value)}
                    maxLength={MAX_TEAM_NAME_LENGTH}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
                  />
                  <button
                    onClick={() => removeTeam(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
              참가팀을 입력해주세요
            </div>
          )}
        </div>

        {/* Bracket size preview */}
        {setupTeams.length >= MIN_TEAMS && (() => {
          const n = setupTeams.length;
          const bracketSize = n <= 1 ? 2 : Math.pow(2, Math.ceil(Math.log2(n)));
          const byeCount = bracketSize - n;
          const rounds = Math.log2(bracketSize);
          return (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm">
              <div className="font-semibold text-blue-800 dark:text-blue-300 mb-2">대진 미리보기</div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{bracketSize}강</div>
                  <div className="text-xs text-blue-500 dark:text-blue-400">브라켓</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{byeCount}</div>
                  <div className="text-xs text-orange-400">부전승</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{rounds}</div>
                  <div className="text-xs text-green-500 dark:text-green-400">라운드</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all
            ${canGenerate
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900 active:scale-95'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
        >
          {!isLoggedIn && canGenerate ? <Lock size={16} /> : <Shuffle size={20} />}
          대진 생성하기
        </button>
        {!isLoggedIn && canGenerate && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">관리자 로그인 필요</p>
        )}
      </div>
    </div>
  );
}

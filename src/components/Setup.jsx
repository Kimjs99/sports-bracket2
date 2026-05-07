import { useState, useContext, useRef } from 'react';
import { Plus, Trash2, Shuffle, AlertCircle, Lock, ChevronLeft, Upload } from 'lucide-react';
import { AppContext } from '../App';
import { ACTIONS } from '../store/actions';
import { useAdmin } from '../contexts/AdminContext';
import { SCHOOL_LEVELS, SPORTS, SPORT_EMOJI, GAME_FORMATS, MIN_TEAMS, MAX_TEAMS, MAX_TEAM_NAME_LENGTH } from '../constants';

function parseCSVText(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.split(',')[0].replace(/^["'\s]+|["'\s]+$/g, ''))
    .filter(name => name.length > 0);
}

async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv' || ext === 'txt') {
    const text = await file.text();
    return parseCSVText(text);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const { read, utils } = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const wb = read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json(ws, { header: 1 });
    return rows
      .map(row => String(row[0] ?? '').trim())
      .filter(name => name.length > 0);
  }
  return null;
}

export default function Setup() {
  const { state, dispatch } = useContext(AppContext);
  const { setupMeta, setupTeams, ui } = state;
  const { requireAdmin, isLoggedIn } = useAdmin();
  const [newTeamName, setNewTeamName] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

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

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    let names;
    try {
      names = await parseFile(file);
    } catch {
      dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: '파일을 읽을 수 없습니다.' } });
      return;
    }

    if (!names || names.length === 0) {
      dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: '팀명을 찾을 수 없습니다. 첫 번째 열에 팀명이 있는지 확인해주세요.' } });
      return;
    }

    let added = 0, skipped = 0;
    const current = [...setupTeams];
    for (const raw of names) {
      const name = raw.slice(0, MAX_TEAM_NAME_LENGTH);
      if (!name) { skipped++; continue; }
      if (current.includes(name)) { skipped++; continue; }
      if (current.length >= MAX_TEAMS) { skipped += names.length - added - skipped; break; }
      current.push(name);
      dispatch({ type: ACTIONS.ADD_TEAM, payload: { name } });
      added++;
    }
    setImportResult({ added, skipped });
    setTimeout(() => setImportResult(null), 3000);
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
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">학교급</label>
          <div className="flex gap-3">
            {SCHOOL_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { schoolLevel: level } })}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all
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

        {/* Sport */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">종목</label>
          <div className="flex flex-wrap gap-2">
            {SPORTS.map(sport => (
              <button
                key={sport}
                onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { sport } })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${setupMeta.sport === sport
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {SPORT_EMOJI[sport]} {sport}
              </button>
            ))}
          </div>
        </div>

        {/* Game Format */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">경기 방식</label>
          <div className="grid grid-cols-3 gap-2">
            {GAME_FORMATS.map(fmt => {
              const isLink = fmt.id === 'link';
              const isSelected = setupMeta.gameFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  disabled={isLink}
                  onClick={() => !isLink && dispatch({ type: ACTIONS.SET_META, payload: { gameFormat: fmt.id } })}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all
                    ${isLink ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700' :
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                >
                  <div className="font-semibold text-sm text-gray-800 dark:text-gray-100">{fmt.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{fmt.desc}</div>
                  {isSelected && !isLink && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>
              );
            })}
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
            <button
              onClick={() => fileInputRef.current?.click()}
              title="CSV / Excel 파일로 일괄 추가"
              className="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Upload size={18} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {importResult && (
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-sm mb-3 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
              <Upload size={14} />
              {importResult.added}팀 추가됨{importResult.skipped > 0 ? ` (${importResult.skipped}건 중복·초과로 건너뜀)` : ''}
            </div>
          )}

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

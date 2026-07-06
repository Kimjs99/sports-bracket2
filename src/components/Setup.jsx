import { useState, useContext, useRef } from 'react';
import { Plus, Trash2, Shuffle, AlertCircle, Lock, ChevronLeft, ChevronUp, ChevronDown, Upload, Download, Hand } from 'lucide-react';
import { AppContext } from '../App';
import { ACTIONS } from '../store/actions';
import { useAdmin } from '../contexts/AdminContext';
import { SCHOOL_LEVELS, GENDER_TYPES, SPORTS, SPORT_EMOJI, GAME_FORMATS, GRADE_OPTIONS, MIN_TEAMS, MAX_TEAMS, MAX_TEAM_NAME_LENGTH } from '../constants';
import { calcGroupConfig, distributeByes, nextPowerOfTwo } from '../utils/tournament';

// 수동 배정 시 1라운드 대진 미리보기 (buildFirstRoundMatches와 동일한 배치 규칙)
function previewFirstRound(teams) {
  const bracketSize = nextPowerOfTwo(teams.length);
  const byeSet = new Set(distributeByes(bracketSize, bracketSize - teams.length));
  const pairs = [];
  let cursor = 0;
  for (let p = 0; p < bracketSize / 2; p++) {
    const isBye = byeSet.has(p);
    const home = teams[cursor++] ?? null;
    const away = isBye ? null : (teams[cursor++] ?? null);
    pairs.push({ home, away, isBye });
  }
  return pairs;
}

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
  const { requireAdmin, isLoggedIn, orgId } = useAdmin();
  const [newTeamName, setNewTeamName] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [groupAssign, setGroupAssign] = useState({}); // 팀명 → 조 인덱스 (수동 조 배정)
  const fileInputRef = useRef(null);

  const isManual = setupMeta.placement === 'manual';
  // 리그전 7팀 이상은 조별리그로 자동 승격 → 수동 배정 = 조 직접 지정
  const isGroupMode = isManual && setupMeta.gameFormat === 'league' && setupTeams.length >= 7;
  const groupCount = isGroupMode ? calcGroupConfig(setupTeams.length).groupCount : 0;
  const groupIdOf = idx => String.fromCharCode(65 + idx);

  // 지정 안 된 팀은 기본값(i % groupCount)으로 배정
  function assignedGroupIdx(team, i) {
    const v = groupAssign[team];
    return Number.isInteger(v) && v >= 0 && v < groupCount ? v : i % groupCount;
  }

  function buildManualGroups() {
    const groups = Array.from({ length: groupCount }, () => []);
    setupTeams.forEach((team, i) => groups[assignedGroupIdx(team, i)].push(team));
    return groups;
  }

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
    let manualGroups = null;
    if (isGroupMode) {
      manualGroups = buildManualGroups();
      const tooSmall = manualGroups.findIndex(g => g.length < 2);
      if (tooSmall !== -1) {
        dispatch({ type: ACTIONS.SET_UI_ERROR, payload: { message: `${groupIdOf(tooSmall)}조에 최소 2팀이 필요합니다. 조 배정을 조정해주세요.` } });
        return;
      }
    }
    requireAdmin(() => dispatch({ type: ACTIONS.GENERATE_BRACKET, payload: { seed: Date.now(), orgId, manualGroups } }));
  }

  function downloadTemplate() {
    const rows = ['팀명', '홍익중학교', '세종고등학교', '한강초등학교', '대한고등학교'];
    const csv = '﻿' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '참가팀_양식.csv';
    a.click();
    URL.revokeObjectURL(url);
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

        {/* School Level + Gender */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">학교급 · 종별</label>
          <div className="flex gap-2 mb-2">
            {SCHOOL_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { schoolLevel: level, grade: null } })}
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
          <div className="flex gap-2">
            {GENDER_TYPES.map(gender => (
              <button
                key={gender}
                onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { gender } })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
                  ${setupMeta.gender === gender
                    ? gender === '남성' ? 'bg-sky-500 text-white shadow-sm'
                      : gender === '여성' ? 'bg-pink-500 text-white shadow-sm'
                      : 'bg-violet-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {gender}
              </button>
            ))}
          </div>
        </div>

        {/* Grade (Optional) */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            학년 <span className="text-gray-400 dark:text-gray-500 font-normal text-xs">(선택)</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { grade: null } })}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                ${setupMeta.grade === null
                  ? 'bg-gray-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
            >
              구분 없음
            </button>
            {(GRADE_OPTIONS[setupMeta.schoolLevel] ?? []).map(grade => (
              <button
                key={grade}
                onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { grade } })}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${setupMeta.grade === grade
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>

        {/* Sport */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">종목</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none select-none">
              {SPORT_EMOJI[setupMeta.sport] ?? '🏅'}
            </span>
            <select
              value={setupMeta.sport}
              onChange={e => dispatch({ type: ACTIONS.SET_META, payload: { sport: e.target.value } })}
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-xl pl-10 pr-8 py-2.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              {SPORTS.map(sport => (
                <option key={sport} value={sport}>
                  {SPORT_EMOJI[sport]} {sport}
                </option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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

        {/* Placement method */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">대진 배정 방식</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'random', label: '자동 추첨', desc: '무작위로 대진 결정', Icon: Shuffle },
              { id: 'manual', label: '수동 배정', desc: '순서·조를 직접 지정', Icon: Hand },
            ].map(({ id, label, desc, Icon }) => {
              const isSelected = (setupMeta.placement ?? 'random') === id;
              return (
                <button
                  key={id}
                  onClick={() => dispatch({ type: ACTIONS.SET_META, payload: { placement: id } })}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-gray-800 dark:text-gray-100">
                    <Icon size={14} /> {label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{desc}</div>
                  {isSelected && <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />}
                </button>
              );
            })}
          </div>
          {isManual && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
              {setupMeta.gameFormat === 'tournament'
                ? '팀 목록 순서대로 1·2번, 3·4번… 팀이 맞붙습니다. 화살표로 순서를 조정하세요.'
                : setupTeams.length >= 7
                  ? '7팀 이상 리그전은 조별리그로 진행됩니다. 각 팀의 조를 직접 지정하세요 (조당 최소 2팀).'
                  : '리그전은 모든 팀이 서로 경기합니다. 입력 순서는 라운드 편성 순서에만 영향을 줍니다.'}
            </p>
          )}
        </div>

        {/* Team Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            참가팀 입력
            <span className="ml-2 text-blue-600 dark:text-blue-400 font-bold">{setupTeams.length}팀</span>
          </label>

          <div className="flex gap-2 mb-2">
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

          <div className="flex gap-2 mb-3">
            <button
              onClick={downloadTemplate}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download size={13} /> 양식 내려받기
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Upload size={13} /> 파일 올리기
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
                    className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 dark:text-gray-100 focus:outline-none"
                  />
                  {isGroupMode && (
                    groupCount <= 4 ? (
                      <div className="flex gap-1">
                        {Array.from({ length: groupCount }, (_, g) => (
                          <button
                            key={g}
                            onClick={() => setGroupAssign(prev => ({ ...prev, [team]: g }))}
                            className={`w-6 h-6 rounded-md text-[11px] font-bold transition-colors
                              ${assignedGroupIdx(team, idx) === g
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-500'
                              }`}
                          >
                            {groupIdOf(g)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <select
                        value={assignedGroupIdx(team, idx)}
                        onChange={e => setGroupAssign(prev => ({ ...prev, [team]: Number(e.target.value) }))}
                        className="text-xs border border-gray-300 dark:border-gray-500 rounded-md px-1.5 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-100 focus:outline-none"
                      >
                        {Array.from({ length: groupCount }, (_, g) => (
                          <option key={g} value={g}>{groupIdOf(g)}조</option>
                        ))}
                      </select>
                    )
                  )}
                  {isManual && !isGroupMode && (
                    <div className="flex flex-col -my-1">
                      <button
                        onClick={() => dispatch({ type: ACTIONS.MOVE_TEAM, payload: { index: idx, direction: -1 } })}
                        disabled={idx === 0}
                        className="text-gray-400 hover:text-blue-500 disabled:opacity-25 disabled:hover:text-gray-400 transition-colors"
                        aria-label="위로 이동"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => dispatch({ type: ACTIONS.MOVE_TEAM, payload: { index: idx, direction: 1 } })}
                        disabled={idx === setupTeams.length - 1}
                        className="text-gray-400 hover:text-blue-500 disabled:opacity-25 disabled:hover:text-gray-400 transition-colors"
                        aria-label="아래로 이동"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  )}
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
        {/* 브라켓 수치는 토너먼트에만 의미 있음 (리그전은 라운드로빈/조별리그) */}
        {setupMeta.gameFormat === 'tournament' && setupTeams.length >= MIN_TEAMS && (() => {
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

        {/* Manual placement: round-1 pairing preview */}
        {isManual && setupMeta.gameFormat === 'tournament' && setupTeams.length >= MIN_TEAMS && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-sm">
            <div className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
              <Hand size={13} /> 1라운드 대진 (입력 순서 기준)
            </div>
            <div className="space-y-1.5">
              {previewFirstRound(setupTeams).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-amber-500 dark:text-amber-400 w-10 shrink-0">{i + 1}경기</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{p.home}</span>
                  <span className="text-gray-400 shrink-0">vs</span>
                  {p.isBye
                    ? <span className="text-orange-500 dark:text-orange-400 font-medium shrink-0">부전승</span>
                    : <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{p.away}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manual placement: group assignment summary */}
        {isGroupMode && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-sm">
            <div className="font-semibold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
              <Hand size={13} /> 조 편성 미리보기
            </div>
            <div className="grid grid-cols-2 gap-2">
              {buildManualGroups().map((g, i) => (
                <div key={i} className={`rounded-lg px-3 py-2 border text-xs
                  ${g.length < 2
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                    : 'border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800'}`}
                >
                  <div className="font-bold text-gray-800 dark:text-gray-100 mb-1 flex items-center justify-between">
                    <span>{groupIdOf(i)}조</span>
                    <span className={g.length < 2 ? 'text-red-500' : 'text-gray-400'}>{g.length}팀</span>
                  </div>
                  {g.length === 0
                    ? <div className="text-red-500">팀을 배정해주세요</div>
                    : <div className="text-gray-600 dark:text-gray-300 leading-relaxed">{g.join(', ')}</div>}
                  {g.length === 1 && <div className="text-red-500 mt-0.5">최소 2팀 필요</div>}
                </div>
              ))}
            </div>
          </div>
        )}

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
          {!isLoggedIn && canGenerate ? <Lock size={16} /> : isManual ? <Hand size={20} /> : <Shuffle size={20} />}
          대진 생성하기
        </button>
        {!isLoggedIn && canGenerate && (
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">관리자 로그인 필요</p>
        )}
      </div>
    </div>
  );
}

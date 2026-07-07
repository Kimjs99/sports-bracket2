// 종목 카드 그리드용 학년/종목 필터 칩 (관리자 홈·게스트 공용).
// 필터할 값이 2개 이상일 때만 해당 행을 노출한다.
function ChipRow({ title, options, value, onChange, format }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium shrink-0 w-7">{title}</span>
      <button
        onClick={() => onChange(null)}
        className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors
          ${value === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
      >
        전체
      </button>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors
            ${value === opt
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          {format ? format(opt) : opt}
        </button>
      ))}
    </div>
  );
}

export default function SportFilterBar({ groups, gradeFilter, setGradeFilter, sportFilter, setSportFilter }) {
  const grades = [...new Set(groups.map(g => g.grade ?? ''))].sort();
  const sports = [...new Set(groups.map(g => g.sport))].sort();
  if (grades.length <= 1 && sports.length <= 1) return null;

  return (
    <div className="space-y-1.5 mb-3">
      {grades.length > 1 && (
        <ChipRow title="학년" options={grades} value={gradeFilter} onChange={setGradeFilter}
          format={g => g === '' ? '구분 없음' : g} />
      )}
      {sports.length > 1 && (
        <ChipRow title="종목" options={sports} value={sportFilter} onChange={setSportFilter} />
      )}
    </div>
  );
}

// 필터 적용 헬퍼
// eslint-disable-next-line react-refresh/only-export-components
export function filterSportGroups(groups, gradeFilter, sportFilter) {
  return groups.filter(g =>
    (gradeFilter === null || (g.grade ?? '') === gradeFilter) &&
    (sportFilter === null || g.sport === sportFilter)
  );
}

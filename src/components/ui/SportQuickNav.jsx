import { SPORT_EMOJI } from '../../constants';

// 종목 상세 타이틀 우측의 타 종목 바로가기 칩 — 목록으로 돌아가지 않고 다른 종목으로 즉시 전환
export default function SportQuickNav({ groups, activeKey, onSelect }) {
  const others = groups.filter(g => g.key !== activeKey);
  if (others.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-full sm:max-w-[60%]">
      <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0">다른 종목</span>
      {others.map(g => {
        const subLabel = [g.grade, g.gender !== '혼성' ? g.gender : null].filter(Boolean).join(', ');
        return (
          <button
            key={g.key}
            onClick={() => onSelect(g)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <span>{SPORT_EMOJI[g.sport] ?? '🏅'}</span>
            {g.sport}{subLabel && <span className="text-gray-400 dark:text-gray-500">({subLabel})</span>}
          </button>
        );
      })}
    </div>
  );
}

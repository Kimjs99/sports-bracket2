import { useMemo } from 'react';
import { CalendarDays, Trophy, Swords, MapPin, Clock } from 'lucide-react';
import { collectDailyResults } from '../../utils/tournament';
import { SPORT_EMOJI } from '../../constants';

function formatDay(date) {
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d)) return date;
  return d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

// 완료된 경기를 일자별로 묶어 보여주는 공용 뷰 (관리자 홈·게스트 공용, 열람 전용)
export default function DailyResults({ tournaments }) {
  const days = useMemo(() => collectDailyResults(tournaments), [tournaments]);

  if (days.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-500">
        <Swords size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">완료된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {days.map(day => (
        <section key={day.date ?? 'no-date'}>
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={13} className="text-blue-500 shrink-0" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {day.date ? formatDay(day.date) : '일자 미지정'}
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">{day.items.length}경기</span>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-50 dark:divide-gray-700/50 overflow-hidden">
            {day.items.map(({ label, roundName, match }) => {
              const sport = label.split(' (')[0];
              return (
                <div key={`${label}_${match.id}`} className="px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-gray-400 dark:text-gray-500 mb-1">
                    <span className="truncate">{SPORT_EMOJI[sport] ?? '🏅'} {label} · {roundName}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {match.time && <span className="flex items-center gap-0.5"><Clock size={9} />{match.time}</span>}
                      {match.venue && <span className="flex items-center gap-0.5"><MapPin size={9} />{match.venue}</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`flex-1 text-right font-medium truncate ${match.winner === match.home ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {match.home}{match.winner === match.home && <Trophy size={11} className="inline ml-1 text-orange-400" />}
                    </span>
                    <span className="mx-3 font-bold text-gray-800 dark:text-gray-200 shrink-0 tabular-nums">
                      {match.homeScore} : {match.awayScore}
                    </span>
                    <span className={`flex-1 font-medium truncate ${match.winner === match.away ? 'text-orange-700 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {match.winner === match.away && <Trophy size={11} className="inline mr-1 text-orange-400" />}{match.away}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

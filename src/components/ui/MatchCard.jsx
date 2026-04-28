import { Trophy, ArrowRight, Calendar, Clock } from 'lucide-react';
import { MATCH_STATUS } from '../../constants';

function ByePassCard({ teamName }) {
  return (
    <div style={{ minWidth: 148, margin: '0 4px' }} className="overflow-hidden rounded-lg">
      <div className="flex items-center gap-2 px-3 py-[7px] bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 rounded-t-lg">
        <ArrowRight size={11} className="text-blue-400 flex-shrink-0" />
        <span className="flex-1 text-xs font-bold text-blue-700 dark:text-blue-400 truncate" style={{ maxWidth: 90 }}>
          {teamName ?? '—'}
        </span>
        <span className="text-[9px] font-semibold text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-full flex-shrink-0">
          부전승
        </span>
      </div>
      <div className="flex items-center gap-1 px-3 py-[6px] bg-blue-50/60 dark:bg-blue-900/10 border border-t-0 border-blue-100 dark:border-blue-900 rounded-b-lg">
        <span className="text-[10px] text-blue-300 dark:text-blue-500 italic">다음 라운드 직행</span>
      </div>
    </div>
  );
}

export default function MatchCard({ match }) {
  const { home, away, winner, status, homeScore, awayScore, date, time } = match;

  const isDone = status === MATCH_STATUS.DONE;
  const isByeMatch = status === MATCH_STATUS.BYE;

  if (isByeMatch) {
    return <ByePassCard teamName={home} />;
  }

  const TeamRow = ({ name, score, isWinner }) => {
    const isEmpty = name === null || name === undefined;
    return (
      <div
        className={`flex items-center justify-between px-2 py-[6px] text-xs
          ${isWinner ? 'bg-orange-50 dark:bg-orange-900/20 font-bold text-orange-700 dark:text-orange-400' : ''}
          ${isEmpty ? 'text-gray-300 dark:text-gray-600' : ''}
          ${!isWinner && !isEmpty ? 'text-gray-700 dark:text-gray-300' : ''}
        `}
      >
        <span className="truncate" style={{ maxWidth: 100 }}>
          {isEmpty ? '—' : name}
        </span>
        {isDone && !isEmpty && (
          <span className={`ml-1 font-mono text-[11px] ${isWinner ? 'text-orange-700 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {score ?? 0}
          </span>
        )}
        {isWinner && isDone && <Trophy size={10} className="ml-1 text-orange-400 flex-shrink-0" />}
      </div>
    );
  };

  const borderColor = isDone ? 'border-green-200 dark:border-green-800' : 'border-gray-200 dark:border-gray-700';
  const bgColor = isDone ? 'bg-green-50 dark:bg-green-900/10' : 'bg-white dark:bg-gray-800';

  return (
    <div
      className={`border ${borderColor} ${bgColor} rounded-lg shadow-sm mx-1 overflow-hidden`}
      style={{ minWidth: 148 }}
    >
      <TeamRow name={home} score={homeScore} isWinner={isDone && winner === home} />
      <div className="border-t border-gray-100 dark:border-gray-700" />
      <TeamRow name={away} score={awayScore} isWinner={isDone && winner === away} />
      {(date || time) && (
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
          {date && (
            <span className="flex items-center gap-0.5 text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              <Calendar size={8} className="flex-shrink-0" />
              {date}
            </span>
          )}
          {time && (
            <span className="flex items-center gap-0.5 text-[9px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
              <Clock size={8} className="flex-shrink-0" />
              {time}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

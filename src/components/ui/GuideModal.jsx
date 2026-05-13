import { X, UserPlus, LogIn, Trophy, Calendar, Swords, Download, LogOut, AlertTriangle, Share2 } from 'lucide-react';

const SECTIONS = [
  {
    id: 'register',
    icon: UserPlus,
    color: 'text-purple-600 dark:text-purple-400',
    title: '처음 사용하는 학교 — 등록',
    content: (
      <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
        <li>앱 첫 화면에서 <b>"새 학교/기관 등록"</b> 버튼을 누릅니다.</li>
        <li>다음 항목을 입력합니다.
          <ul className="mt-1.5 ml-4 space-y-1 list-none text-gray-600 dark:text-gray-400">
            <li>• <b>학교명</b>: 예) 서울중학교</li>
            <li>• <b>식별자(영문)</b>: 학교명 입력 시 자동 생성. 영문·숫자·하이픈만 허용.</li>
            <li>• <b>비밀번호</b>: <span className="text-red-600 dark:text-red-400 font-medium">분실 시 복구 불가</span> — 반드시 기록해 두세요.</li>
          </ul>
        </li>
        <li><b>"등록하기"</b>를 누르면 계정 생성 후 자동 로그인됩니다.</li>
      </ol>
    ),
  },
  {
    id: 'login',
    icon: LogIn,
    color: 'text-blue-600 dark:text-blue-400',
    title: '기존 학교 — 로그인',
    content: (
      <ol className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
        <li>첫 화면에서 목록을 스크롤하거나 검색창에 학교명을 입력합니다.</li>
        <li>학교를 선택하면 비밀번호 입력 창이 나타납니다.</li>
        <li>비밀번호를 입력하고 <b>"로그인"</b>을 누릅니다.</li>
      </ol>
    ),
  },
  {
    id: 'create',
    icon: Trophy,
    color: 'text-amber-600 dark:text-amber-400',
    title: '대진 생성',
    content: (
      <div className="space-y-3">
        <ol className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
          <li>홈 화면 <b>"+ 새 대진 생성"</b> 버튼을 누릅니다.</li>
          <li>학교급 / 성별 / 종목 / 경기 방식을 선택합니다.</li>
          <li><b>학년</b>을 선택합니다. <span className="text-gray-500 dark:text-gray-400 text-xs">(선택 사항 — 학년별 경기가 아닌 경우 "구분 없음" 유지)</span>
            <ul className="mt-1 ml-4 space-y-0.5 text-xs text-gray-500 dark:text-gray-400 list-none">
              <li>• 초등: 1~6학년 / 중등·고등: 1~3학년</li>
              <li>• 선택한 학년은 대진표 제목과 파일명에 표시됩니다.</li>
            </ul>
          </li>
          <li>팀 이름을 직접 입력하거나 CSV·Excel 파일을 업로드합니다.</li>
          <li><b>"대진 생성"</b>을 누릅니다.</li>
        </ol>
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left font-medium">방식</th>
                <th className="px-3 py-2 text-left font-medium">조건</th>
                <th className="px-3 py-2 text-left font-medium">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <td className="px-3 py-2 font-medium">토너먼트</td>
                <td className="px-3 py-2">팀 수 무관</td>
                <td className="px-3 py-2">단판 승부, 패자 탈락</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">리그전</td>
                <td className="px-3 py-2">≤6팀</td>
                <td className="px-3 py-2">전팀 맞대결, 무승부 허용</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">조별+토너먼트</td>
                <td className="px-3 py-2">리그전 + 7팀↑</td>
                <td className="px-3 py-2">자동 전환, 조별 완료 후 토너먼트 진출</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'schedule',
    icon: Calendar,
    color: 'text-cyan-600 dark:text-cyan-400',
    title: '경기 일정 입력',
    content: (
      <ol className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
        <li>대진 화면에서 <b>"일정 입력"</b> 탭을 선택합니다.</li>
        <li>각 경기의 날짜 / 시간 / 장소를 입력합니다.</li>
        <li>입력한 일정은 대진표 카드에 표시됩니다.</li>
      </ol>
    ),
  },
  {
    id: 'result',
    icon: Swords,
    color: 'text-green-600 dark:text-green-400',
    title: '경기 결과 입력',
    content: (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <ol className="space-y-1.5 list-decimal list-inside">
          <li>홈 화면에서 대진 선택 후 <b>"경기 진행"</b>을 누릅니다.</li>
          <li>라운드(또는 조)별 탭에서 경기를 확인합니다.</li>
          <li>홈 팀 점수 / 어웨이 팀 점수를 입력 후 <b>"결과 저장"</b>을 누릅니다.</li>
        </ol>
        <ul className="mt-1 ml-4 space-y-1 text-gray-500 dark:text-gray-400 text-xs list-none">
          <li>• <b>토너먼트</b>: 동점 불가, 승자가 다음 라운드에 자동 배정</li>
          <li>• <b>리그전</b>: 무승부 허용, 순위 자동 계산 (승점→득실차→득점)</li>
          <li>• <b>조별리그+토너먼트</b>: 조별 전 경기 완료 시 녹아웃 대진 자동 생성</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'download',
    icon: Download,
    color: 'text-indigo-600 dark:text-indigo-400',
    title: '대진표 보기 및 다운로드',
    content: (
      <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-none">
        <li>• 대진 화면 <b>"대진표"</b> 탭에서 브라켓 또는 순위표를 확인합니다.</li>
        <li>• 우상단 <b>다운로드</b> 버튼으로 PNG / JPG / PDF 형식으로 저장할 수 있습니다.</li>
      </ul>
    ),
  },
  {
    id: 'guest',
    icon: Share2,
    color: 'text-teal-600 dark:text-teal-400',
    title: '게스트 URL — 외부 공유',
    content: (
      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
        <p>로그인 없이 대진 현황을 열람할 수 있는 링크를 공유할 수 있습니다.</p>
        <ol className="space-y-1.5 list-decimal list-inside">
          <li>홈 화면 상단 <b>"게스트 URL"</b> 버튼을 누르면 링크가 클립보드에 복사됩니다.</li>
          <li>복사된 링크를 학생·학부모·교직원에게 공유하세요.</li>
          <li>링크를 열면 해당 학교의 대진 현황을 로그인 없이 열람할 수 있습니다.</li>
        </ol>
        <ul className="mt-1 ml-1 space-y-1 text-xs text-gray-500 dark:text-gray-400 list-none">
          <li>• 게스트는 <b>열람만</b> 가능합니다. 결과 입력·대진 수정은 불가합니다.</li>
          <li>• 링크 형식: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">…/?view=학교식별자</span></li>
          <li>• 게스트 화면 우상단 <b>"관리자"</b> 버튼으로 로그인 화면으로 이동할 수 있습니다.</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'logout',
    icon: LogOut,
    color: 'text-gray-600 dark:text-gray-400',
    title: '로그아웃',
    content: (
      <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-none">
        <li>• 화면 <b>우하단 플로팅 바</b>의 학교명 버튼을 누릅니다.</li>
        <li>• <b>"로그아웃"</b>을 누르면 로그아웃됩니다.</li>
        <li>• 로그아웃 후 다른 학교로 로그인하면 이전 학교 데이터는 표시되지 않습니다.</li>
      </ul>
    ),
  },
  {
    id: 'caution',
    icon: AlertTriangle,
    color: 'text-red-600 dark:text-red-400',
    title: '주의사항',
    content: (
      <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-none">
        <li>• <b className="text-red-600 dark:text-red-400">비밀번호 분실 시 복구 불가</b> — 이메일 재설정 기능이 없습니다. 반드시 기록해 두세요.</li>
        <li>• <b>데이터 격리</b> — 각 학교의 대진은 완전히 분리됩니다. 다른 학교에서는 조회할 수 없습니다.</li>
        <li>• <b>조별 경기 수정</b> — 조별 결과를 수정하면 녹아웃 대진이 초기화됩니다.</li>
        <li>• <b>다크 모드</b> — 우하단 플로팅 바의 아이콘으로 전환할 수 있습니다.</li>
      </ul>
    ),
  },
];

export default function GuideModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">사용 가이드</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">학교스포츠클럽 대진관리 시스템</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {SECTIONS.map(({ id, icon: Icon, color, title, content }) => (
            <section key={id} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
                <Icon size={15} className={color} />
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
              </div>
              <div className="px-4 py-3">{content}</div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">© 2026 kimjs · 학교스포츠클럽 대진관리</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-80 transition-opacity"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

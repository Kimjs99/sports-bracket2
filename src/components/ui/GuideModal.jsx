import { useState } from 'react';
import {
  X, ShieldCheck, Users,
  UserPlus, LogIn, Trophy, RefreshCw, CalendarDays, Swords,
  Bell, Download, Share2, LogOut, AlertTriangle,
  Search, Palette, ChevronDown, ChevronUp,
} from 'lucide-react';

const ADMIN_SECTIONS = [
  {
    icon: UserPlus,
    title: '처음 사용하는 학교 — 등록',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    steps: [
      '앱 첫 화면에서 "새 학교/기관 등록" 버튼을 누릅니다.',
      '학교명, 식별자(영문·숫자·하이픈), 비밀번호를 입력합니다.',
      '"등록하기"를 누르면 계정 생성 후 자동 로그인됩니다.',
    ],
    note: '비밀번호 분실 시 복구 불가 — 이메일 재설정 기능이 없습니다. 반드시 기록해 두세요.',
  },
  {
    icon: LogIn,
    title: '기존 학교 — 로그인',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    steps: [
      '첫 화면에서 학교를 검색하거나 목록에서 선택합니다.',
      '비밀번호를 입력하고 "로그인"을 누릅니다.',
    ],
  },
  {
    icon: Trophy,
    title: '새 대진 만들기',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    steps: [
      '홈 화면 "+ 새 대진 생성" 버튼을 누릅니다.',
      '학교급 / 성별 / 종목 / 경기 방식을 선택합니다.',
      '학년을 선택합니다. (선택 사항 — 학년별 경기가 아니면 "구분 없음" 유지. 초등 1~6학년 / 중등·고등 1~3학년)',
      '팀 이름을 직접 입력하거나 CSV·Excel 파일을 업로드합니다.',
      '"대진 생성"을 누릅니다.',
    ],
    note: '리그전 7팀 이상은 조별 리그+토너먼트로 자동 전환됩니다.',
  },
  {
    icon: RefreshCw,
    title: '대진 재구성',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    steps: [
      '대진표 화면 → "재구성" 버튼을 누릅니다.',
      '확인 팝업에서 재구성을 누르면 팀 배정이 새로 무작위 생성됩니다.',
    ],
  },
  {
    icon: CalendarDays,
    title: '경기 일정 입력',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    steps: [
      '대진표 화면 → 상단 "일정 입력" 탭을 선택합니다.',
      '각 경기의 날짜 / 시간 / 장소를 입력합니다.',
      '입력한 일정은 대진표 카드에 표시됩니다.',
    ],
  },
  {
    icon: Swords,
    title: '경기 결과 입력',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    steps: [
      '홈 대시보드 → "경기 진행" 버튼을 누릅니다.',
      '라운드(또는 조)별 탭에서 경기를 확인합니다.',
      '홈 팀 · 어웨이 팀 점수를 입력 후 "결과 저장"을 누릅니다.',
      '잘못 입력한 경우 ✏️ 수정 아이콘으로 재입력 가능합니다.',
    ],
    note: '토너먼트는 동점 불가 — 연장전 결과를 입력하세요. 리그전은 무승부 허용.',
  },
  {
    icon: Bell,
    title: '공지 작성 및 삭제',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    steps: [
      '홈 대시보드 → "공지" 탭을 선택합니다.',
      '제목과 내용 입력 후 "공지 등록" 버튼을 누릅니다.',
      '등록된 공지 우측 휴지통 아이콘으로 삭제합니다.',
    ],
  },
  {
    icon: Download,
    title: '대진표 다운로드',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    steps: [
      '대진표 화면 우상단 다운로드 버튼을 누릅니다.',
      'PNG / JPG / PDF 중 원하는 형식을 선택합니다.',
    ],
  },
  {
    icon: Share2,
    title: '게스트 URL 공유',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    steps: [
      '홈 화면 상단 "게스트 URL" 버튼을 누르면 링크가 클립보드에 복사됩니다.',
      '복사된 링크를 학생·학부모·교직원에게 공유하세요.',
      '링크를 열면 로그인 없이 대진 현황을 열람할 수 있습니다.',
    ],
    note: '게스트는 열람만 가능합니다. 결과 입력·대진 수정은 불가합니다.',
  },
  {
    icon: LogOut,
    title: '로그아웃',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700/40',
    steps: [
      '화면 우하단 플로팅 바의 학교명 버튼을 누릅니다.',
      '"로그아웃"을 누릅니다.',
    ],
  },
  {
    icon: AlertTriangle,
    title: '주의사항',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    steps: [
      '비밀번호 분실 시 복구 불가 — 반드시 기록해 두세요.',
      '조별 경기 결과를 수정하면 녹아웃 대진이 초기화됩니다.',
      '데이터는 학교별로 완전히 격리됩니다. 다른 학교의 대진은 조회할 수 없습니다.',
    ],
  },
];

const GUEST_SECTIONS = [
  {
    icon: Trophy,
    title: '대진 열람',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    desc: '로그인 후 대시보드에서 학교급(초등·중등·고등) 탭을 선택하고 종목 카드를 눌러 대진 현황을 확인합니다.',
    table: [
      { tab: '현황', desc: '참가팀 수, 진행률, 최종 순위(종료 시)' },
      { tab: '학교 조회', desc: '팀명으로 경기 일정·결과·승패 통계 확인' },
      { tab: '대진표', desc: '전체 토너먼트 브라켓 또는 리그 순위표' },
      { tab: '결과 피드', desc: '완료된 경기 목록(최신순), 스코어·승자 표시' },
      { tab: '공지', desc: '대회 관련 공지사항' },
    ],
  },
  {
    icon: Share2,
    title: '게스트 URL로 접근',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    steps: [
      '관리자가 공유한 링크(…/?view=학교식별자)를 브라우저에서 엽니다.',
      '로그인 없이 해당 학교의 전체 대진 현황을 열람할 수 있습니다.',
      '게스트 화면 우상단 "관리자" 버튼으로 로그인 화면으로 이동할 수 있습니다.',
    ],
    note: '게스트는 열람만 가능합니다. 결과 입력·대진 수정은 불가합니다.',
  },
  {
    icon: Search,
    title: '학교별 경기 조회',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    steps: [
      '대진 화면 → "학교 조회" 탭을 선택합니다.',
      '검색창에 학교명을 입력하거나 팀 버튼을 누릅니다.',
      '해당 팀의 경기 일정, 결과, 승패 기록을 확인합니다.',
    ],
  },
  {
    icon: Palette,
    title: '테마 변경',
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    steps: [
      '화면 우하단 플로팅 바의 테마 버튼(☀️ / 🌙 / 🖥)을 누릅니다.',
      '라이트 → 다크 → 시스템 자동 순서로 전환됩니다.',
    ],
  },
];

function AccordionItem({ item, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = item.icon;

  return (
    <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${item.bg}`}>
            <Icon size={15} className={item.color} />
          </div>
          <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{item.title}</span>
        </div>
        {open
          ? <ChevronUp size={15} className="text-gray-400 shrink-0" />
          : <ChevronDown size={15} className="text-gray-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700/50">
          {item.desc && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{item.desc}</p>
          )}
          {item.table && (
            <div className="rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 mb-3">
              {item.table.map((row, i) => (
                <div key={i} className={`flex gap-3 px-3 py-2 text-xs ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/40' : 'bg-white dark:bg-gray-800'}`}>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 shrink-0 w-16">{row.tab}</span>
                  <span className="text-gray-600 dark:text-gray-300">{row.desc}</span>
                </div>
              ))}
            </div>
          )}
          {item.steps && (
            <ol className="space-y-2">
              {item.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 ${item.color.split(' ')[0].replace('text-', 'bg-')}`}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
          {item.note && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 border-l-2 border-gray-300 dark:border-gray-500">
              💡 {item.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GuideModal({ onClose, defaultTab = 'guest' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">사용 가이드</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">학교스포츠클럽 대진관리 시스템</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 shrink-0 px-5">
          <button
            onClick={() => setActiveTab('guest')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors
              ${activeTab === 'guest'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <Users size={15} /> 게스트
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors
              ${activeTab === 'admin'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 dark:border-orange-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            <ShieldCheck size={15} /> 관리자
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
          {activeTab === 'guest' && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                로그인 없이 이용 가능한 기능입니다.
              </p>
              {GUEST_SECTIONS.map((s, i) => (
                <AccordionItem key={s.title} item={s} defaultOpen={i === 0} />
              ))}
            </>
          )}
          {activeTab === 'admin' && (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                관리자 로그인 후 이용 가능한 기능입니다.
              </p>
              {ADMIN_SECTIONS.map((s, i) => (
                <AccordionItem key={s.title} item={s} defaultOpen={i === 0} />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-between">
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

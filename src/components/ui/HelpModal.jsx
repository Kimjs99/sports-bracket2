import { useState } from 'react';
import {
  X, ShieldCheck, Users,
  UserPlus, Trophy, RefreshCw, CalendarDays, Swords,
  Bell, Download, Search, Palette, ChevronDown, ChevronUp,
} from 'lucide-react';

const ADMIN_SECTIONS = [
  {
    icon: UserPlus,
    title: '관리자 계정 만들기',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    steps: [
      '화면 우하단 자물쇠(🔒) 버튼 또는 헤더의 관리자 버튼 클릭',
      '처음 실행 시 계정 만들기 화면이 표시됨',
      '아이디와 비밀번호(4자 이상) 입력 후 저장',
      '이후 방문 시 동일 계정으로 로그인',
    ],
    note: '계정 정보는 이 브라우저에만 저장됩니다. 다른 기기에서 관리하려면 해당 기기에서도 계정을 생성해야 합니다.',
  },
  {
    icon: Trophy,
    title: '새 대회 만들기',
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    steps: [
      '홈에서 고등부 또는 중등부 탭 선택',
      '새 대진 만들기 버튼 클릭 (대회가 이미 있으면 새 대진 버튼)',
      '참가 팀명 입력 후 추가 버튼 또는 Enter로 등록 (최소 2팀 · 최대 64팀)',
      '대진 생성 버튼 클릭 → 브라켓 자동 생성, 부전승 자동 배정',
    ],
  },
  {
    icon: RefreshCw,
    title: '대진 재구성',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    steps: [
      '대진표 화면 → 재구성 버튼 클릭',
      '확인 팝업에서 재구성 클릭 시 팀 배정이 새로 무작위 생성됨',
    ],
  },
  {
    icon: CalendarDays,
    title: '경기 일정 입력',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    steps: [
      '대진 관리 버튼 → 대진표 화면으로 이동',
      '상단 탭에서 일정 입력 선택',
      '각 경기 카드에 날짜 · 시간 · 장소 입력 후 저장',
    ],
  },
  {
    icon: Swords,
    title: '경기 결과 입력',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    steps: [
      '홈 대시보드 → 경기 진행 버튼 클릭 (관리자 전용)',
      '라운드 탭(8강·준결승 등) 선택',
      '홈팀과 어웨이팀 점수 입력 후 저장 → 승자가 다음 라운드에 자동 반영',
      '잘못 입력한 경우 수정(✏️) 아이콘으로 재입력 가능',
    ],
    note: '동점 입력 시 오류가 표시됩니다. 연장전 결과를 입력해 주세요.',
  },
  {
    icon: Bell,
    title: '공지 작성 및 삭제',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    steps: [
      '홈 대시보드 → 공지 탭 선택',
      '제목과 내용 입력 후 공지 등록 버튼 클릭',
      '등록된 공지 우측 휴지통 아이콘으로 삭제',
    ],
  },
  {
    icon: Download,
    title: '대진표 다운로드',
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    steps: [
      '대진표 화면 우상단 다운로드 버튼 클릭',
      'PNG · JPG · PDF 중 원하는 형식 선택',
    ],
  },
];

const GUEST_SECTIONS = [
  {
    icon: Trophy,
    title: '홈 대시보드',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    desc: '앱을 열면 바로 대시보드가 표시됩니다. 고등부 / 중등부 탭으로 전환하며 각 부의 대회 정보를 확인하세요.',
    table: [
      { tab: '현황', desc: '참가팀 수, 브라켓 규모, 완료 경기 수, 라운드별 진행률, 최종 순위(종료 시)' },
      { tab: '학교 조회', desc: '팀명으로 해당 학교의 경기 일정·결과·승패 통계 확인' },
      { tab: '대진표', desc: '전체 토너먼트 브라켓 시각화' },
      { tab: '결과 피드', desc: '완료된 경기 목록(최신순), 스코어 및 승자 표시' },
      { tab: '공지', desc: '대회 관련 공지사항 확인' },
    ],
  },
  {
    icon: Search,
    title: '학교별 경기 조회',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    steps: [
      '홈 대시보드 → 학교 조회 탭 이동',
      '검색창에 학교명 입력 또는 하단 팀 버튼 클릭',
      '해당 팀의 경기 일정, 결과, 승패 기록 확인',
    ],
  },
  {
    icon: Palette,
    title: '테마 변경',
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    steps: [
      '화면 우하단 테마 버튼(☀️ / 🌙 / 🖥) 클릭',
      '라이트 → 다크 → 시스템 자동 순서로 전환',
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
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 ${item.color.replace('text-', 'bg-').replace(' dark:text-', ' dark:bg-').split(' ')[0]}`}>
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

export default function HelpModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('guest');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">사용 가이드</h2>
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
      </div>
    </div>
  );
}

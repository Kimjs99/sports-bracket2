import { APP_VERSION } from '../../constants';

// 공용 푸터 — 저작자 · 버전 · 사용제한. 관리자/게스트 모든 화면에서 사용.
export default function Footer() {
  return (
    <footer className="text-center text-[11px] text-gray-400 dark:text-gray-600 py-4 pb-6 px-4 select-none leading-relaxed">
      <div>© 2026 kimjs · 학교스포츠클럽 대진 관리 시스템 {APP_VERSION}</div>
      <div className="mt-0.5">학교 교육활동 지원 목적으로 제공되며, 무단 복제·재배포 및 상업적 이용을 금합니다.</div>
    </footer>
  );
}

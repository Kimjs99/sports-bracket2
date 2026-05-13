import { X, ShieldCheck, LogOut } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';

// Modal is now shown only when already logged in (from GlobalBar).
// Login itself happens via OrgSelectScreen → OrgLoginModal.
export default function AdminLoginModal() {
  const { isLoggedIn, username, orgSlug, logout, setModalOpen } = useAdmin();

  function close() { setModalOpen(false); }

  async function handleLogout() {
    await logout();
    close();
  }

  if (!isLoggedIn) { close(); return null; }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-1.5">
              <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">관리자 설정</span>
          </div>
          <button onClick={close} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4 text-center">
            <ShieldCheck size={22} className="mx-auto text-green-600 dark:text-green-400 mb-2" />
            <div className="font-bold text-gray-900 dark:text-gray-100 text-base">{username}</div>
            {orgSlug && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{orgSlug}</div>}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">관리자로 로그인 중</div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2.5 flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut size={14} /> 로그아웃
          </button>

          <button onClick={close} className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

import { Sun, Moon, Monitor, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

const THEMES = ['light', 'dark', 'auto'];
const ICONS = { light: Sun, dark: Moon, auto: Monitor };
const LABELS = { light: '라이트', dark: '다크', auto: '자동' };

export default function GlobalBar({ theme, setTheme }) {
  const { isLoggedIn, username, openModal } = useAdmin();

  function cycleTheme() {
    setTheme(THEMES[(THEMES.indexOf(theme) + 1) % 3]);
  }

  const ThemeIcon = ICONS[theme];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5">
      {/* Theme toggle */}
      <button
        onClick={cycleTheme}
        title={`테마: ${LABELS[theme]}`}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs font-medium"
      >
        <ThemeIcon size={13} />
        <span className="hidden sm:inline">{LABELS[theme]}</span>
      </button>

      {/* Admin button — only shown when logged in */}
      {isLoggedIn && (
        <button
          onClick={openModal}
          title={`관리자: ${username}`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shadow-md border text-xs font-medium transition-colors bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60"
        >
          <ShieldCheck size={13} />
          <span className="hidden sm:inline">{username}</span>
        </button>
      )}
    </div>
  );
}

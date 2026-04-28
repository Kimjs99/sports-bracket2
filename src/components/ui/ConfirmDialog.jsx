import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, message, confirmLabel = '확인', danger = true, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="shrink-0 bg-red-100 dark:bg-red-900/30 rounded-full p-2">
              <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{title}</h3>
            {message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{message}</p>}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors
              ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

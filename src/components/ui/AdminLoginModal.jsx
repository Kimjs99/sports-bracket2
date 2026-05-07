import { useState } from 'react';
import { X, Eye, EyeOff, ShieldCheck, KeyRound, LogOut, User, Loader } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { hasAdmin } from '../../utils/adminStorage';

export default function AdminLoginModal() {
  const { isLoggedIn, username, login, logout, createAccount, setModalOpen, onSuccess } = useAdmin();

  const [isCreating, setIsCreating] = useState(!hasAdmin());
  const [uname, setUname] = useState('');
  const [p, setP] = useState('');
  const [p2, setP2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function close() { setModalOpen(false); }

  async function submit() {
    setError('');
    setLoading(true);
    try {
      if (isCreating) {
        if (!uname.trim()) { setError('아이디를 입력하세요.'); return; }
        if (p.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
        if (p !== p2) { setError('비밀번호가 일치하지 않습니다.'); return; }
        try {
          await createAccount(uname.trim(), p);
          onSuccess();
        } catch (e) {
          if (e.message === 'ALREADY_EXISTS') {
            setIsCreating(false);
            setError('이미 계정이 있습니다. 비밀번호로 로그인해 주세요.');
          } else {
            setError('계정 생성에 실패했습니다. 다시 시도해 주세요.');
          }
        }
      } else {
        const ok = await login(uname, p);
        if (ok) { onSuccess(); }
        else { setError('비밀번호가 올바르지 않습니다.'); }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    close();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-1.5">
              <ShieldCheck size={15} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
              {isLoggedIn ? '관리자 설정' : isCreating ? '관리자 계정 만들기' : '관리자 로그인'}
            </span>
          </div>
          <button onClick={close} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <X size={17} />
          </button>
        </div>

        <div className="p-5">
          {isLoggedIn ? (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-4 text-center">
                <ShieldCheck size={22} className="mx-auto text-green-600 dark:text-green-400 mb-2" />
                <div className="font-bold text-gray-900 dark:text-gray-100 text-base">{username}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">관리자로 로그인 중</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut size={14} /> 로그아웃
              </button>
              <button
                onClick={close}
                className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                닫기
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {isCreating && (
                <p className="text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg px-3 py-2">
                  처음 사용하시는 경우 관리자 계정을 생성해주세요.
                </p>
              )}

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">아이디</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text" value={uname}
                    onChange={e => { setUname(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder="관리자 아이디"
                    autoFocus
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">비밀번호</label>
                <div className="relative">
                  <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'} value={p}
                    onChange={e => { setP(e.target.value); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && submit()}
                    placeholder={isCreating ? '비밀번호 (6자 이상)' : '비밀번호'}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-8 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  <button
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {isCreating && (
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">비밀번호 확인</label>
                  <div className="relative">
                    <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPw ? 'text' : 'password'} value={p2}
                      onChange={e => { setP2(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && submit()}
                      placeholder="비밀번호 재입력"
                      className="w-full border border-gray-200 dark:border-gray-600 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && <Loader size={14} className="animate-spin" />}
                {isCreating ? '계정 만들기' : '로그인'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

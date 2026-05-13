import { useState, useEffect, useCallback } from 'react';
import { Search, School, Plus, ChevronRight, KeyRound, Eye, EyeOff, Loader, X, AlertCircle } from 'lucide-react';
import { useAdmin } from '../contexts/AdminContext';

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

// ── OrgLoginModal ──────────────────────────────────────────────────────────────

function OrgLoginModal({ org, onClose, onSuccess }) {
  const { login } = useAdmin();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!password) { setError('비밀번호를 입력하세요.'); return; }
    setError('');
    setLoading(true);
    try {
      const ok = await login(org.slug, password);
      if (ok) onSuccess();
      else setError('비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">관리자 로그인</p>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5">{org.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">비밀번호</label>
            <div className="relative">
              <KeyRound size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="비밀번호 입력"
                autoFocus
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

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader size={14} className="animate-spin" />}
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

// ── RegisterForm ───────────────────────────────────────────────────────────────

function RegisterForm({ onClose, onSuccess }) {
  const { createOrg } = useAdmin();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugEdited && name) setSlug(slugify(name));
  }, [name, slugEdited]);

  async function submit() {
    setError('');
    if (!name.trim()) { setError('학교/기관명을 입력하세요.'); return; }
    if (!slug.trim()) { setError('식별자를 입력하세요.'); return; }
    if (!/^[a-z0-9가-힣-]{2,30}$/.test(slug)) { setError('식별자는 영문 소문자, 숫자, 한글, 하이픈만 사용할 수 있습니다.'); return; }
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (password !== password2) { setError('비밀번호가 일치하지 않습니다.'); return; }

    setLoading(true);
    try {
      await createOrg(name.trim(), slug.trim(), password);
      onSuccess();
    } catch (e) {
      if (e.message === 'ALREADY_EXISTS') setError('이미 등록된 식별자입니다. 다른 식별자를 사용해 주세요.');
      else setError('등록에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">새 학교/기관 등록</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
            <X size={17} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">학교/기관명</label>
            <input
              type="text" value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="예: 서울중학교"
              autoFocus
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">
              식별자 <span className="text-gray-400 font-normal">(로그인 시 사용)</span>
            </label>
            <input
              type="text" value={slug}
              onChange={e => { setSlug(e.target.value); setSlugEdited(true); setError(''); }}
              placeholder="예: seoul-middle"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500 font-mono"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">영문·숫자·한글·하이픈, 2–30자</p>
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="6자 이상"
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              />
              <button
                onClick={() => setShowPw(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPw ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 block">비밀번호 확인</label>
            <input
              type={showPw ? 'text' : 'password'} value={password2}
              onChange={e => { setPassword2(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="비밀번호 재입력"
              className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader size={14} className="animate-spin" />}
            등록하기
          </button>
        </div>
      </div>
    </div>
  );
}

// ── OrgSelectScreen ────────────────────────────────────────────────────────────

export default function OrgSelectScreen({ onOrgLogin }) {
  const { loadOrganizations } = useAdmin();
  const [orgs, setOrgs] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const fetchOrgs = useCallback(async () => {
    setLoading(true);
    const list = await loadOrganizations();
    setOrgs(list);
    setLoading(false);
  }, [loadOrganizations]);

  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase()) ||
    o.slug.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-5">
          <div className="flex items-center gap-2.5 mb-1">
            <School size={20} className="text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">학교스포츠클럽 대진 관리</h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">학교/기관을 선택하여 로그인하세요.</p>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="학교/기관명 검색..."
            className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-gray-100 dark:placeholder-gray-500"
          />
        </div>

        {/* Org list */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-gray-400">
              <Loader size={16} className="animate-spin" /> 불러오는 중...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400 dark:text-gray-500">
              {query ? '검색 결과가 없습니다.' : '등록된 학교/기관이 없습니다.'}
            </div>
          ) : (
            filtered.map((org, i) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrg(org)}
                className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left
                  ${i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}`}
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{org.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{org.slug}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
              </button>
            ))
          )}
        </div>

        {/* Register new org */}
        <button
          onClick={() => setShowRegister(true)}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-2xl text-sm text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <Plus size={15} /> 새 학교/기관 등록
        </button>
      </div>

      {/* Login modal for selected org */}
      {selectedOrg && (
        <OrgLoginModal
          org={selectedOrg}
          onClose={() => setSelectedOrg(null)}
          onSuccess={() => { setSelectedOrg(null); onOrgLogin(); }}
        />
      )}

      {/* Register form */}
      {showRegister && (
        <RegisterForm
          onClose={() => setShowRegister(false)}
          onSuccess={() => { setShowRegister(false); onOrgLogin(); }}
        />
      )}
    </div>
  );
}

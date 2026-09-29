import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Compass, LogIn, UserPlus } from 'lucide-react';
import { useUserStore } from '@/store';
import { loginWithStudentId } from '@/api';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const setTarget = useUserStore((s) => s.setTarget);

  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (persisted session) — skip the login screen
  if (profile?.onboardingCompleted) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotFound(false);

    if (!/^\d{8}$/.test(studentId)) {
      setError('학번은 8자리 숫자로 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await loginWithStudentId(studentId);
      if (result) {
        setProfile(result.profile);
        if (result.target) setTarget(result.target);
        const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
        navigate(from ?? '/dashboard', { replace: true });
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Compass size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-ink">Sejong Compass</span>
          </div>
          <p className="text-xs text-gray-500">세종대학교 맞춤형 커리어 &amp; 취업 가이드</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-ink mb-4">학번으로 로그인</h2>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">학번</label>
              <input
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value.replace(/\D/g, '').slice(0, 8));
                  setNotFound(false);
                  setError(null);
                }}
                inputMode="numeric"
                placeholder="20211234"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white"
              />
              {error && <p className="text-xs text-danger mt-0.5">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <LogIn size={15} />
              {loading ? '확인 중...' : '로그인'}
            </button>
          </form>

          {notFound && (
            <div className="mt-4 bg-primary-light border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600 mb-3">
                등록된 학번이 없습니다. 처음이시네요! 프로필을 먼저 등록해주세요.
              </p>
              <button
                onClick={() => navigate('/onboarding', { state: { studentId } })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary rounded-lg px-4 py-2 hover:bg-white transition-colors"
              >
                <UserPlus size={13} /> 프로필 등록하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

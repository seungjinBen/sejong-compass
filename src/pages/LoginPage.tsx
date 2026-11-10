import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Compass, LogIn, Mail, Lock } from 'lucide-react';
import { useUserStore } from '@/store';
import { login } from '@/api/auth';
import { loadSessionFor } from '@/api/session';
import { errorMessage, isApiError } from '@/api/http';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const setTarget = useUserStore((s) => s.setTarget);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (server session restored)
  if (profile) return <Navigate to={profile.onboardingCompleted ? '/dashboard' : '/onboarding'} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const schoolEmail = email.trim().toLowerCase();
    if (!/^[^@\s]+@(sju\.ac\.kr|sejong\.co\.kr)$/.test(schoolEmail)) {
      setError('학교 이메일(@sju.ac.kr 또는 @sejong.co.kr)을 입력해주세요');
      return;
    }
    if (password.length < 10) {
      setError('비밀번호는 10자 이상입니다');
      return;
    }

    setLoading(true);
    try {
      const me = await login({ schoolEmail, password });
      const session = await loadSessionFor(me);
      setProfile(session.profile);
      setTarget(session.target);

      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      if (!session.profile.onboardingCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(from ?? '/dashboard', { replace: true });
      }
    } catch (err) {
      if (isApiError(err, 'INVALID_CREDENTIALS')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다');
      } else {
        setError(errorMessage(err, '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'));
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white';

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
          <h1 className="text-base font-semibold text-ink mb-1">로그인</h1>
          <p className="text-xs text-gray-500 mb-5">학교 이메일로 로그인하세요</p>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="student@sju.ac.kr"
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="비밀번호"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              <LogIn size={15} />
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-[11px] text-gray-400 text-center mt-4">
            회원가입은 학교 이메일 인증이 필요하며 현재 준비 중입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

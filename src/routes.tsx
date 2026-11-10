import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useUserStore, useRoadmapStore, useUIStore } from '@/store';
import { getOpportunities, getGapAnalysis, getRoadmap } from '@/api';
import { loadSession } from '@/api/session';
import { UNAUTHENTICATED_EVENT } from '@/api/http';
import type { GapAxis } from '@/types';

const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const DiagnosisPage = lazy(() => import('@/pages/DiagnosisPage').then(m => ({ default: m.DiagnosisPage })));
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage').then(m => ({ default: m.RoadmapPage })));
const DoDreamPage = lazy(() => import('@/pages/DoDreamPage').then(m => ({ default: m.DoDreamPage })));
const SpecPage = lazy(() => import('@/pages/SpecPage').then(m => ({ default: m.SpecPage })));
const StudentInfoPage = lazy(() => import('@/pages/StudentInfoPage').then(m => ({ default: m.StudentInfoPage })));
const TargetEditPage = lazy(() => import('@/pages/TargetEditPage').then(m => ({ default: m.TargetEditPage })));

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const profile = useUserStore(s => s.profile);
  const location = useLocation();
  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const profile = useUserStore(s => s.profile);
  const location = useLocation();

  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!profile.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const navigate = useNavigate();
  const setProfile = useUserStore(s => s.setProfile);
  const setTarget = useUserStore(s => s.setTarget);
  const clearUser = useUserStore(s => s.clear);
  const setOpportunities = useUIStore(s => s.setOpportunities);
  const showToast = useUIStore(s => s.showToast);
  const setRoadmap = useRoadmapStore(s => s.setRoadmap);
  const setBaseMatchRate = useRoadmapStore(s => s.setBaseMatchRate);
  const setQualitativeInsights = useRoadmapStore(s => s.setQualitativeInsights);
  const [loading, setLoading] = useState(true);
  const [gapAxes, setGapAxes] = useState<GapAxis[]>([]);

  // 앱 시작: 서버 세션 복원 + 목업 분석 데이터 로드
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadSession().catch(() => null),
      getOpportunities(),
      getGapAnalysis(),
      getRoadmap(),
    ]).then(([session, opps, gap, roadmap]) => {
      if (cancelled) return;
      if (session) {
        setProfile(session.profile);
        setTarget(session.target);
      }
      setOpportunities(opps);
      setBaseMatchRate(gap.matchRate);
      setGapAxes(gap.axes);
      setQualitativeInsights(gap.qualitativeInsights);
      setRoadmap(roadmap);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [setProfile, setTarget, setOpportunities, setBaseMatchRate, setQualitativeInsights, setRoadmap]);

  // 세션 만료(401) → 로그인 화면으로
  useEffect(() => {
    function onUnauthenticated() {
      if (!useUserStore.getState().profile) return;
      clearUser();
      showToast('세션이 만료되었습니다. 다시 로그인해주세요.');
      navigate('/login', { replace: true });
    }
    window.addEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated);
    return () => window.removeEventListener(UNAUTHENTICATED_EVENT, onUnauthenticated);
  }, [clearUser, showToast, navigate]);

  // Store gapAxes in a global ref accessible via window for compatibility
  useEffect(() => {
    (window as Window & { __sc_gapAxes?: GapAxis[] }).__sc_gapAxes = gapAxes;
  }, [gapAxes]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">데이터 불러오는 중...</p>
          <p className="text-xs text-gray-400">서버가 잠들어 있으면 첫 응답까지 30초 정도 걸릴 수 있어요</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireOnboarding><DashboardPage /></RequireOnboarding>} />
        <Route path="/diagnosis" element={<RequireOnboarding><DiagnosisPage /></RequireOnboarding>} />
        <Route path="/roadmap" element={<RequireOnboarding><RoadmapPage /></RequireOnboarding>} />
        <Route path="/dodream" element={<RequireOnboarding><DoDreamPage /></RequireOnboarding>} />
        <Route path="/spec" element={<RequireOnboarding><SpecPage /></RequireOnboarding>} />
        <Route path="/student-info" element={<RequireOnboarding><StudentInfoPage /></RequireOnboarding>} />
        <Route path="/target-edit" element={<RequireOnboarding><TargetEditPage /></RequireOnboarding>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

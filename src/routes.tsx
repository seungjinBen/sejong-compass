import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useUserStore, useRoadmapStore, useUIStore } from '@/store';
import { getProfile, getTarget, getOpportunities, getGapAnalysis, getRoadmap } from '@/api';
import type { GapAxis } from '@/types';

const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const DiagnosisPage = lazy(() => import('@/pages/DiagnosisPage').then(m => ({ default: m.DiagnosisPage })));
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage').then(m => ({ default: m.RoadmapPage })));
const DoDreamPage = lazy(() => import('@/pages/DoDreamPage').then(m => ({ default: m.DoDreamPage })));
const SpecPage = lazy(() => import('@/pages/SpecPage').then(m => ({ default: m.SpecPage })));

function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

function RequireOnboarding({ children }: { children: React.ReactNode }) {
  const profile = useUserStore(s => s.profile);
  const location = useLocation();

  if (!profile) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!profile.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const setProfile = useUserStore(s => s.setProfile);
  const setTarget = useUserStore(s => s.setTarget);
  const setOpportunities = useUIStore(s => s.setOpportunities);
  const setRoadmap = useRoadmapStore(s => s.setRoadmap);
  const setBaseMatchRate = useRoadmapStore(s => s.setBaseMatchRate);
  const setQualitativeInsights = useRoadmapStore(s => s.setQualitativeInsights);
  const [loading, setLoading] = useState(true);
  const [gapAxes, setGapAxes] = useState<GapAxis[]>([]);

  useEffect(() => {
    Promise.all([
      getProfile(),
      getTarget(),
      getOpportunities(),
      getGapAnalysis(),
      getRoadmap(),
    ]).then(([profile, target, opps, gap, roadmap]) => {
      if (profile) setProfile(profile);
      if (target) setTarget(target);
      setOpportunities(opps);
      setBaseMatchRate(gap.matchRate);
      setGapAxes(gap.axes);
      setQualitativeInsights(gap.qualitativeInsights);
      setRoadmap(roadmap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [setProfile, setTarget, setOpportunities, setBaseMatchRate, setQualitativeInsights, setRoadmap]);

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
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/dashboard" element={<RequireOnboarding><DashboardPage /></RequireOnboarding>} />
        <Route path="/diagnosis" element={<RequireOnboarding><DiagnosisPage /></RequireOnboarding>} />
        <Route path="/roadmap" element={<RequireOnboarding><RoadmapPage /></RequireOnboarding>} />
        <Route path="/dodream" element={<RequireOnboarding><DoDreamPage /></RequireOnboarding>} />
        <Route path="/spec" element={<RequireOnboarding><SpecPage /></RequireOnboarding>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

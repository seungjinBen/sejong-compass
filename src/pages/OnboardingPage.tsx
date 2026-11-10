import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Compass, Check, Sparkles } from 'lucide-react';
import { useUserStore, useRoadmapStore } from '@/store';
import { generateRoadmap, getGapAnalysis } from '@/api';
import { StudentInfoForm } from '@/components/forms/StudentInfoForm';
import { CareerGoalForm } from '@/components/forms/CareerGoalForm';
import type { UserProfile } from '@/types';

// Loading screen (목업 로드맵 생성 연출)
const LOAD_STEPS = ['스펙 분석 중', '공고 208건 대조 중', '갭 산출 중', '로드맵 생성 중'];

export function GeneratingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      for (let i = 0; i < LOAD_STEPS.length; i++) {
        if (cancelled) return;
        setStep(i);
        await new Promise<void>((r) => setTimeout(r, 600));
      }
      if (!cancelled) onDone();
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [onDone]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-sm w-full px-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">맞춤 로드맵 생성 중</h2>
        <p className="text-sm text-gray-500 mb-8">잠시만 기다려 주세요...</p>
        <div className="space-y-3">
          {LOAD_STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                i === step
                  ? 'border-primary bg-primary-light'
                  : i < step
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-white'
              }`}
            >
              {i < step ? (
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              ) : i === step ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  i === step ? 'text-primary font-semibold' : i < step ? 'text-success' : 'text-gray-400'
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function stepDone(profile: UserProfile, step: 'BASIC_INFO' | 'MAJORS' | 'PREFERENCES'): boolean {
  return profile.onboarding?.steps.find((s) => s.step === step)?.status === 'COMPLETED';
}

/**
 * 2단계 온보딩.
 * 1) 학생 정보·전공·성적표 → BASIC_INFO, MAJORS(, COURSES)
 * 2) 취업 목표 → PREFERENCES
 * 세 필수 단계가 COMPLETED 이면 온보딩 완료로 보고 대시보드로 보낸다.
 */
export function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const setBaseMatchRate = useRoadmapStore((s) => s.setBaseMatchRate);
  const setQualitativeInsights = useRoadmapStore((s) => s.setQualitativeInsights);

  // 이미 1단계를 마친 계정은 2단계부터 이어서
  const [currentStep, setCurrentStep] = useState<1 | 2>(() =>
    profile && stepDone(profile, 'BASIC_INFO') && stepDone(profile, 'MAJORS') ? 2 : 1,
  );
  const [generating, setGenerating] = useState(false);

  if (!profile) return <Navigate to="/login" replace />;
  if (profile.onboardingCompleted && !generating) return <Navigate to="/dashboard" replace />;

  async function handleGoalSaved() {
    setGenerating(true);
    try {
      const [roadmap, gap] = await Promise.all([generateRoadmap(), getGapAnalysis()]);
      setRoadmap(roadmap);
      setBaseMatchRate(gap.matchRate);
      setQualitativeInsights(gap.qualitativeInsights);
    } catch {
      // 목업 생성 실패해도 대시보드 진입은 허용 (대시보드에서 재시도 가능)
    }
  }

  function handleGeneratingDone() {
    navigate('/dashboard', { replace: true });
  }

  if (generating) return <GeneratingScreen onDone={handleGeneratingDone} />;

  const STEPS = ['학생 정보', '목표 설정'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Compass size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-ink">Sejong Compass</span>
          </div>
          <p className="text-xs text-gray-500">
            {profile.name}님, 환영합니다 · 세종대학교 맞춤형 커리어 &amp; 취업 가이드
          </p>
        </div>

        <div className="flex items-start justify-center mb-4">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const active = s === currentStep;
            const done = s < currentStep;
            return (
              <div key={s} className="flex items-start">
                <div className="flex flex-col items-center gap-1.5 w-24">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      done ? 'bg-success text-white' : active ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {done ? <Check size={14} /> : s}
                  </div>
                  <span className={`text-xs whitespace-nowrap ${active ? 'text-ink font-semibold' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {s < STEPS.length && (
                  <div className={`w-10 sm:w-16 h-0.5 mt-4 ${done ? 'bg-success' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {currentStep === 1 && (
            <StudentInfoForm withTranscript submitLabel="다음 단계 →" onSaved={() => setCurrentStep(2)} />
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-ink">목표 설정</h2>
                <button type="button" onClick={() => setCurrentStep(1)} className="text-xs text-gray-500 hover:text-ink">
                  ← 이전
                </button>
              </div>
              <CareerGoalForm submitLabel="진단 시작 →" onSaved={() => void handleGoalSaved()} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

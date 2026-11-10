import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/common/Card';
import { useUserStore, useRoadmapStore } from '@/store';
import { generateRoadmap, getGapAnalysis } from '@/api';
import { CareerGoalForm } from '@/components/forms/CareerGoalForm';
import { GeneratingScreen } from '@/pages/OnboardingPage';

export function TargetEditPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const setBaseMatchRate = useRoadmapStore((s) => s.setBaseMatchRate);
  const setQualitativeInsights = useRoadmapStore((s) => s.setQualitativeInsights);

  const [regenerating, setRegenerating] = useState(false);

  if (!profile) return null;

  async function handleSaved() {
    setRegenerating(true);
    try {
      // 목표가 바뀌면 (목업) 로드맵·갭분석을 다시 생성
      const [roadmap, gap] = await Promise.all([generateRoadmap(), getGapAnalysis()]);
      setRoadmap(roadmap);
      setBaseMatchRate(gap.matchRate);
      setQualitativeInsights(gap.qualitativeInsights);
    } catch {
      // 재생성 실패 시 기존 로드맵 유지
    }
  }

  if (regenerating) return <GeneratingScreen onDone={() => navigate('/dashboard')} />;

  return (
    <PageShell title="희망 직무 변경">
      <Card className="max-w-2xl">
        <p className="text-[11px] text-gray-400 mb-4">
          직무를 바꾸면 매칭률·갭분석·로드맵이 모두 새로 계산돼요.
        </p>
        <CareerGoalForm submitLabel="커리어 로드맵 새로 생성" onSaved={() => void handleSaved()} />
      </Card>
    </PageShell>
  );
}

import type { UserProfile, TargetCondition, GapAxis, Roadmap, DoDreamProgram, Opportunity, QualitativeInsight } from '@/types';
import { defaultProfile, defaultTarget, coldStartProfile, seniorProfile, seniorTarget } from '@/mocks/data/profile';
import {
  defaultGapAxes, defaultMatchRate, defaultTargetMatchRate,
  seniorGapAxes, seniorMatchRate, seniorTargetMatchRate,
  defaultQualitativeInsights, seniorQualitativeInsights,
  coldStartGapAxes, coldStartMatchRate, coldStartTargetMatchRate,
} from '@/mocks/data/gap';
import { defaultRoadmap, seniorRoadmap, coldStartRoadmap } from '@/mocks/data/roadmap';
import { defaultDoDreamPrograms } from '@/mocks/data/dodream';
import { defaultOpportunities } from '@/mocks/data/opportunities';

export type ScenarioId = 'default' | 'coldStart' | 'senior';

export interface Scenario {
  id: ScenarioId;
  label: string;
  profile: UserProfile;
  target: TargetCondition | null;
  matchRate: number;
  targetMatchRate: number;
  gapAxes: GapAxis[];
  qualitativeInsights: QualitativeInsight[];
  roadmap: Roadmap;
  dodreamPrograms: DoDreamProgram[];
  opportunities: Opportunity[];
}

export const scenarios: Record<ScenarioId, Scenario> = {
  default: {
    id: 'default',
    label: '김세종 (기본)',
    profile: defaultProfile,
    target: defaultTarget,
    matchRate: defaultMatchRate,
    targetMatchRate: defaultTargetMatchRate,
    gapAxes: defaultGapAxes,
    qualitativeInsights: defaultQualitativeInsights,
    roadmap: defaultRoadmap,
    dodreamPrograms: defaultDoDreamPrograms,
    opportunities: defaultOpportunities,
  },
  coldStart: {
    id: 'coldStart',
    label: '이도전 (신입생)',
    profile: coldStartProfile,
    target: null,
    matchRate: coldStartMatchRate,
    targetMatchRate: coldStartTargetMatchRate,
    gapAxes: coldStartGapAxes,
    qualitativeInsights: [],
    roadmap: coldStartRoadmap,
    dodreamPrograms: defaultDoDreamPrograms,
    opportunities: [],
  },
  senior: {
    id: 'senior',
    label: '김졸업 (4학년)',
    profile: seniorProfile,
    target: seniorTarget,
    matchRate: seniorMatchRate,
    targetMatchRate: seniorTargetMatchRate,
    gapAxes: seniorGapAxes,
    qualitativeInsights: seniorQualitativeInsights,
    roadmap: seniorRoadmap,
    dodreamPrograms: defaultDoDreamPrograms,
    opportunities: defaultOpportunities,
  },
};

export function getActiveScenario(): ScenarioId {
  const params = new URLSearchParams(window.location.search);
  const fromParam = params.get('scenario');
  if (fromParam && fromParam in scenarios) return fromParam as ScenarioId;
  const stored = localStorage.getItem('sc:scenario');
  if (stored && stored in scenarios) return stored as ScenarioId;
  return 'default';
}

export function setActiveScenario(id: ScenarioId): void {
  localStorage.setItem('sc:scenario', id);
}

import type { GapAxis, Roadmap, DoDreamProgram, Opportunity, QualitativeInsight } from '@/types';
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

/**
 * 분석 기능(갭·로드맵·두드림·기회) 목업 시나리오.
 * 프로필·취업목표는 백엔드에서 오므로 시나리오에 포함하지 않는다.
 */
export interface Scenario {
  id: ScenarioId;
  label: string;
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
    label: '기본 (3학년)',
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
    label: '신입생',
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
    label: '4학년 (취준)',
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

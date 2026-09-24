import type { GapAxis } from '@/types';

export const defaultMatchRate = 84;
export const defaultTargetMatchRate = 92;

export const defaultGapAxes: GapAxis[] = [
  {
    key: 'GPA',
    label: '전공학점',
    mine: 85,
    required: 80,
    myValueText: 'GPA 3.85',
    requiredText: 'GPA 3.5 이상',
    status: 'MET',
    deltaPercent: 0,
    evidences: [{ kind: 'COURSE', label: '전체 이수 학점 기반', weight: 1 }],
  },
  {
    key: 'LANGUAGE',
    label: '어학',
    mine: 87,
    required: 80,
    myValueText: 'TOEIC 870',
    requiredText: 'TOEIC 800 이상',
    status: 'MET',
    deltaPercent: 0,
    evidences: [{ kind: 'CERT', label: 'TOEIC 870점', weight: 1 }],
  },
  {
    key: 'CERT',
    label: '자격증',
    mine: 70,
    required: 60,
    myValueText: 'SQLD 취득',
    requiredText: '직무 관련 자격증 1개',
    status: 'MET',
    deltaPercent: 0,
    evidences: [{ kind: 'CERT', label: 'SQLD', weight: 1 }],
  },
  {
    key: 'PROJECT',
    label: '직무 프로젝트',
    mine: 65,
    required: 75,
    myValueText: '2건 보유',
    requiredText: '3건 이상 권장',
    status: 'PARTIAL',
    deltaPercent: -3,
    evidences: [
      { kind: 'PROJECT', label: 'SW 캡스톤 디자인 II', weight: 0.5 },
      { kind: 'PROJECT', label: '오픈소스 SW 프로젝트', weight: 0.5 },
    ],
  },
  {
    key: 'CODING_TEST',
    label: '코딩테스트',
    mine: 72,
    required: 80,
    myValueText: '백준 Gold I',
    requiredText: 'Platinum IV 권장',
    status: 'PARTIAL',
    deltaPercent: -2,
    evidences: [{ kind: 'CODING_TEST', label: '백준 Gold I', weight: 1 }],
  },
  {
    key: 'STACK',
    label: '기술 스택',
    mine: 55,
    required: 80,
    myValueText: 'Docker 0.1 / AWS 0.1',
    requiredText: 'Docker·AWS 중급 이상',
    status: 'LACK',
    deltaPercent: -3,
    evidences: [
      { kind: 'PROJECT', label: 'SW 캡스톤 디자인 II (일부)', weight: 0.1 },
    ],
  },
];

export const seniorMatchRate = 91;
export const seniorTargetMatchRate = 95;

export const seniorGapAxes: GapAxis[] = defaultGapAxes.map(ax => ({
  ...ax,
  mine: Math.min(95, ax.mine + 15),
  status: ax.status === 'LACK' ? 'PARTIAL' : ('MET' as const),
  deltaPercent: ax.deltaPercent < 0 ? -1 : 0,
}));

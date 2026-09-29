import type { JobPosting } from '@/types';

export const defaultJobs: JobPosting[] = [
  {
    id: 'job-001',
    company: '네이버',
    title: '2026 하반기 Cloud API 백엔드 신입',
    jobField: 'BACKEND',
    matchRate: 92,
    deadline: '2026-10-15',
    region: '서울',
    source: 'COMPANY',
    externalUrl: 'https://recruit.navercorp.com',
    requiredSkills: [
      { skillId: 'skill-java', name: 'Java', type: 'REQUIRED' },
      { skillId: 'skill-spring', name: 'Spring Boot', type: 'REQUIRED' },
      { skillId: 'skill-docker', name: 'Docker', type: 'REQUIRED' },
      { skillId: 'skill-aws', name: 'AWS', type: 'PREFERRED' },
      { skillId: 'skill-sql', name: 'SQL', type: 'REQUIRED' },
      { skillId: 'skill-kafka', name: 'Kafka', type: 'PREFERRED' },
    ],
    strongPoints: [
      {
        text: 'Java 숙련도 0.8로 필수 역량 충족',
        evidences: [
          { kind: 'COURSE', label: '객체지향프로그래밍(A0)', weight: 0.5 },
          { kind: 'PROJECT', label: 'SW 캡스톤 디자인 II', weight: 0.3 },
        ],
      },
      {
        text: 'SQL 숙련도 0.85 — 데이터베이스 역량 우수',
        evidences: [
          { kind: 'COURSE', label: '데이터베이스(B+)', weight: 0.5 },
          { kind: 'CERT', label: 'SQLD', weight: 0.35 },
        ],
      },
      {
        text: '코딩테스트 Gold I 역량 보유',
        evidences: [{ kind: 'CODING_TEST', label: '코딩테스트 Gold I', weight: 1 }],
      },
    ],
    improvements: [
      { text: 'Docker 경험 없음 — 컨테이너 환경 이해 필요', deltaPercent: -5, skillId: 'skill-docker' },
      { text: 'AWS 숙련도 낮음 — 클라우드 기초 보완 권장', deltaPercent: -3, skillId: 'skill-aws' },
    ],
    blocker: { skillName: 'Docker', deltaPercent: -5 },
    reason: {
      headline: '필수 스킬 6개 중 4개 보유, Docker만 부족합니다.',
      metrics: [
        { label: '매칭률', value: '92%' },
        { label: '필수 스킬 충족', value: '4 / 6개' },
        { label: '유사 합격자 비율', value: '상위 15%' },
      ],
      evidences: [
        { kind: 'COURSE', label: '객체지향프로그래밍(A0)', weight: 0.5 },
        { kind: 'CERT', label: 'SQLD', weight: 0.35 },
      ],
      alternatives: [],
    },
  },
  {
    id: 'job-002',
    company: '네이버',
    title: '2026 분산 데이터 서버 개발자',
    jobField: 'BACKEND',
    matchRate: 85,
    deadline: '2026-10-20',
    region: '서울',
    source: 'COMPANY',
    externalUrl: 'https://recruit.navercorp.com',
    requiredSkills: [
      { skillId: 'skill-java', name: 'Java', type: 'REQUIRED' },
      { skillId: 'skill-sql', name: 'SQL', type: 'REQUIRED' },
      { skillId: 'skill-kafka', name: 'Kafka', type: 'REQUIRED' },
      { skillId: 'skill-redis', name: 'Redis', type: 'REQUIRED' },
      { skillId: 'skill-docker', name: 'Docker', type: 'PREFERRED' },
    ],
    strongPoints: [
      {
        text: 'Java 및 SQL 핵심 역량 보유',
        evidences: [{ kind: 'COURSE', label: '데이터베이스(B+)', weight: 0.5 }],
      },
      {
        text: 'SQLD 자격증으로 데이터 모델링 역량 검증',
        evidences: [{ kind: 'CERT', label: 'SQLD', weight: 1 }],
      },
    ],
    improvements: [
      { text: 'Kafka 경험 필요 — 분산 메시징 시스템 학습 권장', deltaPercent: -7, skillId: 'skill-kafka' },
      { text: 'Redis 기초만 보유 — 심화 학습 필요', deltaPercent: -5, skillId: 'skill-redis' },
    ],
    blocker: { skillName: 'Kafka', deltaPercent: -7 },
    reason: {
      headline: '목표 공고의 68%가 Kafka를 요구하지만 아직 보유하지 않은 스킬입니다.',
      metrics: [
        { label: '매칭률', value: '85%' },
        { label: 'Kafka 요구 공고', value: '142 / 208건 (68%)' },
      ],
      evidences: [],
      alternatives: [],
    },
  },
  {
    id: 'job-003',
    company: '카카오',
    title: 'Global Platform 백엔드 엔지니어',
    jobField: 'BACKEND',
    matchRate: 78,
    deadline: '2026-11-01',
    region: '서울',
    source: 'WANTED',
    externalUrl: 'https://careers.kakao.com',
    requiredSkills: [
      { skillId: 'skill-java', name: 'Java', type: 'REQUIRED' },
      { skillId: 'skill-spring', name: 'Spring Boot', type: 'REQUIRED' },
      { skillId: 'skill-aws', name: 'AWS', type: 'REQUIRED' },
      { skillId: 'skill-docker', name: 'Docker', type: 'REQUIRED' },
      { skillId: 'skill-kafka', name: 'Kafka', type: 'PREFERRED' },
      { skillId: 'skill-redis', name: 'Redis', type: 'PREFERRED' },
    ],
    strongPoints: [
      {
        text: 'Java + Spring Boot 기반 프로젝트 경험 보유',
        evidences: [{ kind: 'PROJECT', label: 'SW 캡스톤 디자인 II', weight: 0.6 }],
      },
    ],
    improvements: [
      { text: 'AWS 필수 — 클라우드 역량 집중 보완 필요', deltaPercent: -8, skillId: 'skill-aws' },
      { text: 'Docker 필수 — 컨테이너 환경 구축 경험 필요', deltaPercent: -6, skillId: 'skill-docker' },
    ],
    blocker: { skillName: 'AWS', deltaPercent: -8 },
    reason: {
      headline: '클라우드 역량(AWS·Docker) 보완 시 78% → 92% 도달 가능합니다.',
      metrics: [
        { label: '매칭률', value: '78%' },
        { label: '보완 후 예상 매칭률', value: '92%' },
      ],
      evidences: [],
      alternatives: [],
    },
  },
  {
    id: 'job-004',
    company: '라인',
    title: '서버 개발 신입',
    jobField: 'BACKEND',
    matchRate: 82,
    deadline: '2026-10-25',
    region: '서울',
    source: 'SARAMIN',
    externalUrl: 'https://linecorp.com/career',
    requiredSkills: [
      { skillId: 'skill-java', name: 'Java', type: 'REQUIRED' },
      { skillId: 'skill-spring', name: 'Spring Boot', type: 'REQUIRED' },
      { skillId: 'skill-mysql', name: 'MySQL', type: 'REQUIRED' },
      { skillId: 'skill-git', name: 'Git', type: 'REQUIRED' },
    ],
    strongPoints: [
      { text: 'MySQL 실무 경험 보유', evidences: [{ kind: 'PROJECT', label: 'SW 캡스톤 디자인 II', weight: 0.7 }] },
      { text: 'Git 활용 역량 우수 (GitHub 12 repos)', evidences: [{ kind: 'GITHUB', label: 'GitHub: 12 repos', weight: 0.5 }] },
    ],
    improvements: [
      { text: 'Spring Boot 숙련도 보완 필요', deltaPercent: -4, skillId: 'skill-spring' },
    ],
    blocker: null,
    reason: {
      headline: '필수 스킬 4개 모두 보유 — Spring Boot 숙련도만 강화하면 됩니다.',
      metrics: [{ label: '매칭률', value: '82%' }, { label: '필수 스킬 충족', value: '4 / 4개' }],
      evidences: [],
      alternatives: [],
    },
  },
  {
    id: 'job-005',
    company: '쿠팡',
    title: '백엔드 플랫폼 엔지니어링 신입',
    jobField: 'BACKEND',
    matchRate: 76,
    deadline: '2026-11-10',
    region: '서울',
    source: 'JOBKOREA',
    externalUrl: 'https://www.coupang.jobs',
    requiredSkills: [
      { skillId: 'skill-java', name: 'Java', type: 'REQUIRED' },
      { skillId: 'skill-spring', name: 'Spring Boot', type: 'REQUIRED' },
      { skillId: 'skill-docker', name: 'Docker', type: 'REQUIRED' },
      { skillId: 'skill-aws', name: 'AWS', type: 'REQUIRED' },
      { skillId: 'skill-kafka', name: 'Kafka', type: 'REQUIRED' },
    ],
    strongPoints: [
      { text: 'Java 기본 역량 보유', evidences: [{ kind: 'COURSE', label: '객체지향프로그래밍(A0)', weight: 0.5 }] },
    ],
    improvements: [
      { text: 'Docker/Kafka/AWS 모두 부족', deltaPercent: -10, skillId: 'skill-docker' },
    ],
    blocker: { skillName: 'Docker', deltaPercent: -10 },
    reason: {
      headline: '클라우드·인프라 스택(Docker, AWS, Kafka) 보완 후 지원 권장합니다.',
      metrics: [{ label: '매칭률', value: '76%' }],
      evidences: [],
      alternatives: [],
    },
  },
];

import type { Roadmap, RoadmapTask } from '@/types';

const baseReason = (headline: string) => ({
  headline,
  metrics: [] as { label: string; value: string }[],
  evidences: [],
  alternatives: [],
});

const tasks2026_2: RoadmapTask[] = [
  {
    id: 'task-web-server',
    semester: '2026-2',
    type: 'COURSE',
    title: '웹서버 프로그래밍 수강',
    status: 'DONE',
    skillIds: ['skill-spring'],
    expectedGain: 3,
    constraint: '2026-2 개설 · 선수과목 충족',
    reason: {
      headline: '목표 공고 142/208건(68%)이 Spring Boot를 요구하지만 숙련도 0.65로 보완 필요합니다.',
      metrics: [
        { label: '요구 공고', value: '142 / 208건 (68%)' },
        { label: '현재 숙련도', value: '0.65' },
        { label: '기대 효과', value: '+3%p' },
      ],
      evidences: [{ kind: 'COURSE', label: '웹서버 프로그래밍(B+)', weight: 0.35 }],
      alternatives: [
        { type: 'PROJECT', title: 'Spring Boot 토이 프로젝트', expectedGain: 2, constraint: '자율 진행' },
      ],
    },
  },
  {
    id: 'task-sqld',
    semester: '2026-2',
    type: 'CERT',
    title: 'SQLD 취득',
    status: 'DONE',
    skillIds: ['skill-sql'],
    expectedGain: 2,
    dueDate: '2026-09-20',
    reason: baseReason('SQL 역량을 자격증으로 공식 인증하여 서류 통과율을 높입니다.'),
    detail: [
      {
        name: 'SQLD (SQL 개발자)',
        applyPeriod: '2026-08-01 ~ 2026-08-20',
        examDate: '2026-09-14',
        dDay: null,
        note: '이미 취득 완료',
        applyUrl: 'https://www.dataq.or.kr',
      },
    ],
  },
  {
    id: 'task-coding-test-tier',
    semester: '2026-2',
    type: 'CODING_TEST',
    title: '코딩테스트 Gold I → Platinum IV',
    status: 'IN_PROGRESS',
    skillIds: [],
    expectedGain: 2,
    constraint: '학기 중 꾸준히',
    reason: {
      headline: '목표 기업 네이버 코딩테스트 기준 Platinum IV 이상 권장(현재 Gold I -2%p).',
      metrics: [
        { label: '현재 등급', value: 'Gold I' },
        { label: '권장 등급', value: 'Platinum IV' },
        { label: '기대 효과', value: '+2%p' },
      ],
      evidences: [{ kind: 'CODING_TEST', label: '코딩테스트 Gold I', weight: 1 }],
      alternatives: [],
    },
  },
  {
    id: 'task-dodream-mentoring',
    semester: '2026-2',
    type: 'DODREAM',
    title: '두드림 대용량 트래픽 멘토링',
    status: 'IN_PROGRESS',
    skillIds: ['skill-kafka', 'skill-redis'],
    expectedGain: 3,
    dueDate: '2026-10-02',
    constraint: '신청 마감 10/2',
    reason: {
      headline: '부족 역량 Kafka·Redis 중 2개를 채우고 10/2까지 신청 가능 (+3%p)',
      metrics: [
        { label: '관련 갭', value: 'Kafka, Redis' },
        { label: '기대 효과', value: '+3%p' },
        { label: '신청 마감', value: 'D-9 (10/2)' },
      ],
      evidences: [],
      alternatives: [],
    },
  },
];

const tasks2026_W: RoadmapTask[] = [
  {
    id: 'task-docker-boot',
    semester: '2026-W',
    type: 'DODREAM',
    title: 'Docker 부트캠프(교내)',
    status: 'TODO',
    skillIds: ['skill-docker'],
    expectedGain: 3,
    constraint: '겨울방학 12/20~1/10',
    reason: {
      headline: '목표 공고 78%가 Docker를 요구하지만 숙련도 0.1로 가장 큰 갭입니다 (+3%p).',
      metrics: [
        { label: '요구 공고', value: '162 / 208건 (78%)' },
        { label: '현재 숙련도', value: '0.1 (미보유)' },
        { label: '기대 효과', value: '+3%p' },
        { label: '열리는 공고', value: '+41건' },
      ],
      evidences: [],
      alternatives: [
        { type: 'CERT', title: 'AWS CP 자격증 취득', expectedGain: 2, constraint: '시험 비용 약 15만원' },
        { type: 'PROJECT', title: 'Docker 토이 프로젝트', expectedGain: 2, constraint: '자율 진행' },
      ],
    },
  },
  {
    id: 'task-spring-project',
    semester: '2026-W',
    type: 'PROJECT',
    title: 'Spring Boot 토이 프로젝트',
    status: 'TODO',
    skillIds: ['skill-spring', 'skill-redis'],
    expectedGain: 2,
    constraint: '겨울방학 자율 진행',
    reason: baseReason('Spring Boot 실전 경험으로 프로젝트 역량 3건 달성 및 면접 소재 확보.'),
  },
];

const tasks2027_1: RoadmapTask[] = [
  {
    id: 'task-cloud-course',
    semester: '2027-1',
    type: 'COURSE',
    title: '클라우드 컴퓨팅 수강',
    status: 'TODO',
    skillIds: ['skill-aws', 'skill-docker'],
    expectedGain: 3,
    constraint: '2027-1 개설',
    reason: baseReason('AWS·Docker 이론 기반 확립으로 기술 스택 갭 해소.'),
  },
  {
    id: 'task-aws-cert',
    semester: '2027-1',
    type: 'CERT',
    title: 'AWS Cloud Practitioner 자격증',
    status: 'TODO',
    skillIds: ['skill-aws'],
    expectedGain: 2,
    constraint: '시험 비용 약 15만원',
    reason: {
      headline: 'AWS 역량을 자격증으로 증명하면 클라우드 관련 공고 통과율이 높아집니다.',
      metrics: [
        { label: 'AWS 요구 공고', value: '128 / 208건 (62%)' },
        { label: '기대 효과', value: '+2%p' },
      ],
      evidences: [],
      alternatives: [
        { type: 'COURSE', title: '클라우드 컴퓨팅 수강', expectedGain: 3, constraint: '2027-1 개설' },
        { type: 'PROJECT', title: 'AWS 배포 토이 프로젝트', expectedGain: 2, constraint: '자율 진행' },
      ],
    },
    detail: [
      {
        name: 'AWS Cloud Practitioner (CLF-C02)',
        applyPeriod: '상시 접수',
        examDate: '2027-03-15',
        dDay: 120,
        note: 'Pearson VUE 온라인 시험',
        applyUrl: 'https://aws.amazon.com/certification',
      },
      {
        name: 'AWS Solutions Architect Associate',
        applyPeriod: '상시 접수',
        examDate: '2027-05-01',
        dDay: 167,
        note: 'CLF-C02 취득 후 권장',
        applyUrl: 'https://aws.amazon.com/certification',
      },
      {
        name: 'Google Cloud Associate Cloud Engineer',
        applyPeriod: '상시 접수',
        examDate: '2027-04-01',
        dDay: 137,
        note: 'AWS 대안 선택지',
        applyUrl: 'https://cloud.google.com/certification',
      },
    ],
  },
];

const tasks2027_S: RoadmapTask[] = [
  {
    id: 'task-intern',
    semester: '2027-S',
    type: 'EVENT',
    title: '하계 인턴십 지원',
    status: 'TODO',
    skillIds: [],
    expectedGain: 0,
    constraint: '채용 공고 모니터링',
    reason: baseReason('실무 경험 확보로 면접 경쟁력 강화.'),
  },
  {
    id: 'task-coding-prep',
    semester: '2027-S',
    type: 'CODING_TEST',
    title: '코딩테스트 집중 준비',
    status: 'TODO',
    skillIds: [],
    expectedGain: 1,
    constraint: '여름방학 2개월',
    reason: baseReason('하반기 공채 코딩테스트 대비 문제 풀이 집중.'),
  },
];

const tasks2027_2: RoadmapTask[] = [
  {
    id: 'task-job-apply',
    semester: '2027-2',
    type: 'EVENT',
    title: '하반기 공채 지원',
    status: 'TODO',
    skillIds: [],
    expectedGain: 0,
    constraint: '목표 기업 공채 일정 확인',
    reason: baseReason('목표 기업(네이버) 2027 하반기 공채 지원.'),
  },
  {
    id: 'task-portfolio',
    semester: '2027-2',
    type: 'PROJECT',
    title: '포트폴리오 정리',
    status: 'TODO',
    skillIds: [],
    expectedGain: 1,
    constraint: '공채 지원 2주 전',
    reason: baseReason('프로젝트 경험을 정리해 기술 면접 대비.'),
  },
];

export const defaultRoadmap: Roadmap = {
  targetLabel: '네이버 백엔드 개발자 · 2027 하반기',
  currentMatchRate: 84,
  targetMatchRate: 92,
  progressPercent: 18,
  currentSemester: '2026-2',
  semesters: [
    { key: '2026-2', label: '2026년 2학기', predictedMatchRate: 84, tasks: tasks2026_2 },
    { key: '2026-W', label: '2026년 겨울방학', predictedMatchRate: 86, tasks: tasks2026_W },
    { key: '2027-1', label: '2027년 1학기', predictedMatchRate: 89, tasks: tasks2027_1 },
    { key: '2027-S', label: '2027년 여름방학', predictedMatchRate: 91, tasks: tasks2027_S },
    { key: '2027-2', label: '2027년 2학기', predictedMatchRate: 92, tasks: tasks2027_2 },
  ],
  topGaps: [
    { skillId: 'skill-docker', name: 'Docker', importance: 3, status: 'LACK' },
    { skillId: 'skill-spring', name: 'Spring Boot', importance: 3, status: 'PARTIAL' },
    { skillId: 'skill-aws', name: 'AWS', importance: 2, status: 'LACK' },
    { skillId: 'skill-redis', name: 'Redis', importance: 2, status: 'PARTIAL' },
    { skillId: 'skill-kafka', name: 'Kafka', importance: 1, status: 'LACK' },
  ],
};

// Starter roadmap for a student who hasn't filled in personal specs yet —
// shows grade-appropriate baseline certifications so it's not empty.
const coldStartTasks2026_2: RoadmapTask[] = [
  {
    id: 'task-cold-basic-course',
    semester: '2026-2',
    type: 'COURSE',
    title: '자료구조 · 알고리즘 수강',
    status: 'TODO',
    skillIds: [],
    expectedGain: 2,
    constraint: '1학년 기초 전공',
    reason: baseReason('백엔드 진로의 기초가 되는 전공 과목입니다.'),
  },
  {
    id: 'task-cold-entry-cert',
    semester: '2026-2',
    type: 'CERT',
    title: '정보처리기능사 취득',
    status: 'TODO',
    skillIds: [],
    expectedGain: 1,
    constraint: '1학년 추천 입문 자격증',
    reason: baseReason('전공 입문 단계에서 취득하기 좋은 기본 자격증입니다.'),
  },
];

const coldStartTasks2027_2: RoadmapTask[] = [
  {
    id: 'task-cold-db-course',
    semester: '2027-2',
    type: 'COURSE',
    title: '데이터베이스 · 웹프로그래밍 수강',
    status: 'TODO',
    skillIds: [],
    expectedGain: 3,
    constraint: '2학년 전공 심화',
    reason: baseReason('백엔드 실무의 기반이 되는 DB·웹 기초를 다집니다.'),
  },
  {
    id: 'task-cold-first-project',
    semester: '2027-2',
    type: 'PROJECT',
    title: '첫 토이 프로젝트 진행',
    status: 'TODO',
    skillIds: [],
    expectedGain: 3,
    constraint: '2학년 자율 진행',
    reason: baseReason('직무 프로젝트 경험을 쌓기 시작할 시점입니다.'),
  },
];

const coldStartTasks2028_2: RoadmapTask[] = [
  {
    id: 'task-cold-sqld',
    semester: '2028-2',
    type: 'CERT',
    title: 'SQLD 취득',
    status: 'TODO',
    skillIds: ['skill-sql'],
    expectedGain: 3,
    constraint: '3학년 추천 자격증',
    reason: baseReason('데이터베이스 역량을 자격증으로 공식 인증합니다.'),
  },
  {
    id: 'task-cold-jpe',
    semester: '2028-2',
    type: 'CERT',
    title: '정보처리기사 취득',
    status: 'TODO',
    skillIds: [],
    expectedGain: 3,
    constraint: '3학년 추천 자격증',
    reason: baseReason('IT 직군 채용에서 폭넓게 인정받는 국가기술자격증입니다.'),
  },
];

const coldStartTasks2029_2: RoadmapTask[] = [
  {
    id: 'task-cold-aws',
    semester: '2029-2',
    type: 'CERT',
    title: 'AWS Cloud Practitioner 자격증',
    status: 'TODO',
    skillIds: ['skill-aws'],
    expectedGain: 3,
    constraint: '4학년 추천 자격증',
    reason: baseReason('클라우드 기초 역량을 증명해 채용 경쟁력을 높입니다.'),
  },
  {
    id: 'task-cold-apply',
    semester: '2029-2',
    type: 'EVENT',
    title: '공채·인턴 지원 시작',
    status: 'TODO',
    skillIds: [],
    expectedGain: 0,
    constraint: '4학년 채용 시즌',
    reason: baseReason('본격적인 취업 준비 및 지원을 시작할 시점입니다.'),
  },
];

export const coldStartRoadmap: Roadmap = {
  targetLabel: '백엔드 개발자 (진로 설정 전)',
  currentMatchRate: 15,
  targetMatchRate: 70,
  progressPercent: 0,
  currentSemester: '2026-2',
  semesters: [
    { key: '2026-2', label: '2026년 2학기 (1학년)', predictedMatchRate: 20, tasks: coldStartTasks2026_2 },
    { key: '2027-2', label: '2027년 2학기 (2학년)', predictedMatchRate: 35, tasks: coldStartTasks2027_2 },
    { key: '2028-2', label: '2028년 2학기 (3학년)', predictedMatchRate: 55, tasks: coldStartTasks2028_2 },
    { key: '2029-2', label: '2029년 2학기 (4학년)', predictedMatchRate: 70, tasks: coldStartTasks2029_2 },
  ],
  topGaps: [],
};

export const seniorRoadmap: Roadmap = {
  targetLabel: '카카오 백엔드 개발자 · 2026 하반기',
  currentMatchRate: 91,
  targetMatchRate: 95,
  progressPercent: 75,
  currentSemester: '2026-2',
  semesters: [
    {
      key: '2026-2',
      label: '2026년 2학기',
      predictedMatchRate: 95,
      tasks: [
        {
          id: 'task-senior-port',
          semester: '2026-2',
          type: 'PROJECT',
          title: '포트폴리오 최종 정리',
          status: 'IN_PROGRESS',
          skillIds: [],
          expectedGain: 2,
          reason: baseReason('공채 지원 전 포트폴리오 완성도 제고.'),
        },
        {
          id: 'task-senior-apply',
          semester: '2026-2',
          type: 'EVENT',
          title: '하반기 공채 지원',
          status: 'TODO',
          skillIds: [],
          expectedGain: 0,
          reason: baseReason('목표 기업(카카오) 2026 하반기 공채 지원.'),
        },
      ],
    },
  ],
  topGaps: [],
};

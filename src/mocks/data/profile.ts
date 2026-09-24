import type { UserProfile, TargetCondition } from '@/types';

export const defaultProfile: UserProfile = {
  id: 'user-001',
  name: '김세종',
  department: '컴퓨터공학과',
  gradeYear: 3,
  semester: 6,
  jobField: 'BACKEND',
  gpa: 3.85,
  language: { name: 'TOEIC', score: 870 },
  certifications: ['SQLD'],
  awards: ['2025 SW 해커톤 우수상', 'ACM-ICPC 본선 진출'],
  internships: [],
  projects: [
    {
      title: 'SW 캡스톤 디자인 II 백엔드 설계',
      stack: ['Java', 'Spring Boot', 'MySQL'],
      description: '팀 프로젝트 백엔드 아키텍처 설계 및 REST API 구현.',
    },
    {
      title: '오픈소스 SW 프로젝트',
      stack: ['Python', 'FastAPI'],
      description: '오픈소스 기여 프로젝트. PR 5건 병합.',
    },
  ],
  codingTest: { platform: '백준', tier: 'Gold I' },
  githubUrl: 'https://github.com/sejong-kim',
  skills: [
    {
      id: 'skill-java',
      name: 'Java',
      category: 'LANG',
      proficiency: 0.8,
      evidences: [
        { kind: 'COURSE', label: '객체지향프로그래밍(A0)', weight: 0.5 },
        { kind: 'PROJECT', label: 'SW 캡스톤 디자인 II', weight: 0.3 },
      ],
    },
    {
      id: 'skill-spring',
      name: 'Spring Boot',
      category: 'FW',
      proficiency: 0.65,
      evidences: [
        { kind: 'COURSE', label: '웹서버 프로그래밍(B+)', weight: 0.35 },
        { kind: 'PROJECT', label: 'SW 캡스톤 디자인 II', weight: 0.3 },
      ],
    },
    {
      id: 'skill-sql',
      name: 'SQL',
      category: 'DB',
      proficiency: 0.85,
      evidences: [
        { kind: 'COURSE', label: '데이터베이스(B+)', weight: 0.5 },
        { kind: 'CERT', label: 'SQLD', weight: 0.35 },
      ],
    },
    {
      id: 'skill-python',
      name: 'Python',
      category: 'LANG',
      proficiency: 0.6,
      evidences: [
        { kind: 'COURSE', label: '파이썬프로그래밍(A+)', weight: 0.4 },
        { kind: 'PROJECT', label: '오픈소스 SW 프로젝트', weight: 0.2 },
      ],
    },
    {
      id: 'skill-mysql',
      name: 'MySQL',
      category: 'DB',
      proficiency: 0.7,
      evidences: [
        { kind: 'COURSE', label: '데이터베이스(B+)', weight: 0.4 },
        { kind: 'PROJECT', label: 'SW 캡스톤 디자인 II', weight: 0.3 },
      ],
    },
    {
      id: 'skill-git',
      name: 'Git',
      category: 'TOOL',
      proficiency: 0.75,
      evidences: [
        { kind: 'GITHUB', label: 'GitHub: 12 repos', weight: 0.5 },
        { kind: 'PROJECT', label: '오픈소스 SW 프로젝트', weight: 0.25 },
      ],
    },
    {
      id: 'skill-docker',
      name: 'Docker',
      category: 'TOOL',
      proficiency: 0.1,
      evidences: [],
    },
    {
      id: 'skill-aws',
      name: 'AWS',
      category: 'CLOUD',
      proficiency: 0.1,
      evidences: [],
    },
    {
      id: 'skill-redis',
      name: 'Redis',
      category: 'DB',
      proficiency: 0.15,
      evidences: [
        { kind: 'PROJECT', label: 'SW 캡스톤 디자인 II (일부)', weight: 0.15 },
      ],
    },
    {
      id: 'skill-kafka',
      name: 'Kafka',
      category: 'TOOL',
      proficiency: 0.05,
      evidences: [],
    },
  ],
  onboardingCompleted: true,
};

export const defaultTarget: TargetCondition = {
  companySize: 'LARGE',
  targetSalary: 5000,
  regions: ['서울'],
  careerType: 'NEW',
  targetCompany: '네이버',
  targetRole: '백엔드 개발자',
  targetDate: '2027-2H',
};

export const coldStartProfile: UserProfile = {
  id: 'user-002',
  name: '이도전',
  department: '컴퓨터공학과',
  gradeYear: 1,
  semester: 2,
  jobField: 'BACKEND',
  gpa: 3.5,
  language: null,
  certifications: [],
  awards: [],
  internships: [],
  projects: [],
  codingTest: null,
  skills: [
    {
      id: 'skill-python-cold',
      name: 'Python',
      category: 'LANG',
      proficiency: 0.3,
      evidences: [{ kind: 'COURSE', label: '프로그래밍입문(A0)', weight: 0.3 }],
    },
  ],
  onboardingCompleted: false,
};

export const seniorProfile: UserProfile = {
  id: 'user-003',
  name: '김졸업',
  department: '컴퓨터공학과',
  gradeYear: 4,
  semester: 8,
  jobField: 'BACKEND',
  gpa: 4.1,
  language: { name: 'TOEIC', score: 905 },
  certifications: ['SQLD', 'AWS Solutions Architect Associate'],
  awards: ['2025 SW 해커톤 최우수상'],
  internships: ['카카오 인턴 2025 하계'],
  projects: [
    {
      title: '대규모 트래픽 처리 시스템',
      stack: ['Java', 'Spring Boot', 'Kafka', 'Docker', 'AWS'],
      description: 'MSA 기반 대규모 트래픽 처리 백엔드 시스템 설계 및 구현',
    },
  ],
  codingTest: { platform: '백준', tier: 'Platinum IV' },
  githubUrl: 'https://github.com/kim-grad',
  skills: [
    { id: 'skill-java-s', name: 'Java', category: 'LANG', proficiency: 0.9, evidences: [{ kind: 'COURSE', label: '객체지향프로그래밍(A+)', weight: 0.6 }] },
    { id: 'skill-spring-s', name: 'Spring Boot', category: 'FW', proficiency: 0.85, evidences: [{ kind: 'PROJECT', label: '대규모 트래픽 처리 시스템', weight: 0.85 }] },
    { id: 'skill-docker-s', name: 'Docker', category: 'TOOL', proficiency: 0.8, evidences: [{ kind: 'PROJECT', label: '대규모 트래픽 처리 시스템', weight: 0.8 }] },
    { id: 'skill-aws-s', name: 'AWS', category: 'CLOUD', proficiency: 0.75, evidences: [{ kind: 'CERT', label: 'AWS Solutions Architect Associate', weight: 0.75 }] },
    { id: 'skill-kafka-s', name: 'Kafka', category: 'TOOL', proficiency: 0.65, evidences: [{ kind: 'PROJECT', label: '대규모 트래픽 처리 시스템', weight: 0.65 }] },
  ],
  onboardingCompleted: true,
};

export const seniorTarget: TargetCondition = {
  companySize: 'LARGE',
  targetSalary: 5500,
  regions: ['서울'],
  careerType: 'NEW',
  targetCompany: '카카오',
  targetRole: '백엔드 개발자',
  targetDate: '2026-2H',
};

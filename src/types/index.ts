export type JobField = 'BACKEND' | 'FRONTEND' | 'DATA' | 'AI' | 'CLOUD' | 'SECURITY';
export type CompanySize = 'LARGE' | 'MID' | 'STARTUP' | 'SMALL';
export type TaskStatus = 'DONE' | 'IN_PROGRESS' | 'TODO' | 'SKIPPED';
export type TaskType = 'COURSE' | 'CERT' | 'PROJECT' | 'DODREAM' | 'CODING_TEST' | 'LANGUAGE' | 'INTERN' | 'EVENT';
export type GapKey = 'GPA' | 'LANGUAGE' | 'CERT' | 'PROJECT' | 'CODING_TEST' | 'STACK';
export type GapStatus = 'MET' | 'PARTIAL' | 'LACK';

export interface Evidence {
  kind: 'COURSE' | 'CERT' | 'PROJECT' | 'SURVEY' | 'GITHUB' | 'CODING_TEST';
  label: string;
  weight: number;
}

export interface Skill {
  id: string;
  name: string;
  category: 'LANG' | 'FW' | 'DB' | 'CLOUD' | 'CS' | 'TOOL';
  proficiency: number;
  evidences: Evidence[];
}

// ---------- Backend-aligned domain types (Compass API) ----------

export type OnboardingStep =
  | 'BASIC_INFO' | 'MAJORS' | 'PREFERENCES' | 'COURSES'
  | 'PROJECTS' | 'INTERNSHIPS' | 'AWARDS' | 'CERTIFICATIONS';
export type OnboardingStepStatus = 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED';

export interface OnboardingView {
  steps: { step: OnboardingStep; status: OnboardingStepStatus }[];
  nextStep: OnboardingStep | null;
  finished: boolean;
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
}

export interface MajorSelection {
  majorCode: string;
  completionTypeCode: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  overview: string;
  description: string;
  outcome?: string | null;
  githubUrl?: string | null;
  techStackCodes: string[];
}

export interface InternshipItem {
  id: number;
  companyName: string;
  jobCategoryCode: string;
  startedOn: string;
  endedOn: string;
  description: string;
}

export interface AwardItem {
  id: number;
  name: string;
  organizer: string;
  description?: string | null;
}

/** 백엔드 Profile + 전공/이력/온보딩 상태를 합친 프론트 세션 프로필 */
export interface UserProfile {
  id: number;
  schoolEmail: string;
  name: string;
  isTransfer: boolean;
  emailVerified: boolean;
  /** 정규 이수학기 수 (미입력 null) */
  semester: number | null;
  gpa: number | null;
  gpaScale: number | null;
  majors: MajorSelection[];
  certificationCodes: string[];
  projects: ProjectItem[];
  internships: InternshipItem[];
  awards: AwardItem[];
  onboarding: OnboardingView | null;
  /** BASIC_INFO·MAJORS·PREFERENCES 가 모두 COMPLETED 이면 true */
  onboardingCompleted: boolean;
}

/** 백엔드 CareerGoal */
export interface TargetCondition {
  jobCategoryCode: string;
  companySizes: CompanySize[];
  /** 만원 단위 연봉 */
  targetSalary: number;
  regionCodes: string[];
  targetCompany: string;
  /** YYYY-MM */
  targetDate: string;
}

export interface GapAxis {
  key: GapKey;
  label: string;
  mine: number;
  required: number;
  myValueText: string;
  requiredText: string;
  status: GapStatus;
  deltaPercent: number;
  evidences: Evidence[];
}

export interface Reason {
  headline: string;
  metrics: { label: string; value: string }[];
  evidences?: Evidence[];
  alternatives?: { type: TaskType; title: string; expectedGain: number; constraint: string }[];
}

export interface JobPosting {
  id: string;
  company: string;
  title: string;
  jobField: JobField;
  matchRate: number;
  deadline: string;
  region: string;
  source: 'SARAMIN' | 'WANTED' | 'JOBKOREA' | 'COMPANY';
  externalUrl: string;
  requiredSkills: { skillId: string; name: string; type: 'REQUIRED' | 'PREFERRED' }[];
  /** @deprecated use requiredSkills */
  requiredStack?: string[];
  strongPoints: { text: string; evidences: Evidence[] }[];
  improvements: { text: string; deltaPercent: number; skillId: string }[];
  blocker: { skillName: string; deltaPercent: number } | null;
  reason: Reason;
}

export interface CertDetail {
  name: string;
  applyPeriod: string;
  examDate: string;
  dDay: number | null;
  note?: string;
  applyUrl: string;
}

export interface RoadmapTask {
  id: string;
  semester: string;
  /** @deprecated use semester */
  quarter?: string;
  type: TaskType;
  title: string;
  status: TaskStatus;
  skillIds: string[];
  expectedGain: number;
  dueDate?: string;
  constraint?: string;
  /** @deprecated use reason.headline */
  description?: string;
  reason: Reason;
  detail?: CertDetail[] | DoDreamProgram[] | null;
}

export interface Roadmap {
  targetLabel: string;
  currentMatchRate: number;
  targetMatchRate: number;
  progressPercent: number;
  currentSemester: string;
  /** @deprecated use currentSemester */
  currentQuarter?: string;
  semesters: {
    key: string;
    label: string;
    predictedMatchRate: number;
    tasks: RoadmapTask[];
  }[];
  /** @deprecated use semesters */
  quarters?: {
    key: string;
    label: string;
    predictedMatchRate?: number;
    tasks: RoadmapTask[];
  }[];
  topGaps: {
    skillId: string;
    name: string;
    importance: 1 | 2 | 3;
    status: GapStatus;
  }[];
}

export interface DoDreamProgram {
  id: string;
  category: '현직자멘토링' | '마이크로디그리' | '오픈소스캠프' | '스터디' | '부트캠프';
  title: string;
  reason: Reason;
  /** @deprecated use reason.headline as a string */
  reasonText?: string;
  applyDeadline: string;
  capacity?: { current: number; max: number };
  creditLinked: boolean;
  externalUrl: string;
  relatedGapKeys: GapKey[];
  /** @deprecated use relatedGapKeys[0] */
  relatedGapKey?: GapKey;
  expectedGain: number;
}

export interface Opportunity {
  id: string;
  kind: 'INTERN' | 'BOOTCAMP' | 'JOB' | 'DODREAM';
  title: string;
  reasonHeadline: string;
  ctaLabel: string;
  externalUrl: string;
  createdAt: string;
  read: boolean;
}

export interface BehaviorEvent {
  type: 'JOB_VIEW' | 'JOB_SAVE' | 'TASK_DONE' | 'TASK_SKIP' | 'DODREAM_ADD' | 'OPP_CLICK' | 'REASON_OPEN';
  targetId: string;
  at: string;
}

export interface ScenarioType {
  id: 'default' | 'coldStart' | 'senior';
  label: string;
}

export interface QualitativeInsight {
  label: string;
  comment: string;
}

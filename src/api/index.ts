import type {
  UserProfile, TargetCondition, GapAxis, JobPosting,
  Roadmap, TaskStatus, DoDreamProgram, Opportunity,
  BehaviorEvent, Skill, ParsedCourse, QualitativeInsight,
} from '@/types';
import { getActiveScenario, scenarios } from '@/mocks/scenarios';

const FAIL_RATE = Number(import.meta.env['VITE_MOCK_FAIL_RATE'] ?? 0);

const STORAGE_KEYS = {
  PROFILE: 'sc:profile',
  TARGET: 'sc:target',
  TASK_STATUS: 'sc:task_status',
  DODREAM_ADDED: 'sc:dodream_added',
  BEHAVIOR: 'sc:behavior',
  STUDENT_INDEX: 'sc:profiles_by_student_id',
} as const;

interface StudentIndexEntry {
  profile: UserProfile;
  target: TargetCondition | null;
}

function getStudentIndex(): Record<string, StudentIndexEntry> {
  const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_INDEX);
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, StudentIndexEntry>;
}

function saveStudentIndex(index: Record<string, StudentIndexEntry>): void {
  localStorage.setItem(STORAGE_KEYS.STUDENT_INDEX, JSON.stringify(index));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(200 + Math.random() * 300);
}

function mayFail(): void {
  if (FAIL_RATE > 0 && Math.random() < FAIL_RATE) {
    throw new Error('MOCK_API_ERROR: 일시적인 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

function getScenarioData() {
  return scenarios[getActiveScenario()];
}

function getTaskStatusMap(): Record<string, TaskStatus> {
  const raw = localStorage.getItem(STORAGE_KEYS.TASK_STATUS);
  if (!raw) return {};
  return JSON.parse(raw) as Record<string, TaskStatus>;
}

function saveTaskStatusMap(map: Record<string, TaskStatus>): void {
  localStorage.setItem(STORAGE_KEYS.TASK_STATUS, JSON.stringify(map));
}

function getDoDreamAddedIds(): Set<string> {
  const raw = localStorage.getItem(STORAGE_KEYS.DODREAM_ADDED);
  if (!raw) return new Set<string>();
  return new Set<string>(JSON.parse(raw) as string[]);
}

function saveDoDreamAddedIds(ids: Set<string>): void {
  localStorage.setItem(STORAGE_KEYS.DODREAM_ADDED, JSON.stringify([...ids]));
}

function applyStatusToRoadmap(roadmap: Roadmap, map: Record<string, TaskStatus>): Roadmap {
  const semesters = roadmap.semesters.map((s) => ({
    ...s,
    tasks: s.tasks.map((t) => ({
      ...t,
      status: (map[t.id] ?? t.status) as TaskStatus,
    })),
  }));

  const allTasks = semesters.flatMap((s) => s.tasks);
  const nonSkipped = allTasks.filter((t) => t.status !== 'SKIPPED');
  const done = allTasks.filter((t) => t.status === 'DONE');
  const progressPercent = nonSkipped.length > 0 ? Math.round((done.length / nonSkipped.length) * 100) : 0;

  const doneGain = done.reduce((acc, t) => acc + (t.expectedGain ?? 0), 0);
  const currentMatchRate = Math.min(
    roadmap.targetMatchRate,
    roadmap.currentMatchRate + doneGain,
  );

  return {
    ...roadmap,
    semesters,
    // Keep quarters in sync as backward-compat alias
    quarters: semesters,
    currentQuarter: roadmap.currentSemester,
    progressPercent,
    currentMatchRate,
  };
}

// ---------- Profile ----------

export async function getProfile(): Promise<UserProfile | null> {
  await randomDelay();
  mayFail();
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (raw) return JSON.parse(raw) as UserProfile;
  return null;
}

export async function saveProfile(p: Partial<UserProfile>): Promise<UserProfile> {
  await randomDelay();
  mayFail();
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
  const existing = raw ? (JSON.parse(raw) as UserProfile) : getScenarioData().profile;
  const merged = { ...existing, ...p };
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(merged));

  if (merged.studentId) {
    const index = getStudentIndex();
    const prevTarget = index[merged.studentId]?.target ?? null;
    index[merged.studentId] = { profile: merged, target: prevTarget };
    saveStudentIndex(index);
  }

  return merged;
}

// ---------- Student ID lookup (login / duplicate check) ----------

export async function checkStudentIdAvailable(studentId: string): Promise<boolean> {
  await randomDelay();
  const index = getStudentIndex();
  return !(studentId in index);
}

export async function loginWithStudentId(
  studentId: string,
): Promise<{ profile: UserProfile; target: TargetCondition | null } | null> {
  await randomDelay();
  mayFail();
  const index = getStudentIndex();
  const entry = index[studentId];
  if (!entry) return null;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(entry.profile));
  if (entry.target) localStorage.setItem(STORAGE_KEYS.TARGET, JSON.stringify(entry.target));
  return entry;
}

export async function getMockProfileForImport(): Promise<UserProfile> {
  await delay(1000);
  return { ...getScenarioData().profile };
}

export async function getMockTargetForImport(): Promise<TargetCondition> {
  await delay(500);
  const target = getScenarioData().target;
  if (!target) throw new Error('No target for this scenario');
  return { ...target };
}

export async function parseTranscript(_file: File): Promise<{ courses: ParsedCourse[]; skills: Skill[] }> {
  await delay(1200);
  mayFail();
  const mockCourses: ParsedCourse[] = [
    { name: '객체지향프로그래밍', grade: 'A0', semester: '2025-1', mappedSkills: [{ id: 'skill-java', name: 'Java', category: 'LANG', proficiency: 0.5, evidences: [{ kind: 'COURSE', label: '객체지향프로그래밍(A0)', weight: 0.5 }] }] },
    { name: '데이터베이스', grade: 'B+', semester: '2025-2', mappedSkills: [{ id: 'skill-sql', name: 'SQL', category: 'DB', proficiency: 0.5, evidences: [{ kind: 'COURSE', label: '데이터베이스(B+)', weight: 0.5 }] }] },
    { name: '웹서버 프로그래밍', grade: 'B+', semester: '2026-1', mappedSkills: [{ id: 'skill-spring', name: 'Spring Boot', category: 'FW', proficiency: 0.35, evidences: [{ kind: 'COURSE', label: '웹서버 프로그래밍(B+)', weight: 0.35 }] }] },
    { name: '파이썬프로그래밍', grade: 'A+', semester: '2024-2', mappedSkills: [{ id: 'skill-python', name: 'Python', category: 'LANG', proficiency: 0.4, evidences: [{ kind: 'COURSE', label: '파이썬프로그래밍(A+)', weight: 0.4 }] }] },
    { name: '운영체제', grade: 'A+', semester: '2025-1', mappedSkills: [] },
    { name: '알고리즘', grade: 'A0', semester: '2025-2', mappedSkills: [] },
  ];
  const skills = mockCourses.flatMap(c => c.mappedSkills ?? []);
  return { courses: mockCourses, skills };
}

export async function parseGithub(_url: string): Promise<Skill[]> {
  await delay(1000);
  mayFail();
  return [
    { id: 'skill-git', name: 'Git', category: 'TOOL', proficiency: 0.75, evidences: [{ kind: 'GITHUB', label: 'GitHub: 12 repos', weight: 0.5 }] },
    { id: 'skill-python', name: 'Python', category: 'LANG', proficiency: 0.2, evidences: [{ kind: 'GITHUB', label: 'GitHub: 5 Python repos', weight: 0.2 }] },
  ];
}

// ---------- Target ----------

export async function getTarget(): Promise<TargetCondition | null> {
  await randomDelay();
  const raw = localStorage.getItem(STORAGE_KEYS.TARGET);
  if (raw) return JSON.parse(raw) as TargetCondition;
  return null;
}

export async function saveTarget(t: TargetCondition): Promise<void> {
  await randomDelay();
  mayFail();
  localStorage.setItem(STORAGE_KEYS.TARGET, JSON.stringify(t));

  const rawProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
  const activeProfile = rawProfile ? (JSON.parse(rawProfile) as UserProfile) : null;
  if (activeProfile?.studentId) {
    const index = getStudentIndex();
    const entry = index[activeProfile.studentId];
    if (entry) {
      index[activeProfile.studentId] = { ...entry, target: t };
      saveStudentIndex(index);
    }
  }
}

// ---------- Gap Analysis ----------

export async function getGapAnalysis(): Promise<{
  matchRate: number;
  targetMatchRate: number;
  axes: GapAxis[];
  qualitativeInsights: QualitativeInsight[];
}> {
  await randomDelay();
  mayFail();
  const d = getScenarioData();
  return {
    matchRate: d.matchRate,
    targetMatchRate: d.targetMatchRate,
    axes: d.gapAxes,
    qualitativeInsights: d.qualitativeInsights,
  };
}

// ---------- Jobs ----------

export async function getMatchedJobs(_filter?: { jobField?: string; region?: string; sort?: string }): Promise<JobPosting[]> {
  await randomDelay();
  mayFail();
  const { defaultJobs } = await import('@/mocks/data/jobs');
  return [...defaultJobs];
}

export async function getJobDetail(id: string): Promise<JobPosting> {
  await randomDelay();
  mayFail();
  const { defaultJobs } = await import('@/mocks/data/jobs');
  const job = defaultJobs.find(j => j.id === id);
  if (!job) throw new Error(`Job not found: ${id}`);
  return { ...job };
}

export async function getJobsList(_filter?: { jobField?: string; region?: string; sort?: string }): Promise<JobPosting[]> {
  await randomDelay();
  mayFail();
  const { defaultJobs } = await import('@/mocks/data/jobs');
  return [...defaultJobs];
}

// ---------- Roadmap ----------

export async function generateRoadmap(_jobId?: string): Promise<Roadmap> {
  const steps = ['스펙 분석 중', '공고 208건 대조 중', '갭 산출 중', '로드맵 생성 중'];
  for (const step of steps) {
    console.log(`[generateRoadmap] ${step}...`);
    await delay(375);
  }
  mayFail();
  const map = getTaskStatusMap();
  const roadmap = { ...getScenarioData().roadmap };
  return applyStatusToRoadmap(roadmap, map);
}

export async function getRoadmap(): Promise<Roadmap> {
  await randomDelay();
  mayFail();
  const map = getTaskStatusMap();
  const roadmap = { ...getScenarioData().roadmap };
  return applyStatusToRoadmap(roadmap, map);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<Roadmap> {
  await randomDelay();
  mayFail();
  const map = getTaskStatusMap();
  map[taskId] = status;
  saveTaskStatusMap(map);
  const roadmap = { ...getScenarioData().roadmap };
  return applyStatusToRoadmap(roadmap, map);
}

export async function addTaskFromDoDream(programId: string): Promise<Roadmap> {
  await randomDelay();
  mayFail();
  const ids = getDoDreamAddedIds();
  ids.add(programId);
  saveDoDreamAddedIds(ids);
  const roadmap = { ...getScenarioData().roadmap };
  return applyStatusToRoadmap(roadmap, getTaskStatusMap());
}

export function getDoDreamAddedIdSet(): Set<string> {
  return getDoDreamAddedIds();
}

export async function addDoDreamTask(_program: DoDreamProgram): Promise<void> {
  await randomDelay();
  // Stored via Zustand; this just simulates network round-trip
}

// ---------- DoDream ----------

export async function getDoDreamPrograms(_filter?: { category?: string; creditLinked?: boolean; gapRelated?: boolean }): Promise<DoDreamProgram[]> {
  await randomDelay();
  mayFail();
  return [...getScenarioData().dodreamPrograms];
}

// ---------- Opportunities ----------

export async function getOpportunities(): Promise<Opportunity[]> {
  await randomDelay();
  mayFail();
  return [...getScenarioData().opportunities];
}

export async function markOpportunityRead(_id: string): Promise<void> {
  await randomDelay();
}

// ---------- Behavior Log ----------

export async function logBehavior(e: BehaviorEvent): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.BEHAVIOR);
  const events: BehaviorEvent[] = raw ? JSON.parse(raw) : [];
  events.push(e);
  localStorage.setItem(STORAGE_KEYS.BEHAVIOR, JSON.stringify(events));
}

// ---------- Legacy compat exports ----------

export function getReadOppIds(): Set<string> {
  return new Set<string>();
}

export function markOppRead(_id: string): void {
  // handled by UIStore
}

export function saveOpportunities(_opps: Opportunity[]): void {
  // handled by UIStore
}

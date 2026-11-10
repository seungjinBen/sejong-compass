/**
 * API 진입점.
 * - 백엔드가 제공하는 기능(인증·프로필·전공·취업목표·이력·온보딩·코드표·성적표)은
 *   ./auth, ./me, ./codes, ./session 에서 실제 Compass API 를 호출한다.
 * - 백엔드가 아직 제공하지 않는 분석 기능(갭 분석·로드맵·채용공고·두드림·기회 알림·행동 로그)은
 *   아래 목업 구현을 유지한다. 백엔드 추가 시 함수 단위로 교체한다.
 */
import type {
  GapAxis, JobPosting, Roadmap, TaskStatus, DoDreamProgram, Opportunity,
  BehaviorEvent, QualitativeInsight,
} from '@/types';
import { getActiveScenario, scenarios } from '@/mocks/scenarios';

export * from './http';
export * from './auth';
export * from './codes';
export * from './me';
export * from './session';

const FAIL_RATE = Number(import.meta.env['VITE_MOCK_FAIL_RATE'] ?? 0);

const STORAGE_KEYS = {
  TASK_STATUS: 'sc:task_status',
  DODREAM_ADDED: 'sc:dodream_added',
  BEHAVIOR: 'sc:behavior',
} as const;

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
    quarters: semesters,
    currentQuarter: roadmap.currentSemester,
    progressPercent,
    currentMatchRate,
  };
}

// ---------- Gap Analysis (mock) ----------

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

// ---------- Jobs (mock) ----------

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

// ---------- Roadmap (mock) ----------

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
}

// ---------- DoDream (mock) ----------

export async function getDoDreamPrograms(_filter?: { category?: string; creditLinked?: boolean; gapRelated?: boolean }): Promise<DoDreamProgram[]> {
  await randomDelay();
  mayFail();
  return [...getScenarioData().dodreamPrograms];
}

// ---------- Opportunities (mock) ----------

export async function getOpportunities(): Promise<Opportunity[]> {
  await randomDelay();
  mayFail();
  return [...getScenarioData().opportunities];
}

export async function markOpportunityRead(_id: string): Promise<void> {
  await randomDelay();
}

// ---------- Behavior Log (mock) ----------

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

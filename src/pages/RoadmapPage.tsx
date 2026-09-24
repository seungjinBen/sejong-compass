import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import {
  ChevronDown, ChevronUp, Target, TrendingUp, ExternalLink,
  Star, SkipForward, Check,
} from 'lucide-react';
import { animate } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { SlideOver } from '@/components/common/SlideOver';
import { GainBadge } from '@/components/common/GainBadge';
import { TaskTypeIcon } from '@/components/common/TaskTypeIcon';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ReasonPanel } from '@/components/reason/ReasonPanel';
import { useUserStore, useRoadmapStore, useUIStore } from '@/store';
import { updateTaskStatus as apiUpdateTaskStatus, logBehavior } from '@/api';
import type { RoadmapTask, TaskStatus, CertDetail, DoDreamProgram } from '@/types';

// Animated number — initialize with target to avoid 0→N animation on mount
function useAnimatedNumber(target: number) {
  const [v, setV] = useState(target);
  const stopRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    stopRef.current?.();
    const ctrl = animate(v, target, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (n: number) => setV(Math.round(n)),
    });
    stopRef.current = () => ctrl.stop();
    return () => ctrl.stop();
    // intentionally omit v — animate from last displayed value, not from 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return v;
}

function isCertDetails(arr: unknown[]): arr is CertDetail[] {
  return arr.length > 0 && typeof (arr[0] as Record<string, unknown>)['applyPeriod'] === 'string';
}

function isDodreamDetails(arr: unknown[]): arr is DoDreamProgram[] {
  return arr.length > 0 && typeof (arr[0] as Record<string, unknown>)['category'] === 'string';
}

// Skip reason options
const SKIP_REASONS = ['이미 보유', '관심 없음', '시간 부족'] as const;

export function RoadmapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobParam = searchParams.get('job');
  const taskParam = searchParams.get('task');

  const target = useUserStore(s => s.target);
  const roadmap = useRoadmapStore(s => s.roadmap);
  const updateTaskInStore = useRoadmapStore(s => s.updateTaskStatus);
  const setRoadmap = useRoadmapStore(s => s.setRoadmap);
  const { showToast } = useUIStore();

  // Suppress unused variable warning — target is available for future use
  void target;

  const [expandedSemesters, setExpandedSemesters] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<RoadmapTask | null>(null);
  const [selectedGapSkillId, setSelectedGapSkillId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [skipTask, setSkipTask] = useState<{ taskId: string; reason: string } | null>(null);
  const currentSemRef = useRef<HTMLDivElement>(null);

  const matchRate = roadmap?.currentMatchRate ?? 0;
  const targetMatchRate = roadmap?.targetMatchRate ?? 92;
  const animatedRate = useAnimatedNumber(matchRate);

  // Auto-expand current semester
  useEffect(() => {
    if (roadmap) {
      setExpandedSemesters(new Set([roadmap.currentSemester]));
    }
  }, [roadmap]);

  // Auto-scroll to current semester
  useEffect(() => {
    const timer = setTimeout(() => {
      currentSemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 200);
    return () => clearTimeout(timer);
  }, [roadmap]);

  // Deep link: open task from ?task= param
  useEffect(() => {
    if (taskParam && roadmap) {
      const task = roadmap.semesters
        .flatMap(s => s.tasks)
        .find(t => t.id === taskParam || t.skillIds.includes(taskParam));
      if (task) {
        setSelectedTask(task);
        setPanelOpen(true);
      }
    }
  }, [taskParam, roadmap]);

  const handleToggleTask = useCallback(async (task: RoadmapTask) => {
    const nextStatus: TaskStatus = task.status === 'DONE' ? 'IN_PROGRESS' : 'DONE';
    // Optimistic update
    updateTaskInStore(task.id, nextStatus);
    setLoadingTask(task.id);
    try {
      const updated = await apiUpdateTaskStatus(task.id, nextStatus);
      setRoadmap(updated);
      if (nextStatus === 'DONE') {
        showToast(`"${task.title}" 완료 +${task.expectedGain}%p`);
        await logBehavior({ type: 'TASK_DONE', targetId: task.id, at: new Date().toISOString() });
      }
    } catch {
      updateTaskInStore(task.id, task.status);
      showToast('업데이트 실패');
    } finally {
      setLoadingTask(null);
    }
  }, [updateTaskInStore, setRoadmap, showToast]);

  const handleSkipTask = async (taskId: string, reason: string) => {
    updateTaskInStore(taskId, 'SKIPPED');
    setSkipTask(null);
    try {
      const updated = await apiUpdateTaskStatus(taskId, 'SKIPPED');
      setRoadmap(updated);
      await logBehavior({ type: 'TASK_SKIP', targetId: taskId, at: new Date().toISOString() });
      showToast(`건너뜀 처리 (${reason})`);
    } catch {
      updateTaskInStore(taskId, 'TODO');
      showToast('처리 실패');
    }
  };

  const handleSetStatus = async (taskId: string, status: TaskStatus) => {
    updateTaskInStore(taskId, status);
    try {
      const updated = await apiUpdateTaskStatus(taskId, status);
      setRoadmap(updated);
      // Sync selected task state
      const updatedTask = updated.semesters.flatMap(s => s.tasks).find(t => t.id === taskId);
      if (updatedTask) setSelectedTask(updatedTask);
    } catch {
      showToast('업데이트 실패');
    }
  };

  // Predicted match rate data for LineChart
  const lineData = (roadmap?.semesters ?? []).map(s => ({
    label: s.label
      .replace('년', '')
      .replace('학기', '학')
      .replace('방학', '방'),
    rate: s.predictedMatchRate,
  }));

  if (!roadmap) {
    return (
      <PageShell title="커리어 로드맵">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="커리어 로드맵">
      {/* Goal bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-primary" />
            <span className="text-sm font-semibold text-ink">
              {jobParam ? '[공고 기준] ' : ''}목표: {roadmap.targetLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-bold text-primary tabular-nums">{animatedRate}</span>
              <span className="text-sm text-gray-400">/ {targetMatchRate}%</span>
            </div>
            <TrendingUp size={16} className="text-success" />
            <span className="text-xs text-gray-500">
              진행률 <strong>{roadmap.progressPercent}%</strong>
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${roadmap.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex gap-4 items-start">
        {/* LEFT: Top gaps panel */}
        {roadmap.topGaps.length > 0 && (
          <div className="w-48 shrink-0">
            <p className="text-xs font-semibold text-gray-600 mb-2 px-1">부족 역량</p>
            <div className="space-y-1.5">
              {[...roadmap.topGaps]
                .sort((a, b) => b.importance - a.importance)
                .map(gap => (
                  <button
                    key={gap.skillId}
                    onClick={() => {
                      setSelectedGapSkillId(gap.skillId);
                      // Find first task containing this skillId
                      const task = roadmap.semesters
                        .flatMap(s => s.tasks)
                        .find(t => t.skillIds.includes(gap.skillId));
                      if (task) {
                        setSelectedTask(task);
                        setPanelOpen(true);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all ${
                      selectedGapSkillId === gap.skillId
                        ? 'border-primary bg-primary-light'
                        : 'border-gray-100 bg-white hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-ink">{gap.name}</span>
                      <span className="text-warn text-[10px]">
                        {'★'.repeat(gap.importance)}{'☆'.repeat(3 - gap.importance)}
                      </span>
                    </div>
                    <StatusBadge status={gap.status} />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* RIGHT: Semester timeline */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          {/* Predicted score line chart */}
          {lineData.length > 0 && (
            <div className="h-16 mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis domain={['auto', 'auto']} hide />
                  <RechartsTooltip
                    formatter={(v: number | string) => [`${v}%`, '예상 매칭률']}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#C8102E"
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: '#C8102E' }}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Semester columns */}
          <div className="flex gap-3 min-w-max">
            {roadmap.semesters.map((sem, idx) => {
              const isCurrent = sem.key === roadmap.currentSemester;
              const currentIdx = roadmap.semesters.findIndex(s => s.key === roadmap.currentSemester);
              const isPast = idx < currentIdx;
              const isExpanded = expandedSemesters.has(sem.key) || isCurrent;
              const dimmed = !isCurrent && !isExpanded;

              return (
                <div
                  key={sem.key}
                  ref={isCurrent ? currentSemRef : undefined}
                  className={`w-64 shrink-0 rounded-xl border transition-all bg-white ${
                    isCurrent ? 'border-primary shadow-sm' : 'border-gray-200'
                  } ${dimmed ? 'opacity-60' : ''}`}
                >
                  {/* Semester header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100"
                    onClick={() => {
                      if (isCurrent) return;
                      setExpandedSemesters(prev => {
                        const next = new Set(prev);
                        if (next.has(sem.key)) next.delete(sem.key);
                        else next.add(sem.key);
                        return next;
                      });
                    }}
                  >
                    <div>
                      <p className={`text-xs font-bold ${isCurrent ? 'text-primary' : 'text-gray-600'}`}>
                        {sem.label}
                      </p>
                      <p className="text-[11px] text-gray-400">{sem.predictedMatchRate}% 예상</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isCurrent && (
                        <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full">
                          현재
                        </span>
                      )}
                      {isPast && !isCurrent && (
                        isExpanded
                          ? <ChevronUp size={14} className="text-gray-400" />
                          : <ChevronDown size={14} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Task list */}
                  {(isExpanded || isCurrent) && (
                    <div className="p-3 space-y-2">
                      {sem.tasks.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">태스크 없음</p>
                      ) : (
                        sem.tasks.map(task => {
                          const isDone = task.status === 'DONE';
                          const isSkipped = task.status === 'SKIPPED';
                          const isLoading = loadingTask === task.id;
                          const isHighlighted =
                            selectedGapSkillId !== null &&
                            task.skillIds.includes(selectedGapSkillId);

                          return (
                            <div
                              key={task.id}
                              className={`rounded-xl border p-3 transition-all cursor-pointer ${
                                isDone
                                  ? 'bg-green-50 border-green-100'
                                  : isSkipped
                                  ? 'bg-gray-50 border-gray-100 opacity-60'
                                  : isHighlighted
                                  ? 'border-primary bg-primary-light/10'
                                  : 'border-gray-100 bg-white hover:border-primary/30'
                              }`}
                              onClick={() => {
                                setSelectedTask(task);
                                setPanelOpen(true);
                              }}
                            >
                              <div className="flex items-start gap-2">
                                {/* Checkbox */}
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (!isSkipped) void handleToggleTask(task);
                                  }}
                                  disabled={isLoading || isSkipped}
                                  className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                                    isDone
                                      ? 'bg-success border-success'
                                      : 'border-gray-300 hover:border-primary'
                                  } disabled:opacity-40`}
                                  aria-label={isDone ? '완료 취소' : '완료'}
                                >
                                  {isDone && !isLoading && (
                                    <Check size={10} className="text-white" />
                                  )}
                                  {isLoading && (
                                    <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />
                                  )}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <TaskTypeIcon type={task.type} size="sm" />
                                    <p
                                      className={`text-xs font-medium flex-1 truncate ${
                                        isDone || isSkipped ? 'line-through text-gray-400' : 'text-ink'
                                      }`}
                                    >
                                      {task.title}
                                    </p>
                                  </div>
                                  {task.constraint && (
                                    <p className="text-[11px] text-gray-400 mb-1 truncate">
                                      {task.constraint}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <GainBadge gain={isDone ? 0 : task.expectedGain} />
                                    {task.status === 'IN_PROGRESS' && (
                                      <span className="text-[11px] text-blue-600 font-medium">
                                        진행중
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Skip button */}
                              {!isDone && !isSkipped && task.type !== 'EVENT' && (
                                <div className="mt-2 flex justify-end">
                                  {skipTask?.taskId === task.id ? (
                                    <div
                                      className="flex items-center gap-2"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <select
                                        value={skipTask.reason}
                                        onChange={e =>
                                          setSkipTask({ taskId: task.id, reason: e.target.value })
                                        }
                                        className="text-xs border border-gray-200 rounded px-1.5 py-1 outline-none"
                                      >
                                        {SKIP_REASONS.map(r => (
                                          <option key={r} value={r}>{r}</option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => void handleSkipTask(task.id, skipTask.reason)}
                                        className="text-xs text-danger hover:underline"
                                      >
                                        확인
                                      </button>
                                      <button
                                        onClick={() => setSkipTask(null)}
                                        className="text-xs text-gray-400"
                                      >
                                        취소
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        setSkipTask({ taskId: task.id, reason: SKIP_REASONS[0] });
                                      }}
                                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600"
                                    >
                                      <SkipForward size={10} /> 건너뛰기
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lv.3 SlideOver Panel */}
      <SlideOver
        isOpen={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelectedTask(null);
          setSelectedGapSkillId(null);
        }}
        title={selectedTask?.title ?? '상세'}
        width="w-96"
      >
        {selectedTask && (
          <div className="space-y-4">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <TaskTypeIcon type={selectedTask.type} size="md" showLabel />
              <StatusBadge status={selectedTask.status} />
              {selectedGapSkillId !== null && (
                <span className="text-[11px] text-warn flex items-center gap-0.5">
                  <Star size={10} fill="currentColor" /> 부족 역량
                </span>
              )}
              {selectedTask.expectedGain > 0 && (
                <GainBadge gain={selectedTask.expectedGain} />
              )}
            </div>

            {/* Reason panel */}
            <ReasonPanel reason={selectedTask.reason} collapsible={false} defaultExpanded />

            {/* CERT details */}
            {selectedTask.type === 'CERT' &&
              selectedTask.detail != null &&
              Array.isArray(selectedTask.detail) &&
              isCertDetails(selectedTask.detail as unknown[]) && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">자격증 일정</p>
                  <div className="space-y-2">
                    {(selectedTask.detail as CertDetail[]).map((cert, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-3 text-xs">
                        <p className="font-semibold text-ink mb-1.5">{cert.name}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-gray-500 mb-2">
                          <span>접수기간</span>
                          <span className="text-ink">{cert.applyPeriod}</span>
                          <span>시험일</span>
                          <span className="text-ink">{cert.examDate}</span>
                          {cert.dDay !== null && (
                            <>
                              <span>D-day</span>
                              <span
                                className={`font-semibold ${
                                  cert.dDay <= 7 ? 'text-danger' : 'text-ink'
                                }`}
                              >
                                D-{cert.dDay}
                              </span>
                            </>
                          )}
                        </div>
                        {cert.note && (
                          <p className="text-gray-400 text-[11px] mb-2">{cert.note}</p>
                        )}
                        <a
                          href={cert.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                        >
                          접수 안내 <ExternalLink size={11} />
                        </a>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => void handleSetStatus(selectedTask.id, 'DONE')}
                    className="w-full mt-3 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    이행 선택 완료
                  </button>
                </div>
              )}

            {/* DODREAM details */}
            {selectedTask.type === 'DODREAM' && (
              <div className="border border-amber-200 rounded-xl p-3 bg-amber-50">
                <p className="text-xs font-semibold text-amber-700 mb-2">두드림 연계 프로그램</p>
                {selectedTask.detail != null &&
                  Array.isArray(selectedTask.detail) &&
                  isDodreamDetails(selectedTask.detail as unknown[]) &&
                  (selectedTask.detail as DoDreamProgram[]).map((p, i) => (
                    <div key={i} className="text-xs mb-2">
                      <p className="font-medium text-ink">{p.title}</p>
                      <p className="text-gray-500 mt-0.5">{p.category} · 마감 {p.applyDeadline}</p>
                    </div>
                  ))}
                <div className="flex gap-2 mt-3">
                  <a
                    href="https://dodream.sejong.ac.kr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-xs bg-amber-600 text-white rounded-lg py-2 hover:bg-amber-700 flex items-center justify-center gap-1 transition-colors"
                  >
                    두드림 신청 <ExternalLink size={11} />
                  </a>
                  <button
                    onClick={() => { setPanelOpen(false); navigate('/dodream'); }}
                    className="flex-1 text-xs border border-amber-300 text-amber-700 rounded-lg py-2 hover:bg-amber-100 transition-colors"
                  >
                    더 보기 →
                  </button>
                </div>
              </div>
            )}

            {/* Alternative switcher */}
            {selectedTask.reason.alternatives != null &&
              selectedTask.reason.alternatives.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">대안 처방 (이걸로 바꾸기)</p>
                  <div className="space-y-1.5">
                    {selectedTask.reason.alternatives.map((alt, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-100 hover:border-primary transition-colors"
                      >
                        <TaskTypeIcon type={alt.type} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-ink truncate">{alt.title}</p>
                          {alt.constraint && (
                            <p className="text-[11px] text-gray-400 truncate">{alt.constraint}</p>
                          )}
                        </div>
                        <GainBadge gain={alt.expectedGain} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Status segment control */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">상태 변경</p>
              <div className="grid grid-cols-4 gap-1 text-xs">
                {(['TODO', 'IN_PROGRESS', 'DONE', 'SKIPPED'] as TaskStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => void handleSetStatus(selectedTask.id, s)}
                    className={`py-2 rounded-lg border text-center transition-colors ${
                      selectedTask.status === s
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {s === 'TODO'
                      ? '예정'
                      : s === 'IN_PROGRESS'
                      ? '진행중'
                      : s === 'DONE'
                      ? '완료'
                      : '건너뛰기'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOver>
    </PageShell>
  );
}

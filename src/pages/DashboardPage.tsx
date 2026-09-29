import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { ExternalLink, ArrowUpRight, Target, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { animate } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardHeader } from '@/components/common/Card';
import { GainBadge } from '@/components/common/GainBadge';
import { TaskTypeIcon } from '@/components/common/TaskTypeIcon';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SkeletonCard } from '@/components/common/Skeleton';
import { useUserStore, useRoadmapStore, useUIStore } from '@/store';
import { updateTaskStatus as apiUpdateTaskStatus, logBehavior } from '@/api';
import { startRealtimeSimulation } from '@/mocks/realtime';
import { getActiveScenario } from '@/mocks/scenarios';
import { selectUpcomingTasks, selectCompletedSemesterTasks } from '@/store/selectors';
import type { GapAxis, TaskStatus, UserProfile } from '@/types';

// Animated number hook (framer-motion)
function useAnimatedNumber(target: number, duration = 600) {
  const [current, setCurrent] = useState(0);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    stopRef.current?.();
    const controls = animate(0, target, {
      duration: duration / 1000,
      ease: 'easeOut',
      onUpdate: (v) => setCurrent(Math.round(v)),
    });
    stopRef.current = () => controls.stop();
    return () => controls.stop();
  }, [target, duration]);

  return current;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function computeSpecCompleteness(profile: UserProfile): number {
  const checks = [
    !!profile.language,
    profile.certifications.length > 0,
    profile.awards.length > 0,
    profile.internships.length > 0,
    profile.projects.length > 0,
    !!profile.githubUrl,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// D-day badge
function DDayBadge({ dueDate }: { dueDate?: string }) {
  if (!dueDate) return null;
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  if (days < 0) return <span className="text-[11px] text-gray-400">기한 초과</span>;
  if (days === 0)
    return <span className="text-[11px] font-semibold text-danger">D-day</span>;
  return (
    <span className={`text-[11px] font-semibold ${days <= 7 ? 'text-warn' : 'text-gray-400'}`}>
      D-{days}
    </span>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const target = useUserStore((s) => s.target);
  const roadmap = useRoadmapStore((s) => s.roadmap);
  const updateTask = useRoadmapStore((s) => s.updateTaskStatus);
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const qualitativeInsights = useRoadmapStore((s) => s.qualitativeInsights);
  const { opportunities, addOpportunity, updateDoDreamCapacity, showToast } = useUIStore();

  const specCompleteness = profile ? computeSpecCompleteness(profile) : 0;

  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  // gapAxes are stored on window by routes.tsx
  const [gapAxes, setGapAxes] = useState<GapAxis[]>(() => {
    const win = window as Window & { __sc_gapAxes?: GapAxis[] };
    return win.__sc_gapAxes ?? [];
  });

  useEffect(() => {
    const t = setTimeout(() => {
      const win = window as Window & { __sc_gapAxes?: GapAxis[] };
      const axes = win.__sc_gapAxes ?? [];
      if (axes.length > 0) setGapAxes(axes);
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);

  const matchRate = roadmap?.currentMatchRate ?? 0;
  const targetMatchRate = roadmap?.targetMatchRate ?? 92;
  const animatedRate = useAnimatedNumber(matchRate, 600);
  const isSenior = getActiveScenario() === 'senior';

  // Get top 3 upcoming tasks from current semester, plus completed ones (shown struck-through)
  const upcomingTasks = roadmap ? selectUpcomingTasks(roadmap, 3) : [];
  const completedTasks = roadmap ? selectCompletedSemesterTasks(roadmap) : [];

  // Biggest gap: sort ascending by deltaPercent (most negative = biggest gap)
  const biggestGap = gapAxes.length > 0
    ? [...gapAxes].sort((a, b) => a.deltaPercent - b.deltaPercent)[0]
    : null;

  // Track most recent opportunity update time
  useEffect(() => {
    if (opportunities.length === 0) return;
    const latest = opportunities.reduce((max, o) => (o.createdAt > max ? o.createdAt : max), '');
    setLastUpdatedAt(latest);
  }, [opportunities]);

  // Realtime simulation
  useEffect(() => {
    const stop = startRealtimeSimulation(
      (opp) => {
        addOpportunity(opp);
        showToast(`새 기회 알림: ${opp.title}`);
      },
      (id, current) => updateDoDreamCapacity(id, current),
    );
    return stop;
  }, [addOpportunity, showToast, updateDoDreamCapacity]);

  const handleTaskToggle = useCallback(
    async (taskId: string, currentStatus: TaskStatus) => {
      const nextStatus: TaskStatus = currentStatus === 'DONE' ? 'IN_PROGRESS' : 'DONE';

      // Find task for gain
      const task = roadmap?.semesters.flatMap((s) => s.tasks).find((t) => t.id === taskId);
      const gain = nextStatus === 'DONE' ? (task?.expectedGain ?? 0) : 0;

      // Optimistic update
      updateTask(taskId, nextStatus);
      setTaskError(null);
      setLoadingTask(taskId);

      try {
        const updated = await apiUpdateTaskStatus(taskId, nextStatus);
        setRoadmap(updated);
        if (nextStatus === 'DONE' && gain > 0) {
          showToast(`매칭률 ${matchRate} → ${matchRate + gain}`, {
            label: '로드맵 보기',
            onClick: () => navigate('/roadmap'),
          });
          await logBehavior({
            type: 'TASK_DONE',
            targetId: taskId,
            at: new Date().toISOString(),
          });
        }
      } catch {
        // Rollback
        updateTask(taskId, currentStatus);
        setTaskError(taskId);
        showToast('업데이트 실패 — 다시 시도해주세요');
      } finally {
        setLoadingTask(null);
      }
    },
    [roadmap, matchRate, updateTask, setRoadmap, showToast, navigate],
  );

  const radarData = gapAxes.map((ax) => ({
    subject: ax.label,
    내스펙: ax.mine,
    목표요구: ax.required,
    myValueText: ax.myValueText,
    requiredText: ax.requiredText,
    key: ax.key,
    status: ax.status,
  }));

  const handleAxisClick = (axisData: unknown) => {
    if (axisData && typeof axisData === 'object' && 'value' in axisData) {
      const ax = gapAxes.find(
        (a) => a.label === (axisData as { value: string }).value,
      );
      if (ax) navigate(`/diagnosis#axis=${ax.key}`);
    }
  };

  // Recharts tick renderer for PolarAngleAxis
  const renderAxisTick = (props: unknown) => {
    const { x, y, payload } = props as {
      x: number;
      y: number;
      payload: { value: string };
    };
    const isGap = biggestGap?.label === payload.value;
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fill={isGap ? '#DC2626' : '#6b7280'}
        fontWeight={isGap ? 700 : 400}
        style={{ cursor: 'pointer' }}
        onClick={() => handleAxisClick({ value: payload.value })}
      >
        {payload.value}
      </text>
    );
  };

  // Recharts tooltip formatter
  const tooltipFormatter = (
    value: number | string,
    name: string,
    props: { payload?: Record<string, unknown> },
  ): [string, string] => {
    const entry = props.payload ?? {};
    if (name === '내 스펙') return [String(entry['myValueText'] ?? ''), '내 스펙'];
    if (name === '목표 요구') return [String(entry['requiredText'] ?? ''), '목표 요구'];
    return [String(value), name];
  };

  return (
    <PageShell title="대시보드">
      {/* Senior banner */}
      {isSenior && (
        <div className="mb-5 rounded-xl bg-ink text-white p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">
              지원 시기입니다 — 준비된 이력서로 지원하세요
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              매칭률 {matchRate}% · {target?.targetCompany} {target?.targetRole}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="https://www.wanted.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white text-ink rounded-lg px-3 py-1.5 font-semibold hover:bg-gray-100 flex items-center gap-1"
            >
              원티드에서 지원 <ExternalLink size={11} />
            </a>
            <a
              href="https://www.saramin.co.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-white text-white rounded-lg px-3 py-1.5 hover:bg-white/10 flex items-center gap-1"
            >
              사람인에서 지원 <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}

      {/* Personal spec completeness nudge */}
      {profile && specCompleteness < 100 && (
        <div className="mb-5 rounded-xl bg-primary-light border border-primary/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-ink">
                개인 스펙을 채워보세요 (완성도 {specCompleteness}%)
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                자격증·프로젝트 등을 추가하면 더 다양한 기회를 보여드릴 수 있어요
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/spec')}
            className="shrink-0 text-xs bg-primary text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-primary-dark transition-colors"
          >
            스펙 입력하기 →
          </button>
        </div>
      )}

      {/* Top row: Score card + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Score Card */}
        <Card onClick={() => navigate('/roadmap')} className="cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Target size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500">
                  {target
                    ? `${target.targetCompany} - ${target.targetRole}`
                    : '목표 미설정'}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold text-primary tabular-nums">
                  {animatedRate}
                </span>
                <span className="text-2xl font-bold text-primary mb-1">%</span>
                <div className="flex items-center gap-1 mb-2 text-success">
                  <TrendingUp size={14} />
                  <span className="text-xs font-semibold">목표 {targetMatchRate}%</span>
                </div>
              </div>
            </div>
            <ArrowUpRight size={18} className="text-gray-300 mt-1" />
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${(matchRate / targetMatchRate) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              남은 갭{' '}
              <strong className="text-ink">
                {gapAxes.filter((a) => a.status !== 'MET').length}개
              </strong>
            </span>
            <span>
              진행률{' '}
              <strong className="text-ink">{roadmap?.progressPercent ?? 0}%</strong>
            </span>
          </div>

          {qualitativeInsights.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              {qualitativeInsights.map((insight) => (
                <p key={insight.label} className="text-[11px] text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-600">{insight.label}</span>
                  {' — '}
                  {insight.comment}
                </p>
              ))}
            </div>
          )}
        </Card>

        {/* Radar */}
        <Card>
          <CardHeader>스펙 레이더 — 목표 vs 내 스펙</CardHeader>
          {gapAxes.length === 0 ? (
            <SkeletonCard />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={renderAxisTick} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="목표 요구"
                    dataKey="목표요구"
                    stroke="#9ca3af"
                    fill="#9ca3af"
                    fillOpacity={0.12}
                    strokeDasharray="5 5"
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="내 스펙"
                    dataKey="내스펙"
                    stroke="#C8102E"
                    fill="#C8102E"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip formatter={tooltipFormatter} />
                </RadarChart>
              </ResponsiveContainer>
              {biggestGap && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    가장 큰 갭:
                    <span className="font-bold text-danger ml-1">{biggestGap.label}</span>
                    <span className="text-gray-400 ml-1">({biggestGap.myValueText})</span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 justify-center mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-gray-400" />
                  <span className="text-[11px] text-gray-400">목표 요구</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-primary" />
                  <span className="text-[11px] text-gray-400">내 스펙</span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Bottom row: Tasks + Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Current semester tasks */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardHeader className="mb-0">이번 학기 할 일</CardHeader>
            <button
              onClick={() => navigate('/roadmap')}
              className="text-xs text-primary hover:underline"
            >
              전체 보기 →
            </button>
          </div>

          {!roadmap ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-400">이번 학기 할 일이 없습니다 🎉</p>
              {specCompleteness < 100 && (
                <div className="mt-3 mx-auto max-w-xs bg-primary-light border border-primary/20 rounded-xl p-3">
                  <p className="text-xs text-gray-600">
                    개인 스펙을 채우면 더 맞춤화된 할 일을 추천해드릴 수 있어요
                  </p>
                  <button
                    onClick={() => navigate('/spec')}
                    className="mt-2 text-xs bg-primary text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-primary-dark transition-colors"
                  >
                    스펙 입력하기 →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const isDone = task.status === 'DONE';
                const isLoading = loadingTask === task.id;
                const hasError = taskError === task.id;
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      isDone
                        ? 'bg-green-50 border-green-100'
                        : hasError
                        ? 'bg-red-50 border-red-100'
                        : 'bg-background border-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => void handleTaskToggle(task.id, task.status)}
                      disabled={isLoading}
                      className={`mt-0.5 shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        isDone
                          ? 'bg-success border-success'
                          : 'border-gray-300 hover:border-primary'
                      } disabled:opacity-50`}
                      aria-label={isDone ? '완료 취소' : '완료 표시'}
                    >
                      {isDone && (
                        <span className="text-white text-[10px] font-bold">✓</span>
                      )}
                      {isLoading && (
                        <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TaskTypeIcon type={task.type} size="sm" />
                        <p
                          className={`text-sm font-medium flex-1 ${
                            isDone ? 'line-through text-gray-400' : 'text-ink'
                          }`}
                        >
                          {task.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasError && <AlertCircle size={12} className="text-danger" />}
                        {!isDone && <GainBadge gain={task.expectedGain} />}
                        <DDayBadge dueDate={task.dueDate} />
                        {task.constraint && (
                          <span className="text-[11px] text-gray-400 truncate">
                            {task.constraint}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                );
              })}
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">완료한 작업</p>
              <div className="space-y-1.5">
                {completedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 px-1">
                    <TaskTypeIcon type={task.type} size="sm" />
                    <p className="text-xs text-gray-400 line-through flex-1 truncate">
                      {task.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Opportunities */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <CardHeader className="mb-0">실시간 기회 알림</CardHeader>
            {lastUpdatedAt && (
              <span className="text-[11px] text-gray-400">
                마지막 업데이트 {formatTime(lastUpdatedAt)}
              </span>
            )}
          </div>
          {opportunities.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">새로운 알림이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {opportunities.slice(0, 3).map((opp) => {
                const kindColors: Record<string, string> = {
                  INTERN: 'bg-blue-100 text-blue-700',
                  BOOTCAMP: 'bg-purple-100 text-purple-700',
                  JOB: 'bg-primary-light text-primary',
                  DODREAM: 'bg-amber-100 text-amber-700',
                };
                const kindLabels: Record<string, string> = {
                  INTERN: '인턴',
                  BOOTCAMP: '부트캠프',
                  JOB: '공채',
                  DODREAM: '두드림',
                };
                return (
                  <div
                    key={opp.id}
                    className="p-3 rounded-xl bg-background border border-gray-100 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          kindColors[opp.kind] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {kindLabels[opp.kind] ?? opp.kind}
                      </span>
                      <p className="text-xs font-medium text-ink line-clamp-1">{opp.title}</p>
                    </div>
                    <p className="text-[11px] text-gray-500 mb-2 line-clamp-2">
                      {opp.reasonHeadline}
                    </p>
                    <a
                      href={opp.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        void logBehavior({
                          type: 'OPP_CLICK',
                          targetId: opp.id,
                          at: new Date().toISOString(),
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      {opp.ctaLabel} <ExternalLink size={11} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Hidden: used to surface profile for header greeting */}
      {profile && <span className="sr-only">{profile.name}</span>}
    </PageShell>
  );
}

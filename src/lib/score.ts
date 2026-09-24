import type { Roadmap, TaskStatus, GapAxis, GapStatus } from '@/types';

export function calcProgressPercent(roadmap: Roadmap): number {
  const allTasks = roadmap.semesters.flatMap(s => s.tasks);
  const nonSkipped = allTasks.filter(t => t.status !== 'SKIPPED');
  const done = allTasks.filter(t => t.status === 'DONE');
  if (nonSkipped.length === 0) return 0;
  return Math.round((done.length / nonSkipped.length) * 100);
}

export function calcCurrentMatchRate(baseRate: number, roadmap: Roadmap, targetMatchRate: number): number {
  const done = roadmap.semesters.flatMap(s => s.tasks).filter(t => t.status === 'DONE');
  const gain = done.reduce((acc, t) => acc + (t.expectedGain ?? 0), 0);
  return Math.min(targetMatchRate, baseRate + gain);
}

export function calcPredictedMatchRate(
  baseRate: number,
  roadmap: Roadmap,
  semesterKey: string,
  targetMatchRate: number,
): number {
  const semIdx = roadmap.semesters.findIndex(s => s.key === semesterKey);
  if (semIdx < 0) return baseRate;

  const upToSemester = roadmap.semesters.slice(0, semIdx + 1);
  const relevantTasks = upToSemester.flatMap(s => s.tasks).filter(
    t => t.status === 'DONE' || t.status === 'IN_PROGRESS' || t.status === 'TODO',
  );
  const gain = relevantTasks.reduce((acc, t) => acc + (t.expectedGain ?? 0), 0);
  return Math.min(targetMatchRate, baseRate + gain);
}

export function promoteGapStatus(current: GapStatus): GapStatus {
  if (current === 'LACK') return 'PARTIAL';
  if (current === 'PARTIAL') return 'MET';
  return 'MET';
}

export function recalcGapAxes(axes: GapAxis[], completedSkillIds: string[]): GapAxis[] {
  return axes.map(ax => {
    const hasEvidence = ax.evidences.some(e =>
      completedSkillIds.some(sid => e.label.toLowerCase().includes(sid.toLowerCase())),
    );
    if (!hasEvidence) return ax;
    return { ...ax, status: promoteGapStatus(ax.status) };
  });
}

export function applyTaskStatusChange(
  roadmap: Roadmap,
  taskId: string,
  newStatus: TaskStatus,
  baseMatchRate: number,
): Roadmap {
  const semesters = roadmap.semesters.map(s => ({
    ...s,
    tasks: s.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t),
  }));
  const updated: Roadmap = { ...roadmap, semesters };
  const progressPercent = calcProgressPercent(updated);
  const currentMatchRate = calcCurrentMatchRate(baseMatchRate, updated, roadmap.targetMatchRate);
  const updatedSemesters = semesters.map(s => ({
    ...s,
    predictedMatchRate: calcPredictedMatchRate(baseMatchRate, updated, s.key, roadmap.targetMatchRate),
  }));
  return { ...updated, semesters: updatedSemesters, progressPercent, currentMatchRate };
}

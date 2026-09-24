import type { Roadmap } from '@/types';
import { calcProgressPercent, calcCurrentMatchRate } from '@/lib/score';

export function selectProgressPercent(roadmap: Roadmap): number {
  return calcProgressPercent(roadmap);
}

export function selectCurrentMatchRate(roadmap: Roadmap, baseRate: number): number {
  return calcCurrentMatchRate(baseRate, roadmap, roadmap.targetMatchRate);
}

export function selectCurrentSemesterTasks(roadmap: Roadmap) {
  return roadmap.semesters.find(s => s.key === roadmap.currentSemester)?.tasks ?? [];
}

export function selectUpcomingTasks(roadmap: Roadmap, count = 3) {
  const current = selectCurrentSemesterTasks(roadmap);
  const notDone = current.filter(t => t.status !== 'DONE' && t.status !== 'SKIPPED');
  return notDone.slice(0, count);
}

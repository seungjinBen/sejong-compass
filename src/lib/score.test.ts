import { describe, it, expect } from 'vitest';
import { calcProgressPercent, calcCurrentMatchRate, promoteGapStatus, applyTaskStatusChange } from './score';
import type { Roadmap } from '@/types';

const makeRoadmap = (overrides: Partial<Roadmap> = {}): Roadmap => ({
  targetLabel: 'Test',
  currentMatchRate: 84,
  targetMatchRate: 92,
  progressPercent: 0,
  currentSemester: '2026-2',
  semesters: [
    {
      key: '2026-2',
      label: '2026-2',
      predictedMatchRate: 86,
      tasks: [
        { id: 't1', semester: '2026-2', type: 'COURSE', title: 'T1', status: 'DONE', skillIds: [], expectedGain: 3, reason: { headline: '', metrics: [] } },
        { id: 't2', semester: '2026-2', type: 'CERT', title: 'T2', status: 'TODO', skillIds: [], expectedGain: 2, reason: { headline: '', metrics: [] } },
        { id: 't3', semester: '2026-2', type: 'PROJECT', title: 'T3', status: 'SKIPPED', skillIds: [], expectedGain: 2, reason: { headline: '', metrics: [] } },
      ],
    },
  ],
  topGaps: [],
  ...overrides,
});

describe('calcProgressPercent', () => {
  it('counts DONE / non-SKIPPED tasks', () => {
    const r = makeRoadmap();
    expect(calcProgressPercent(r)).toBe(50); // 1 done / 2 non-skipped
  });

  it('returns 0 when all tasks are skipped', () => {
    const r = makeRoadmap();
    const allSkipped = r.semesters[0]!.tasks.map(t => ({ ...t, status: 'SKIPPED' as const }));
    const r2 = { ...r, semesters: [{ ...r.semesters[0]!, tasks: allSkipped }] };
    expect(calcProgressPercent(r2)).toBe(0);
  });
});

describe('calcCurrentMatchRate', () => {
  it('adds gain from DONE tasks', () => {
    const r = makeRoadmap();
    expect(calcCurrentMatchRate(84, r, 92)).toBe(87); // 84 + 3
  });

  it('caps at targetMatchRate', () => {
    const r = makeRoadmap();
    const allDone = r.semesters[0]!.tasks.map(t => ({ ...t, status: 'DONE' as const }));
    const r2 = { ...r, semesters: [{ ...r.semesters[0]!, tasks: allDone }] };
    expect(calcCurrentMatchRate(89, r2, 92)).toBe(92);
  });
});

describe('promoteGapStatus', () => {
  it('LACK -> PARTIAL', () => expect(promoteGapStatus('LACK')).toBe('PARTIAL'));
  it('PARTIAL -> MET', () => expect(promoteGapStatus('PARTIAL')).toBe('MET'));
  it('MET stays MET', () => expect(promoteGapStatus('MET')).toBe('MET'));
});

describe('applyTaskStatusChange', () => {
  it('updates task status and recalculates progress', () => {
    const r = makeRoadmap();
    const updated = applyTaskStatusChange(r, 't2', 'DONE', 84);
    const tasks = updated.semesters[0]!.tasks;
    expect(tasks.find(t => t.id === 't2')?.status).toBe('DONE');
    expect(updated.progressPercent).toBe(100);
  });
});

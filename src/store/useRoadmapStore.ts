import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Roadmap, TaskStatus, DoDreamProgram, QualitativeInsight } from '@/types';
import { applyTaskStatusChange } from '@/lib/score';

interface RoadmapState {
  roadmap: Roadmap | null;
  baseMatchRate: number;
  qualitativeInsights: QualitativeInsight[];
  setRoadmap: (r: Roadmap) => void;
  setBaseMatchRate: (rate: number) => void;
  setQualitativeInsights: (insights: QualitativeInsight[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addDoDreamTask: (program: DoDreamProgram, targetSemester?: string) => void;
  dodreamAddedIds: Set<string>;
  markDoDreamAdded: (id: string) => void;
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set, get) => ({
      roadmap: null,
      baseMatchRate: 84,
      qualitativeInsights: [],
      dodreamAddedIds: new Set<string>(),

      setRoadmap: (roadmap) => set({ roadmap }),

      setBaseMatchRate: (rate) => set({ baseMatchRate: rate }),

      setQualitativeInsights: (insights) => set({ qualitativeInsights: insights }),

      updateTaskStatus: (taskId, status) => {
        const { roadmap, baseMatchRate } = get();
        if (!roadmap) return;
        const updated = applyTaskStatusChange(roadmap, taskId, status, baseMatchRate);
        set({ roadmap: updated });
      },

      addDoDreamTask: (program, targetSemester) => {
        const { roadmap } = get();
        if (!roadmap) return;

        const semKey = targetSemester ?? roadmap.currentSemester;
        const newTaskId = `dodream-task-${program.id}-${Date.now()}`;

        const semesters = roadmap.semesters.map(s => {
          if (s.key !== semKey) return s;
          const exists = s.tasks.some(t => t.type === 'DODREAM' && t.title === program.title);
          if (exists) return s;
          return {
            ...s,
            tasks: [
              ...s.tasks,
              {
                id: newTaskId,
                semester: semKey,
                type: 'DODREAM' as const,
                title: program.title,
                status: 'TODO' as const,
                skillIds: [],
                expectedGain: program.expectedGain,
                dueDate: program.applyDeadline,
                reason: program.reason,
                detail: [program],
              },
            ],
          };
        });

        const updated = { ...roadmap, semesters };
        set({ roadmap: updated });

        const ids = new Set(get().dodreamAddedIds);
        ids.add(program.id);
        set({ dodreamAddedIds: ids });
      },

      markDoDreamAdded: (id) => {
        const ids = new Set(get().dodreamAddedIds);
        ids.add(id);
        set({ dodreamAddedIds: ids });
      },
    }),
    {
      name: 'sc:roadmap',
      partialize: (state) => ({
        roadmap: state.roadmap,
        baseMatchRate: state.baseMatchRate,
        dodreamAddedIds: [...state.dodreamAddedIds],
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<RoadmapState> & { dodreamAddedIds?: string[] };
        return {
          ...current,
          roadmap: p.roadmap ?? current.roadmap,
          baseMatchRate: p.baseMatchRate ?? current.baseMatchRate,
          dodreamAddedIds: new Set<string>(p.dodreamAddedIds ?? []),
        };
      },
    },
  ),
);

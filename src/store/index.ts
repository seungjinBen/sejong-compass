export { useUserStore } from './useUserStore';
export { useRoadmapStore } from './useRoadmapStore';
export { useUIStore } from './useUIStore';
export * from './selectors';

// Compatibility shim for existing pages that use useAppStore
import { useUserStore } from './useUserStore';
import { useRoadmapStore } from './useRoadmapStore';
import { useUIStore } from './useUIStore';
import { calcProgressPercent } from '@/lib/score';
import type { GapAxis, Roadmap, TaskStatus, DoDreamProgram, UserProfile, TargetCondition, Opportunity } from '@/types';

export function useAppStore() {
  const user = useUserStore();
  const roadmapStore = useRoadmapStore();
  const ui = useUIStore();

  const roadmap = roadmapStore.roadmap;

  return {
    // Profile
    profile: user.profile,
    target: user.target,
    setProfile: (p: UserProfile) => user.setProfile(p),
    setTarget: (t: TargetCondition) => user.setTarget(t),

    // Gap
    matchRate: roadmap
      ? (roadmap.currentMatchRate ?? roadmapStore.baseMatchRate)
      : roadmapStore.baseMatchRate,
    gapAxes: [] as GapAxis[],
    setGapData: (_matchRate: number, _axes: GapAxis[]) => {
      // Gap data is loaded from scenarios; this is a no-op shim
    },

    // Roadmap
    roadmap: roadmap as Roadmap | null,
    setRoadmap: (r: Roadmap) => roadmapStore.setRoadmap(r),
    updateTaskStatus: (taskId: string, status: TaskStatus) =>
      roadmapStore.updateTaskStatus(taskId, status),
    addDoDreamTask: (program: DoDreamProgram) =>
      roadmapStore.addDoDreamTask(program),

    // Opportunities
    opportunities: ui.opportunities,
    readOppIds: ui.readOppIds,
    setOpportunities: (opps: Opportunity[]) => ui.setOpportunities(opps),
    addOpportunity: (opp: Opportunity) => ui.addOpportunity(opp),
    markRead: (id: string) => ui.markOppRead(id),
    unreadCount: ui.unreadCount,

    // Toast
    toastMessage: ui.toasts[0]?.message ?? null,
    showToast: (msg: string) => ui.showToast(msg),
    clearToast: () => {
      // Toasts auto-dismiss; noop for compat
    },

    // Progress
    progressPercent: roadmap ? calcProgressPercent(roadmap) : 0,
  };
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, TargetCondition, BehaviorEvent } from '@/types';

interface UserState {
  profile: UserProfile | null;
  target: TargetCondition | null;
  setProfile: (p: UserProfile) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  setTarget: (t: TargetCondition) => void;
  logBehavior: (e: BehaviorEvent) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      target: null,

      setProfile: (profile) => set({ profile }),

      updateProfile: (partial) => {
        const existing = get().profile;
        if (!existing) return;
        set({ profile: { ...existing, ...partial } });
      },

      setTarget: (target) => set({ target }),

      logBehavior: (e) => {
        const raw = localStorage.getItem('sc:behavior');
        const events: BehaviorEvent[] = raw ? (JSON.parse(raw) as BehaviorEvent[]) : [];
        events.push(e);
        localStorage.setItem('sc:behavior', JSON.stringify(events));
      },
    }),
    {
      name: 'sc:user',
      partialize: (state) => ({ profile: state.profile, target: state.target }),
    },
  ),
);

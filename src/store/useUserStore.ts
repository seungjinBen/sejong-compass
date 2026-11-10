import { create } from 'zustand';
import type { UserProfile, TargetCondition, BehaviorEvent, OnboardingView } from '@/types';
import { isOnboardingComplete } from '@/api/session';

/**
 * 세션 사용자 상태. 서버 세션이 원본이므로 persist 하지 않는다.
 * 앱 시작 시 loadSession() 으로 채우고, 401 이벤트 시 clear() 한다.
 */
interface UserState {
  profile: UserProfile | null;
  target: TargetCondition | null;
  setProfile: (p: UserProfile) => void;
  updateProfile: (p: Partial<UserProfile>) => void;
  setOnboarding: (view: OnboardingView) => void;
  setTarget: (t: TargetCondition | null) => void;
  logBehavior: (e: BehaviorEvent) => void;
  clear: () => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  profile: null,
  target: null,

  setProfile: (profile) => set({ profile }),

  updateProfile: (partial) => {
    const existing = get().profile;
    if (!existing) return;
    set({ profile: { ...existing, ...partial } });
  },

  setOnboarding: (view) => {
    const existing = get().profile;
    if (!existing) return;
    set({ profile: { ...existing, onboarding: view, onboardingCompleted: isOnboardingComplete(view) } });
  },

  setTarget: (target) => set({ target }),

  logBehavior: (e) => {
    const raw = localStorage.getItem('sc:behavior');
    const events: BehaviorEvent[] = raw ? (JSON.parse(raw) as BehaviorEvent[]) : [];
    events.push(e);
    localStorage.setItem('sc:behavior', JSON.stringify(events));
  },

  clear: () => set({ profile: null, target: null }),
}));

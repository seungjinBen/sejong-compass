import { create } from 'zustand';
import type { Opportunity } from '@/types';

interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface UIState {
  toasts: Toast[];
  showToast: (message: string, action?: Toast['action']) => void;
  dismissToast: (id: string) => void;

  opportunities: Opportunity[];
  readOppIds: Set<string>;
  setOpportunities: (opps: Opportunity[]) => void;
  addOpportunity: (opp: Opportunity) => void;
  markOppRead: (id: string) => void;
  unreadCount: () => number;

  dodreamCapacities: Record<string, number>;
  updateDoDreamCapacity: (id: string, current: number) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],

  showToast: (message, action) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set(s => ({ toasts: [...s.toasts, { id, message, action }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 4000);
  },

  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  opportunities: [],
  readOppIds: new Set<string>(),

  setOpportunities: (opps) => set({ opportunities: opps }),

  addOpportunity: (opp) => {
    set(s => ({ opportunities: [opp, ...s.opportunities] }));
  },

  markOppRead: (id) => {
    set(s => ({ readOppIds: new Set([...s.readOppIds, id]) }));
  },

  unreadCount: () => {
    const { opportunities, readOppIds } = get();
    return opportunities.filter(o => !readOppIds.has(o.id) && !o.read).length;
  },

  dodreamCapacities: {},
  updateDoDreamCapacity: (id, current) =>
    set(s => ({ dodreamCapacities: { ...s.dodreamCapacities, [id]: current } })),
}));

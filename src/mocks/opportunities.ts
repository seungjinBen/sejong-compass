// Re-exports for backward compatibility — use @/mocks/data/opportunities instead
export { defaultOpportunities as mockOpportunities, defaultOpportunities } from '@/mocks/data/opportunities';

// Legacy realtime opportunity shim
import type { Opportunity } from '@/types';

export const realtimeOpportunity: Opportunity = {
  id: 'opp-rt-001',
  kind: 'JOB',
  title: '카카오 신입 백엔드 개발자 공채 (수시채용)',
  reasonHeadline: '목표 기업 카카오 신규 공채 — 지금 확인하세요',
  ctaLabel: '자세히보기',
  externalUrl: 'https://careers.kakao.com',
  createdAt: new Date().toISOString(),
  read: false,
};

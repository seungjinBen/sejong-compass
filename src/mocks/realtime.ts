import type { Opportunity } from '@/types';

type Callback = (opp: Opportunity) => void;
type CapacityCallback = (id: string, current: number) => void;

export function startRealtimeSimulation(
  onOpportunity: Callback,
  onCapacityChange?: CapacityCallback,
): () => void {
  const t1 = setTimeout(() => {
    onOpportunity({
      id: `opp-realtime-${Date.now()}`,
      kind: 'JOB',
      title: '네이버 2026 하반기 인턴 모집 공고',
      reasonHeadline: '목표 기업 네이버 신규 인턴 공고 — 지금 확인하세요',
      ctaLabel: '공고 보기',
      externalUrl: 'https://recruit.navercorp.com',
      createdAt: new Date().toISOString(),
      read: false,
    });
  }, 30_000);

  const t2 = setTimeout(() => {
    onCapacityChange?.('dodream-001', 23);
  }, 60_000);

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
  };
}

export function triggerImmediateNotification(
  onOpportunity: Callback,
  onCapacityChange?: CapacityCallback,
): void {
  onOpportunity({
    id: `opp-instant-${Date.now()}`,
    kind: 'DODREAM',
    title: '두드림 Docker 부트캠프 마감 임박!',
    reasonHeadline: '잔여 정원 7명 · 마감까지 D-2',
    ctaLabel: '신청하기',
    externalUrl: 'https://dodream.sejong.ac.kr',
    createdAt: new Date().toISOString(),
    read: false,
  });
  onCapacityChange?.('dodream-001', 23);
}

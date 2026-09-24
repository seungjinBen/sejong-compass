import type { Opportunity } from '@/types';

export const defaultOpportunities: Opportunity[] = [
  {
    id: 'opp-001',
    kind: 'JOB',
    title: '네이버 백엔드 인턴 공고 (매칭 88%)',
    reasonHeadline: '목표 기업 네이버 · 백엔드 인턴 공고 (매칭 88%)',
    ctaLabel: '공고 보기',
    externalUrl: 'https://recruit.navercorp.com',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'opp-002',
    kind: 'DODREAM',
    title: '두드림 Docker 부트캠프 신청 마감 D-9',
    reasonHeadline: '가장 큰 갭 Docker 해소 기회 — 신청 마감 D-9',
    ctaLabel: '신청하기',
    externalUrl: 'https://dodream.sejong.ac.kr',
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'opp-003',
    kind: 'BOOTCAMP',
    title: '카카오 코딩테스트 부트캠프 (무료)',
    reasonHeadline: '코딩테스트 갭 −2%p 해소 · 무료 온라인 과정',
    ctaLabel: '신청하기',
    externalUrl: 'https://kakao.com/bootcamp',
    createdAt: new Date().toISOString(),
    read: false,
  },
];

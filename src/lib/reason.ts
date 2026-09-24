export const skillGapHeadline = (p: { skill: string; ratio: number; role: string }): string =>
  `당신의 목표 공고(${p.role}) ${Math.round(p.ratio * 100)}%가 ${p.skill}을(를) 요구하지만, 아직 보유하지 않은 스킬입니다.`;

export const jobBlockerHeadline = (p: { met: number; total: number; blocker: string }): string =>
  `필수 스킬 ${p.total}개 중 ${p.met}개 보유, ${p.blocker}만 부족합니다.`;

export const dodreamHeadline = (p: { gaps: string[]; deadline: string; gain: number }): string =>
  `부족 역량 ${p.gaps.join('·')}을(를) 채우고 ${p.deadline}까지 신청 가능 (+${p.gain}%p)`;

export const taskGainHeadline = (p: { title: string; gain: number; skillCount: number }): string =>
  `${p.title} 완료 시 매칭률 +${p.gain}%p 상승 · ${p.skillCount}개 역량 향상`;

export const certHeadline = (p: { certName: string; jobRatio: number }): string =>
  `${p.certName} 취득 시 목표 공고 ${Math.round(p.jobRatio * 100)}%에서 가산점 적용`;

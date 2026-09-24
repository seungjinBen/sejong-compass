# Sejong Compass

세종대학교 학생 맞춤형 커리어 및 취업 가이드 서비스 — 프론트엔드 프로토타입

## 실행

```bash
npm install
npm run dev        # localhost:5173
npm run build      # dist/ 빌드
npx vitest run     # 유닛 테스트
npx tsc --noEmit   # 타입 검사
```

## 시나리오 전환

TopBar 우측 주황 점(●) 버튼 (DEV 모드 한정)으로 세 가지 시나리오를 즉시 전환할 수 있습니다.

| ID | 설명 | 상태 |
|----|------|------|
| `default` | 김세종 · 3학년 6학기 · 매칭률 84% | 온보딩 완료 |
| `coldStart` | 이도전 · 1학년 2학기 | 온보딩 미완료 → /explore 진입 |
| `senior` | 김졸업 · 4학년 8학기 · 매칭률 91% | 취업 준비 최종 단계 |

URL 파라미터로도 전환 가능: `?scenario=coldStart`

### 알림 즉시 발생

TopBar 시나리오 드롭다운 하단 **"알림 즉시 발생"** 버튼을 클릭하면
30초/60초 타이머를 건너뛰고 DODREAM 기회 알림과 두드림 잔여 정원 업데이트가 즉시 발생합니다.

## src/api/ 교체 가이드

모든 데이터 패칭은 `src/api/index.ts`의 함수를 통해 이루어집니다.
실제 백엔드 연동 시 해당 파일만 교체하면 됩니다.

```ts
// 현재: 목업 (200–500ms 지연)
export async function getProfile(): Promise<UserProfile> { ... }

// 교체 예시 (axios)
export async function getProfile(): Promise<UserProfile> {
  const { data } = await axios.get('/api/v1/profile');
  return data;
}
```

실패율 테스트: `.env.local`에 `VITE_MOCK_FAIL_RATE=0.3` 설정 시 30% 확률로 API 실패 시뮬레이션.

## 매칭률 재계산 규칙

`src/lib/score.ts`에 순수 함수로 구현되어 있으며, 스토어 및 API에서 공용으로 호출합니다.

```
currentMatchRate = baseRate + Σ(DONE 태스크 gain) - Σ(SKIPPED 태스크 gain)
                  단, targetMatchRate를 초과하지 않음

progressPercent  = DONE 태스크 수 / (전체 태스크 - SKIPPED) × 100

predictedMatchRate(semester) = 해당 학기까지의 DONE/IN_PROGRESS 태스크 gain 누적
```

## 행동 로그 스키마

사용자 행동은 `logBehavior()` API를 통해 `localStorage['sc:behavior']`에 JSON 배열로 누적됩니다.

```ts
interface BehaviorEvent {
  type: 'JOB_VIEW' | 'JOB_SAVE' | 'TASK_DONE' | 'TASK_SKIP'
       | 'DODREAM_ADD' | 'OPP_CLICK' | 'REASON_OPEN';
  targetId: string;   // job.id / task.id / opp.id / program.id
  at: string;         // ISO 8601
}
```

실제 백엔드에서는 `src/api/index.ts`의 `logBehavior()` 함수를 POST 엔드포인트로 교체합니다.

## 아키텍처 개요

```
src/
├── types/          도메인 타입 (단일 진실 소스)
├── mocks/          목업 데이터 + 시나리오 + 실시간 시뮬레이션
├── api/            API 함수 (교체 지점)
├── lib/            순수 함수 (score.ts, reason.ts)
├── store/          Zustand 스토어 3개
│   ├── useUserStore   (persist: sc:user)
│   ├── useRoadmapStore (persist: sc:roadmap)
│   └── useUIStore     (no persist)
├── components/     공용 컴포넌트
│   ├── common/     Toast, SlideOver, ConfirmDialog, MatchRateRing …
│   ├── layout/     PageShell, Sidebar, TopBar
│   └── reason/     ReasonPanel (3단 추천 이유)
└── pages/          6개 페이지 (lazy-loaded)
```

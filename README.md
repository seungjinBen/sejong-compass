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

시나리오는 **목업 분석 데이터(갭·로드맵·두드림·기회 알림)** 만 바꾼다. 프로필·취업목표는 백엔드 세션에서 온다.

| ID | 설명 |
|----|------|
| `default` | 3학년 · 매칭률 84% |
| `coldStart` | 신입생 · 데이터 거의 없음 |
| `senior` | 4학년 · 매칭률 91% · 지원 시기 배너 |

URL 파라미터로도 전환 가능: `?scenario=coldStart`

### 알림 즉시 발생

TopBar 시나리오 드롭다운 하단 **"알림 즉시 발생"** 버튼을 클릭하면
30초/60초 타이머를 건너뛰고 DODREAM 기회 알림과 두드림 잔여 정원 업데이트가 즉시 발생합니다.

## 백엔드 연동 (Compass API)

백엔드: `https://compass-dev-00gt.onrender.com` (스웨거 `/swagger-ui/index.html`, OpenAPI `/v3/api-docs`)

- **인증**: Spring 세션 쿠키(`JSESSIONID`) + CSRF. `src/api/http.ts` 가 모든 요청에 `credentials: 'include'` 를 붙이고,
  변경 요청(POST/PUT/PATCH/DELETE) 전에 `GET /api/v1/auth/csrf` 토큰을 `X-CSRF-TOKEN` 헤더로 첨부한다.
  `403 CSRF_INVALID` 는 재발급 후 1회 재시도, `401 UNAUTHENTICATED/SESSION_EXPIRED` 는 `sc:unauthenticated` 이벤트 → 로그인 화면.
- **CORS**: 백엔드가 localhost 오리진을 허용하지 않으므로 개발 서버는 `vite.config.ts` 의 `/api` 프록시로 동일 출처화한다.
  (`VITE_PROXY_TARGET` 으로 대상 변경, `VITE_API_BASE` 를 비우면 상대경로 `/api` 사용)
  브라우저가 POST 등에 붙이는 `Origin` 헤더도 백엔드가 거부(`Invalid CORS request` 403)하므로 프록시에서 `Origin`/`Referer` 를 제거해 전달한다.
- **로그인**: 학교 이메일 + 비밀번호. Render 개발 서버는 SMTP 가 꺼져 있어 회원가입/이메일 인증은 불가 → 백엔드가 준 테스트 계정 사용.
- **온보딩 완료 기준**: `GET /me/onboarding` 의 `BASIC_INFO`·`MAJORS`·`PREFERENCES` 가 모두 `COMPLETED`.
  선택 단계(프로젝트·인턴·수상·자격증)는 `/spec` 에서 기록이 생기면 `COMPLETED` 로 표시한다.

| 모듈 | 내용 |
|------|------|
| `src/api/http.ts` | fetch 래퍼, CSRF, `ApiError` |
| `src/api/auth.ts` | 로그인 / 로그아웃 |
| `src/api/me.ts` | 프로필, 전공, 취업목표, 온보딩, 자격증, 프로젝트·인턴·수상 CRUD, 성적표 XLSX, GitHub README |
| `src/api/codes.ts` + `src/hooks/useCodes.ts` | 공개 코드표(전공·직무·지역·자격증·기술스택) react-query 캐시 |
| `src/api/session.ts` | 로그인 세션 → `UserProfile`/`TargetCondition` 조립 |
| `src/api/index.ts` | 위 모듈 re-export + **아직 백엔드가 없는 기능의 목업** (갭 분석·로드맵·채용공고·두드림·기회 알림·행동 로그) |

백엔드에 해당 API 가 추가되면 `src/api/index.ts` 의 목업 함수를 같은 시그니처로 교체한다.

실패율 테스트: `.env.local`에 `VITE_MOCK_FAIL_RATE=0.3` 설정 시 목업 API 가 30% 확률로 실패한다.

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

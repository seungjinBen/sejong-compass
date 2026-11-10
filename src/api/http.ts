/**
 * Compass API 공통 HTTP 클라이언트.
 * - 세션 쿠키(JSESSIONID) 기반: 모든 요청에 credentials: 'include'
 * - 변경 요청(POST/PUT/PATCH/DELETE)에는 GET /auth/csrf 로 받은 토큰을 헤더로 첨부
 * - 403 CSRF_INVALID 는 토큰 재발급 후 1회 재시도
 * - 401 UNAUTHENTICATED / SESSION_EXPIRED 는 'sc:unauthenticated' 이벤트로 알림
 */

const BASE = (import.meta.env['VITE_API_BASE'] as string | undefined) ?? '';
const API = `${BASE}/api/v1`;

export const UNAUTHENTICATED_EVENT = 'sc:unauthenticated';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isApiError(e: unknown, code?: string): e is ApiError {
  if (!(e instanceof ApiError)) return false;
  return code ? e.code === code : true;
}

/** 사용자에게 보여줄 메시지로 변환 */
export function errorMessage(e: unknown, fallback = '요청에 실패했습니다. 다시 시도해주세요.'): string {
  if (e instanceof ApiError) return e.message || fallback;
  if (e instanceof TypeError) return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  return fallback;
}

interface CsrfToken {
  headerName: string;
  token: string;
}

let csrfCache: CsrfToken | null = null;
let csrfInflight: Promise<CsrfToken> | null = null;

export function invalidateCsrf(): void {
  csrfCache = null;
}

async function fetchCsrf(): Promise<CsrfToken> {
  if (csrfCache) return csrfCache;
  if (!csrfInflight) {
    csrfInflight = fetch(`${API}/auth/csrf`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new ApiError(res.status, 'CSRF_FETCH_FAILED', 'CSRF 토큰 발급에 실패했습니다.');
        const data = (await res.json()) as CsrfToken;
        csrfCache = data;
        return data;
      })
      .finally(() => {
        csrfInflight = null;
      });
  }
  return csrfInflight;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  formData?: FormData;
  query?: Record<string, string | number | boolean | undefined>;
}

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function toApiError(res: Response, body: unknown): ApiError {
  if (body && typeof body === 'object' && 'code' in body && 'message' in body) {
    const b = body as { code: string; message: string };
    return new ApiError(res.status, b.code, b.message);
  }
  return new ApiError(res.status, `HTTP_${res.status}`, `서버 오류가 발생했습니다 (${res.status})`);
}

async function doRequest<T>(method: Method, path: string, opts: RequestOptions, retried: boolean): Promise<T> {
  const mutating = method !== 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (mutating) {
    const csrf = await fetchCsrf();
    headers[csrf.headerName] = csrf.token;
  }

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let url = `${API}${path}`;
  if (opts.query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined) qs.set(k, String(v));
    }
    const q = qs.toString();
    if (q) url += `?${q}`;
  }

  const res = await fetch(url, { method, headers, body, credentials: 'include' });
  const data = await parseBody(res);

  if (res.ok) return data as T;

  const err = toApiError(res, data);

  if (err.status === 403 && err.code === 'CSRF_INVALID' && !retried) {
    invalidateCsrf();
    return doRequest<T>(method, path, opts, true);
  }

  if (err.status === 401 && (err.code === 'UNAUTHENTICATED' || err.code === 'SESSION_EXPIRED')) {
    invalidateCsrf();
    window.dispatchEvent(new CustomEvent(UNAUTHENTICATED_EVENT));
  }

  throw err;
}

export const http = {
  get: <T>(path: string, query?: RequestOptions['query']) => doRequest<T>('GET', path, { query }, false),
  post: <T>(path: string, body?: unknown) => doRequest<T>('POST', path, { body }, false),
  postForm: <T>(path: string, formData: FormData) => doRequest<T>('POST', path, { formData }, false),
  put: <T>(path: string, body?: unknown) => doRequest<T>('PUT', path, { body }, false),
  patch: <T>(path: string, body?: unknown) => doRequest<T>('PATCH', path, { body }, false),
  del: <T = void>(path: string, body?: unknown) => doRequest<T>('DELETE', path, { body }, false),
};

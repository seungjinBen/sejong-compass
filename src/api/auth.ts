import { http, invalidateCsrf } from './http';
import type { BackendProfile, LoginInput } from './backend';

/** 세션 로그인. 성공 시 세션·CSRF 토큰이 갱신되므로 캐시를 비운다. */
export async function login(input: LoginInput): Promise<BackendProfile> {
  const profile = await http.post<BackendProfile>('/auth/login', input);
  invalidateCsrf();
  return profile;
}

export async function logout(): Promise<void> {
  try {
    await http.post<void>('/auth/logout');
  } finally {
    invalidateCsrf();
  }
}

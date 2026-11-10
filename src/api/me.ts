import { http, isApiError } from './http';
import type {
  BackendProfile, ProfilePatch, MajorsBody, CertificationsBody,
  ProjectInput, InternshipInput, AwardInput, StepChange,
  Course, CourseInput, TranscriptPreview, WholeImportResult, ReadmeView,
} from './backend';
import type {
  TargetCondition, OnboardingView, MajorSelection, ProjectItem, InternshipItem, AwardItem,
} from '@/types';

// ---- 프로필 ----

export function getMe(): Promise<BackendProfile> {
  return http.get<BackendProfile>('/me');
}

export function patchMe(patch: ProfilePatch): Promise<BackendProfile> {
  return http.patch<BackendProfile>('/me', patch);
}

// ---- 전공 ----

export async function getMajors(): Promise<MajorSelection[]> {
  const res = await http.get<MajorsBody>('/me/majors');
  return res.majors;
}

export async function putMajors(majors: MajorSelection[]): Promise<MajorSelection[]> {
  const res = await http.put<MajorsBody>('/me/majors', { majors });
  return res.majors;
}

// ---- 취업 목표 ----

/** 미등록이면(404 ITEM_NOT_FOUND) null */
export async function getCareerGoal(): Promise<TargetCondition | null> {
  try {
    return await http.get<TargetCondition>('/me/career-goal');
  } catch (e) {
    if (isApiError(e, 'ITEM_NOT_FOUND')) return null;
    throw e;
  }
}

export function putCareerGoal(goal: TargetCondition): Promise<TargetCondition> {
  return http.put<TargetCondition>('/me/career-goal', goal);
}

// ---- 온보딩 ----

export function getOnboarding(): Promise<OnboardingView> {
  return http.get<OnboardingView>('/me/onboarding');
}

export function patchOnboarding(steps: StepChange[]): Promise<OnboardingView> {
  return http.patch<OnboardingView>('/me/onboarding', { steps });
}

// ---- 자격증 ----

export async function getCertifications(): Promise<string[]> {
  const res = await http.get<CertificationsBody>('/me/certifications');
  return res.certificationCodes;
}

export async function putCertifications(codes: string[]): Promise<string[]> {
  const res = await http.put<CertificationsBody>('/me/certifications', { certificationCodes: codes });
  return res.certificationCodes;
}

// ---- 프로젝트 ----

export const projects = {
  list: () => http.get<ProjectItem[]>('/me/projects'),
  create: (input: ProjectInput) => http.post<ProjectItem>('/me/projects', input),
  update: (id: number, input: ProjectInput) => http.put<ProjectItem>(`/me/projects/${id}`, input),
  remove: (id: number) => http.del(`/me/projects/${id}`),
  readme: (id: number) => http.get<ReadmeView>(`/me/projects/${id}/readme`),
  collectReadme: (id: number) => http.post<ReadmeView>(`/me/projects/${id}/readme/collect`),
};

// ---- 인턴 ----

export const internships = {
  list: () => http.get<InternshipItem[]>('/me/internships'),
  create: (input: InternshipInput) => http.post<InternshipItem>('/me/internships', input),
  update: (id: number, input: InternshipInput) => http.put<InternshipItem>(`/me/internships/${id}`, input),
  remove: (id: number) => http.del(`/me/internships/${id}`),
};

// ---- 수상 ----

export const awards = {
  list: () => http.get<AwardItem[]>('/me/awards'),
  create: (input: AwardInput) => http.post<AwardItem>('/me/awards', input),
  update: (id: number, input: AwardInput) => http.put<AwardItem>(`/me/awards/${id}`, input),
  remove: (id: number) => http.del(`/me/awards/${id}`),
};

// ---- 수강 과목 / 성적표 ----

export const courses = {
  list: () => http.get<Course[]>('/me/courses'),
  create: (input: CourseInput) => http.post<Course>('/me/courses', input),
  remove: (id: number) => http.del(`/me/courses/${id}`),
};

/** XLSX 성적표 미리보기 (세션당 1개, 15분 보관) */
export function previewTranscript(file: File): Promise<TranscriptPreview> {
  const fd = new FormData();
  fd.append('file', file);
  return http.postForm<TranscriptPreview>('/me/courses/import/preview', fd);
}

/** 미리보기의 정상 과목 전체 저장 */
export function confirmAllTranscript(previewId: string): Promise<WholeImportResult> {
  return http.post<WholeImportResult>('/me/courses/import/confirm-all', { previewId });
}

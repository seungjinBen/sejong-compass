/** Compass API 요청/응답 DTO (스웨거 기준) */
import type {
  MajorSelection, ProjectItem, InternshipItem, AwardItem, OnboardingStep, OnboardingStepStatus,
} from '@/types';

export interface BackendProfile {
  id: number;
  schoolEmail: string;
  name: string;
  isTransfer: boolean;
  emailVerified: boolean;
  semester: number | null;
  gpa: number | null;
  gpaScale: number | null;
}

export interface ProfilePatch {
  name?: string;
  isTransfer?: boolean;
  semester?: number;
  gpa?: number;
  gpaScale?: number;
}

export interface LoginInput {
  schoolEmail: string;
  password: string;
}

export interface MajorsBody {
  majors: MajorSelection[];
}

export interface CertificationsBody {
  certificationCodes: string[];
}

export type ProjectInput = Omit<ProjectItem, 'id'>;
export type InternshipInput = Omit<InternshipItem, 'id'>;
export type AwardInput = Omit<AwardItem, 'id'>;

export interface StepChange {
  step: OnboardingStep;
  status: OnboardingStepStatus;
}

export interface Code {
  code: string;
  name: string;
}

export interface RegionGroup {
  name: string;
  regions: Code[];
}

export type StudentCodeType =
  | 'majors'
  | 'major-completion-types'
  | 'certifications'
  | 'tech-stacks'
  | 'job-categories'
  | 'regions'
  | 'employment-types'
  | 'salary-units';

// ---- 수강 과목 / 성적표 ----

export interface CourseInput {
  courseNumber: string;
  courseName: string;
  academicYear: number;
  semester: string;
  evaluationMethod: string;
  grade: string;
  gradePoint?: number | null;
}

export interface Course extends CourseInput {
  id: number;
}

export interface Issue {
  code: string;
  message: string;
}

export interface PreviewRow {
  sheetIndex: number;
  sheetName: string;
  sourceRow: number;
  raw: Record<string, unknown>;
  course: CourseInput | null;
  errors: Issue[];
  warnings: Issue[];
  existingCourseIds: number[];
}

export interface RowIssue {
  sheetName: string;
  sourceRow: number;
  issues: Issue[];
}

export interface TranscriptPreview {
  previewId: string;
  expiresAt: string;
  rows: PreviewRow[];
  warnings: Issue[];
  gpa: number | null;
  completedSemesters: number | null;
  wholeImport: { ready: number; skipped: number; rowIssues: RowIssue[] };
}

export interface WholeImportResult {
  inserted: number;
  skipped: number;
  rowIssues: RowIssue[];
  savedGpa: number | null;
  savedCompletedSemesters: number | null;
}

// ---- GitHub README ----

export interface ReadmeView {
  projectId: number;
  repositoryUrl: string;
  readmePath: string | null;
  readmeSha: string | null;
  content: string | null;
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastAttemptStatus: 'SUCCESS' | 'NOT_FOUND' | 'RATE_LIMITED' | 'FAILED' | null;
  lastErrorCode: string | null;
}

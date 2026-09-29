import { z } from 'zod';
import type { JobField, CompanySize } from '@/types';

export const studentInfoSchema = z.object({
  name: z.string().min(1),
  department: z.string().min(1),
  doubleMajor: z.string().optional(),
  minor: z.string().optional(),
  gradeYear: z.coerce.number().min(1).max(4),
  semester: z.coerce.number().min(1).max(8),
  gpa: z.coerce.number().min(0),
  gpaScale: z.coerce.number().min(0),
});

export type StudentInfoForm = z.infer<typeof studentInfoSchema>;

export const targetSchema = z.object({
  jobField: z.enum(['BACKEND', 'FRONTEND', 'DATA', 'AI', 'CLOUD', 'SECURITY'] as const),
  companySize: z.enum(['LARGE', 'MID', 'STARTUP'] as const),
  targetSalary: z.number(),
  regions: z.array(z.string()).min(1),
  careerType: z.enum(['NEW', 'EXPERIENCED'] as const),
  targetCompany: z.string().min(1),
  targetRole: z.string().min(1),
  targetDate: z.string(),
});

export type TargetForm = z.infer<typeof targetSchema>;

export const JOB_FIELDS: { value: JobField; label: string }[] = [
  { value: 'BACKEND', label: '백엔드' },
  { value: 'FRONTEND', label: '프론트엔드' },
  { value: 'DATA', label: '데이터' },
  { value: 'AI', label: 'AI/ML' },
  { value: 'CLOUD', label: '클라우드' },
  { value: 'SECURITY', label: '보안' },
];

export const DEPARTMENTS = [
  '컴퓨터공학과', '소프트웨어학과', '정보보호학과', '데이터사이언스학과',
  '전자공학과', '기계공학과', '경영학과', '기타',
];

export const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '제주'];

export const TARGET_DATES = ['2026-1H', '2026-2H', '2027-1H', '2027-2H', '2028-1H', '2028-2H'];

export const COMPANY_SIZES: [CompanySize, string][] = [
  ['LARGE', '대기업'],
  ['MID', '중견기업'],
  ['STARTUP', '스타트업'],
];

import { z } from 'zod';
import type { CompanySize } from '@/types';

/** 이수 구분 코드 (GET /student-codes/major-completion-types) */
export const COMPLETION_TYPE = {
  PRIMARY: 'PRIMARY',
  DOUBLE: 'DOUBLE',
  MINOR: 'MINOR',
} as const;

export const studentInfoSchema = z
  .object({
    name: z.string().trim().min(1, '이름을 입력하세요').max(100),
    isTransfer: z.boolean(),
    semester: z.coerce.number().int().min(0, '0 이상이어야 합니다').max(20),
    gpa: z.coerce.number().min(0, '0 이상이어야 합니다'),
    gpaScale: z.coerce.number().gt(0, '0보다 커야 합니다').max(4.5, '4.5 이하여야 합니다'),
    primaryMajorCode: z.string().min(1, '주전공을 선택하세요'),
    doubleMajorCode: z.string().optional(),
    minorMajorCode: z.string().optional(),
  })
  .refine((v) => v.gpa <= v.gpaScale, { message: '학점은 만점 이하여야 합니다', path: ['gpa'] });

export type StudentInfoForm = z.infer<typeof studentInfoSchema>;

export const COMPANY_SIZE_VALUES = ['LARGE', 'MID', 'SMALL', 'STARTUP'] as const;

export const targetSchema = z.object({
  jobCategoryCode: z.string().min(1, '희망 직무를 선택하세요'),
  companySizes: z.array(z.enum(COMPANY_SIZE_VALUES)).min(1, '기업 규모를 선택하세요').max(4),
  targetSalary: z.number().min(0),
  regionCodes: z.array(z.string()).min(1, '지역을 선택하세요').max(100),
  targetCompany: z.string().trim().min(1, '기업명을 입력하세요').max(255),
  targetDate: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, '목표 시기를 선택하세요'),
});

export type TargetForm = z.infer<typeof targetSchema>;

export const COMPANY_SIZES: [CompanySize, string][] = [
  ['LARGE', '대기업'],
  ['MID', '중견기업'],
  ['SMALL', '중소기업'],
  ['STARTUP', '스타트업'],
];

/** 오늘로부터 n개월 뒤를 YYYY-MM 으로 */
export function monthsFromNow(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function currentMonth(): string {
  return monthsFromNow(0);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

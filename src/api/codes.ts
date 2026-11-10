import { http } from './http';
import type { Code, RegionGroup, StudentCodeType } from './backend';

/** 로그인 없이 조회 가능한 학생 입력용 코드표 */
export function getStudentCodes(type: StudentCodeType): Promise<Code[]> {
  return http.get<Code[]>(`/student-codes/${type}`);
}

/** 지역을 시·도 / 전국 / 해외 그룹으로 조회 */
export function getRegionGroups(): Promise<RegionGroup[]> {
  return http.get<RegionGroup[]>('/student-codes/regions/grouped');
}

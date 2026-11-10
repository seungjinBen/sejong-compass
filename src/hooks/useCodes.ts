import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStudentCodes, getRegionGroups } from '@/api/codes';
import type { Code, RegionGroup, StudentCodeType } from '@/api/backend';

const CODE_STALE = Infinity;

/** 학생 입력용 코드표 (전공·직무·지역·자격증·기술스택 등). 변경이 드물어 세션 동안 캐싱 */
export function useStudentCodes(type: StudentCodeType) {
  return useQuery<Code[]>({
    queryKey: ['student-codes', type],
    queryFn: () => getStudentCodes(type),
    staleTime: CODE_STALE,
  });
}

export function useRegionGroups() {
  return useQuery<RegionGroup[]>({
    queryKey: ['student-codes', 'regions', 'grouped'],
    queryFn: getRegionGroups,
    staleTime: CODE_STALE,
  });
}

/** code → name 조회 함수. 로딩 전이면 code 를 그대로 반환 */
export function useCodeName(type: StudentCodeType): (code: string | null | undefined) => string {
  const { data } = useStudentCodes(type);
  return useMemo(() => {
    const map = new Map((data ?? []).map((c) => [c.code, c.name]));
    return (code) => (code ? (map.get(code) ?? code) : '');
  }, [data]);
}

/** 이름 기준 가나다/알파벳 정렬 */
export function sortCodes(codes: Code[] | undefined): Code[] {
  return [...(codes ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { saveTarget, saveProfile } from '@/api';
import { useUserStore } from '@/store';
import type { JobField, TargetCondition } from '@/types';

const JOB_OPTIONS: {
  field: JobField;
  label: string;
  matchRate: number;
  skills: string[];
  preview: string[];
}[] = [
  {
    field: 'BACKEND',
    label: '백엔드 개발자',
    matchRate: 42,
    skills: ['Java', 'Spring Boot', 'SQL', 'Git', 'Docker'],
    preview: [
      '2학년: 데이터구조, 알고리즘 수강',
      '3학년: 데이터베이스, 웹서버 프로그래밍',
      '방학: SQLD 자격증 취득',
    ],
  },
  {
    field: 'FRONTEND',
    label: '프론트엔드 개발자',
    matchRate: 38,
    skills: ['JavaScript', 'TypeScript', 'React', 'CSS', 'Git'],
    preview: [
      '2학년: 웹프로그래밍, UI/UX 기초',
      '3학년: 프론트엔드 프레임워크 심화',
      '방학: 포트폴리오 제작',
    ],
  },
  {
    field: 'DATA',
    label: '데이터 분석가',
    matchRate: 45,
    skills: ['Python', 'SQL', 'Pandas', '통계', 'Tableau'],
    preview: [
      '2학년: 통계학, 파이썬 프로그래밍',
      '3학년: 데이터베이스, 머신러닝 기초',
      '방학: 데이터 분석 프로젝트',
    ],
  },
];

export function ExplorePage() {
  const navigate = useNavigate();
  const { profile, setTarget } = useUserStore();
  const [loading, setLoading] = useState<JobField | null>(null);

  async function handleSelect(field: JobField) {
    setLoading(field);
    const target: TargetCondition = {
      companySize: 'LARGE',
      targetSalary: 4500,
      regions: ['서울'],
      careerType: 'NEW',
      targetCompany: '',
      targetRole:
        field === 'BACKEND'
          ? '백엔드 개발자'
          : field === 'FRONTEND'
          ? '프론트엔드 개발자'
          : '데이터 분석가',
      targetDate: '2028-1H',
    };
    await saveTarget(target);
    setTarget(target);
    if (profile) {
      const updated = await saveProfile({ ...profile, jobField: field, onboardingCompleted: true });
      useUserStore.getState().setProfile(updated);
    }
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-ink mb-2">어떤 직무에 관심이 있나요?</h1>
          <p className="text-gray-500 text-sm">
            전공과 학년을 기반으로 추천 직무를 선택하면 맞춤 로드맵이 만들어집니다.
          </p>
        </div>
        <div className="grid gap-4">
          {JOB_OPTIONS.map(opt => (
            <button
              key={opt.field}
              onClick={() => handleSelect(opt.field)}
              disabled={loading !== null}
              className="text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-primary p-5 transition-all disabled:opacity-50 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-base font-bold text-ink group-hover:text-primary">{opt.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5">현재 예상 매칭률</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary tabular-nums">{opt.matchRate}</span>
                  <span className="text-lg font-bold text-primary">%</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {opt.skills.map(skill => (
                  <span key={skill} className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="space-y-1">
                {opt.preview.map((step, i) => (
                  <p key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                    {step}
                  </p>
                ))}
              </div>
              {loading === opt.field && (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  로드맵 생성 중...
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

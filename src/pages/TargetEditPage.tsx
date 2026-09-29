import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/common/Card';
import { useUserStore, useRoadmapStore } from '@/store';
import { saveProfile, saveTarget, generateRoadmap, getGapAnalysis } from '@/api';
import { defaultJobs } from '@/mocks/data/jobs';
import {
  targetSchema, JOB_FIELDS, REGIONS, TARGET_DATES, COMPANY_SIZES, type TargetForm,
} from '@/lib/profileOptions';
import { GeneratingScreen } from '@/pages/OnboardingPage';

export function TargetEditPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const target = useUserStore((s) => s.target);
  const setProfile = useUserStore((s) => s.setProfile);
  const setTarget = useUserStore((s) => s.setTarget);
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const setBaseMatchRate = useRoadmapStore((s) => s.setBaseMatchRate);
  const setQualitativeInsights = useRoadmapStore((s) => s.setQualitativeInsights);

  const [regenerating, setRegenerating] = useState(false);

  const form = useForm<TargetForm>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      jobField: profile?.jobField ?? 'BACKEND',
      companySize: target?.companySize ?? 'LARGE',
      targetSalary: target?.targetSalary ?? 5000,
      regions: target?.regions ?? ['서울'],
      careerType: target?.careerType ?? 'NEW',
      targetCompany: target?.targetCompany ?? '',
      targetRole: target?.targetRole ?? '',
      targetDate: target?.targetDate ?? '2027-2H',
    },
  });

  const salary = form.watch('targetSalary');
  const selectedRegions = form.watch('regions');
  const watchedJobField = form.watch('jobField');
  const suggestedJobs = defaultJobs.filter((j) => j.jobField === watchedJobField).slice(0, 5);

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
  const errClass = 'text-xs text-danger mt-0.5';

  if (!profile) return null;

  async function onSubmit(data: TargetForm) {
    if (!profile) return;
    setRegenerating(true);

    const { jobField, ...targetData } = data;

    await saveProfile({ jobField });
    await saveTarget(targetData);

    const [roadmap, gap] = await Promise.all([generateRoadmap(), getGapAnalysis()]);

    setProfile({ ...profile, jobField });
    setTarget(targetData);
    setRoadmap(roadmap);
    setBaseMatchRate(gap.matchRate);
    setQualitativeInsights(gap.qualitativeInsights);
  }

  function handleGeneratingDone() {
    navigate('/dashboard');
  }

  if (regenerating) return <GeneratingScreen onDone={handleGeneratingDone} />;

  return (
    <PageShell title="희망 직무 변경">
      <Card className="max-w-2xl">
        <form onSubmit={form.handleSubmit((data) => void onSubmit(data))} className="space-y-4">
          <div>
            <label className={labelClass}>희망 직무 *</label>
            <div className="flex flex-wrap gap-2">
              <Controller
                control={form.control}
                name="jobField"
                render={({ field }) => (
                  <>
                    {JOB_FIELDS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          field.value === value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </>
                )}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>기업 규모</label>
            <div className="flex gap-3">
              {COMPANY_SIZES.map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...form.register('companySize')}
                    type="radio"
                    value={val}
                    className="accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              목표 연봉:{' '}
              <span className="text-primary font-semibold">{salary.toLocaleString()}만원</span>
            </label>
            <input
              type="range"
              min={3000}
              max={8000}
              step={100}
              {...form.register('targetSalary', { valueAsNumber: true })}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>3,000만원</span>
              <span>8,000만원</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>선호 지역 (복수 선택)</label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <label key={r} className="cursor-pointer">
                  <input
                    type="checkbox"
                    value={r}
                    checked={selectedRegions.includes(r)}
                    onChange={(e) => {
                      const cur = selectedRegions;
                      form.setValue(
                        'regions',
                        e.target.checked ? [...cur, r] : cur.filter((v) => v !== r),
                      );
                    }}
                    className="hidden"
                  />
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      selectedRegions.includes(r)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {r}
                  </span>
                </label>
              ))}
            </div>
            {form.formState.errors.regions && <p className={errClass}>지역을 선택하세요</p>}
          </div>

          <div>
            <label className={labelClass}>경력 구분</label>
            <div className="flex gap-4">
              {(['NEW', 'EXPERIENCED'] as const).map((val) => (
                <label key={val} className="flex items-center gap-2 cursor-pointer">
                  <input
                    {...form.register('careerType')}
                    type="radio"
                    value={val}
                    className="accent-primary"
                  />
                  <span className="text-sm">{val === 'NEW' ? '신입' : '경력'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>목표 기업명 *</label>
              <input {...form.register('targetCompany')} className={inputClass} placeholder="네이버" />
              {form.formState.errors.targetCompany && (
                <p className={errClass}>기업명을 입력하세요</p>
              )}
            </div>
            <div>
              <label className={labelClass}>목표 직무 *</label>
              <input {...form.register('targetRole')} className={inputClass} placeholder="백엔드 개발자" />
              {form.formState.errors.targetRole && <p className={errClass}>직무를 입력하세요</p>}
            </div>
          </div>

          {suggestedJobs.length > 0 && (
            <div>
              <p className="text-[11px] text-gray-400 mb-1.5">
                실제 공고에서 선택하면 자동으로 채워져요
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => {
                      form.setValue('targetCompany', job.company);
                      form.setValue('targetRole', job.title);
                    }}
                    className="text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-light transition-colors max-w-[200px]"
                  >
                    <p className="text-xs font-semibold text-ink">{job.company}</p>
                    <p className="text-[11px] text-gray-500 truncate">{job.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>목표 시기</label>
            <select {...form.register('targetDate')} className={inputClass}>
              {TARGET_DATES.map((d) => (
                <option key={d} value={d}>{d.replace('-', ' ')}</option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-gray-400">
            직무를 바꾸면 매칭률·갭분석·로드맵이 모두 새로 계산돼요.
          </p>

          <button
            type="submit"
            className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            커리어 로드맵 새로 생성
          </button>
        </form>
      </Card>
    </PageShell>
  );
}

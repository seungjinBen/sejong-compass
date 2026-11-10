import { useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUserStore, useUIStore } from '@/store';
import { putCareerGoal, patchOnboarding } from '@/api/me';
import { errorMessage } from '@/api/http';
import { useStudentCodes, useRegionGroups, sortCodes } from '@/hooks/useCodes';
import { defaultJobs } from '@/mocks/data/jobs';
import { targetSchema, COMPANY_SIZES, monthsFromNow, currentMonth, type TargetForm } from '@/lib/profileOptions';
import type { TargetCondition } from '@/types';

interface Props {
  submitLabel: string;
  onSaved: (target: TargetCondition) => void;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errClass = 'text-xs text-danger mt-0.5';

/**
 * 취업 목표 폼. PUT /me/career-goal → PATCH /me/onboarding(PREFERENCES)
 */
export function CareerGoalForm({ submitLabel, onSaved }: Props) {
  const target = useUserStore((s) => s.target);
  const setTarget = useUserStore((s) => s.setTarget);
  const setOnboarding = useUserStore((s) => s.setOnboarding);
  const showToast = useUIStore((s) => s.showToast);

  const jobsQuery = useStudentCodes('job-categories');
  const jobOptions = sortCodes(jobsQuery.data);
  const regionsQuery = useRegionGroups();

  // 그룹(시·도)당 대표 코드("서울전체" 등) 하나를 칩으로 제공
  const regionChips = useMemo(
    () =>
      (regionsQuery.data ?? [])
        .map((g) => ({ label: g.name, code: g.regions[0]?.code }))
        .filter((c): c is { label: string; code: string } => !!c.code),
    [regionsQuery.data],
  );

  const companySuggestions = useMemo(
    () => [...new Set(defaultJobs.map((j) => j.company))].slice(0, 6),
    [],
  );

  const [saving, setSaving] = useState(false);

  const form = useForm<TargetForm>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      jobCategoryCode: target?.jobCategoryCode ?? '',
      companySizes: target?.companySizes ?? ['LARGE'],
      targetSalary: target?.targetSalary ?? 5000,
      regionCodes: target?.regionCodes ?? [],
      targetCompany: target?.targetCompany ?? '',
      targetDate: target?.targetDate ?? monthsFromNow(18),
    },
  });

  const salary = form.watch('targetSalary');
  const selectedRegions = form.watch('regionCodes');
  const selectedSizes = form.watch('companySizes');

  async function onSubmit(values: TargetForm) {
    setSaving(true);
    try {
      const saved = await putCareerGoal(values);
      const view = await patchOnboarding([{ step: 'PREFERENCES', status: 'COMPLETED' }]);
      setTarget(saved);
      setOnboarding(view);
      onSaved(saved);
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit((v) => void onSubmit(v))} className="space-y-4">
      <div>
        <label className={labelClass}>희망 직무 *</label>
        <select {...form.register('jobCategoryCode')} className={inputClass} disabled={jobsQuery.isLoading}>
          <option value="">{jobsQuery.isLoading ? '불러오는 중...' : '선택하세요'}</option>
          {jobOptions.map((j) => (
            <option key={j.code} value={j.code}>{j.name}</option>
          ))}
        </select>
        {form.formState.errors.jobCategoryCode && <p className={errClass}>{form.formState.errors.jobCategoryCode.message}</p>}
      </div>

      <div>
        <label className={labelClass}>기업 규모 (복수 선택)</label>
        <Controller
          control={form.control}
          name="companySizes"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {COMPANY_SIZES.map(([val, label]) => {
                const on = selectedSizes.includes(val);
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() =>
                      field.onChange(on ? field.value.filter((v) => v !== val) : [...field.value, val])
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      on ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        />
        {form.formState.errors.companySizes && <p className={errClass}>{form.formState.errors.companySizes.message}</p>}
      </div>

      <div>
        <label className={labelClass}>
          목표 연봉: <span className="text-primary font-semibold">{salary.toLocaleString()}만원</span>
        </label>
        <input
          type="range"
          min={2000}
          max={10000}
          step={100}
          {...form.register('targetSalary', { valueAsNumber: true })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>2,000만원</span>
          <span>1억원</span>
        </div>
      </div>

      <div>
        <label className={labelClass}>선호 지역 (복수 선택)</label>
        <Controller
          control={form.control}
          name="regionCodes"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {regionsQuery.isLoading && <span className="text-xs text-gray-400">불러오는 중...</span>}
              {regionChips.map((r) => {
                const on = selectedRegions.includes(r.code);
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() =>
                      field.onChange(on ? field.value.filter((v) => v !== r.code) : [...field.value, r.code])
                    }
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      on ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          )}
        />
        {form.formState.errors.regionCodes && <p className={errClass}>{form.formState.errors.regionCodes.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>목표 기업명 *</label>
          <input {...form.register('targetCompany')} className={inputClass} placeholder="네이버" />
          {form.formState.errors.targetCompany && <p className={errClass}>{form.formState.errors.targetCompany.message}</p>}
        </div>
        <div>
          <label className={labelClass}>목표 시기 *</label>
          <input {...form.register('targetDate')} type="month" min={currentMonth()} className={inputClass} />
          {form.formState.errors.targetDate && <p className={errClass}>{form.formState.errors.targetDate.message}</p>}
        </div>
      </div>

      <div>
        <p className="text-[11px] text-gray-400 mb-1.5">공고가 많은 기업을 빠르게 선택할 수 있어요</p>
        <div className="flex flex-wrap gap-2">
          {companySuggestions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => form.setValue('targetCompany', c, { shouldValidate: true })}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary-light transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
      >
        {saving ? '저장 중...' : submitLabel}
      </button>
    </form>
  );
}

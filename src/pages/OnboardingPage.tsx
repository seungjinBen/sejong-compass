import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload, Compass,
  Check, Trash2, Edit2, FileSpreadsheet, Sparkles,
} from 'lucide-react';
import { useUserStore, useRoadmapStore, useUIStore } from '@/store';
import {
  saveProfile, saveTarget, parseTranscript,
  generateRoadmap, getGapAnalysis, checkStudentIdAvailable,
} from '@/api';
import { EvidenceTooltip } from '@/components/common/EvidenceTooltip';
import { defaultJobs } from '@/mocks/data/jobs';
import {
  studentInfoSchema, targetSchema,
  JOB_FIELDS, DEPARTMENTS, REGIONS, TARGET_DATES, COMPANY_SIZES,
} from '@/lib/profileOptions';
import type { ParsedCourse, Skill } from '@/types';

// ---- Schemas ----
const step1Schema = studentInfoSchema.extend({
  studentId: z
    .string()
    .regex(/^\d{8}$/, '학번은 8자리 숫자입니다')
    .refine(async (v) => checkStudentIdAvailable(v), { message: '이미 등록된 학번입니다' }),
});

const step2Schema = targetSchema;

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;

// ---- Sub-components ----

// Transcript confirmation table
function TranscriptTable({
  courses,
  onConfirm,
}: {
  courses: ParsedCourse[];
  onConfirm: (confirmed: ParsedCourse[]) => void;
}) {
  const [rows, setRows] = useState(courses);
  const [editing, setEditing] = useState<{
    idx: number;
    field: 'name' | 'grade' | 'semester';
  } | null>(null);

  function update(idx: number, field: 'name' | 'grade' | 'semester', val: string) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  }

  return (
    <div className="mt-3">
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">과목명</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">학점</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">학기</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-600">매핑 스킬</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {(['name', 'grade', 'semester'] as const).map((field) => (
                  <td key={field} className="px-3 py-2">
                    {editing?.idx === idx && editing.field === field ? (
                      <input
                        autoFocus
                        defaultValue={row[field]}
                        className="border border-primary rounded px-1 py-0.5 text-xs w-full outline-none"
                        onBlur={(e) => {
                          update(idx, field, e.target.value);
                          setEditing(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            update(idx, field, e.currentTarget.value);
                            setEditing(null);
                          }
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEditing({ idx, field })}
                        className="flex items-center gap-1 text-left hover:text-primary group"
                      >
                        {row[field]}
                        <Edit2
                          size={10}
                          className="opacity-0 group-hover:opacity-100 text-gray-400"
                        />
                      </button>
                    )}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(row.mappedSkills ?? []).map((s) => (
                      <span
                        key={s.id}
                        className="bg-primary-light text-primary px-1.5 py-0.5 rounded text-[10px]"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-2">
                  <button
                    type="button"
                    onClick={() => setRows((r) => r.filter((_, i) => i !== idx))}
                    className="text-gray-300 hover:text-danger"
                  >
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={() => onConfirm(rows)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark"
        >
          <Check size={13} /> 확인 — 스킬에 반영
        </button>
      </div>
    </div>
  );
}

// Loading screen
const LOAD_STEPS = ['스펙 분석 중', '공고 208건 대조 중', '갭 산출 중', '로드맵 생성 중'];

export function GeneratingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      for (let i = 0; i < LOAD_STEPS.length; i++) {
        if (cancelled) return;
        setStep(i);
        await new Promise<void>((r) => setTimeout(r, 600));
      }
      if (!cancelled) onDone();
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [onDone]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-sm w-full px-6">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">맞춤 로드맵 생성 중</h2>
        <p className="text-sm text-gray-500 mb-8">잠시만 기다려 주세요...</p>
        <div className="space-y-3">
          {LOAD_STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                i === step
                  ? 'border-primary bg-primary-light'
                  : i < step
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-100 bg-white'
              }`}
            >
              {i < step ? (
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center shrink-0">
                  <Check size={12} className="text-white" />
                </div>
              ) : i === step ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  i === step
                    ? 'text-primary font-semibold'
                    : i < step
                    ? 'text-success'
                    : 'text-gray-400'
                }`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Main component ----
export function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillStudentId = (location.state as { studentId?: string } | null)?.studentId ?? '';
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);
  const setTarget = useUserStore((s) => s.setTarget);
  const setRoadmap = useRoadmapStore((s) => s.setRoadmap);
  const setBaseMatchRate = useRoadmapStore((s) => s.setBaseMatchRate);
  const showToast = useUIStore((s) => s.showToast);

  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  // Transcript state
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[] | null>(null);
  const [confirmedSkills, setConfirmedSkills] = useState<Skill[]>([]);

  // Collected data across steps
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);

  const step1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      studentId: prefillStudentId,
      gradeYear: 3,
      semester: 6,
      gpa: 0,
      gpaScale: 4.5,
    },
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      jobField: 'BACKEND',
      companySize: 'LARGE',
      targetSalary: 5000,
      regions: ['서울'],
      careerType: 'NEW',
      targetCompany: '',
      targetRole: '',
      targetDate: '2027-2H',
    },
  });

  const salary = step2Form.watch('targetSalary');
  const selectedRegions = step2Form.watch('regions');
  const watchedJobField = step2Form.watch('jobField');
  const suggestedJobs = defaultJobs.filter((j) => j.jobField === watchedJobField).slice(0, 5);

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
  const errClass = 'text-xs text-danger mt-0.5';

  // Redirect if already onboarded
  if (profile?.onboardingCompleted) return <Navigate to="/dashboard" replace />;

  async function handleTranscriptUpload() {
    setTranscriptLoading(true);
    try {
      const file = new File(['mock'], 'transcript.xlsx', {
        type: 'application/vnd.ms-excel',
      });
      const result = await parseTranscript(file);
      setParsedCourses(result.courses);
    } catch {
      showToast('성적표 불러오기 실패. 다시 시도해주세요.');
    } finally {
      setTranscriptLoading(false);
    }
  }

  function handleTranscriptConfirm(confirmed: ParsedCourse[]) {
    const skills = confirmed.flatMap((c) => c.mappedSkills ?? []);
    setConfirmedSkills(skills);
    setParsedCourses(null);
    showToast('성적표 확인 완료 — 스킬에 반영되었습니다');
  }

  function onStep1Next(data: Step1Form) {
    setStep1Data(data);
    setCurrentStep(2);
  }

  async function onStep2Submit(data: Step2Form) {
    if (!step1Data) return;
    setGenerating(true);

    const { jobField: _jobField, ...targetData } = data;

    const profileData = {
      id: `user-${step1Data.studentId}`,
      studentId: step1Data.studentId,
      name: step1Data.name,
      department: step1Data.department,
      doubleMajor: step1Data.doubleMajor || undefined,
      minor: step1Data.minor || undefined,
      gradeYear: step1Data.gradeYear as 1 | 2 | 3 | 4,
      semester: step1Data.semester,
      jobField: data.jobField,
      gpa: step1Data.gpa,
      gpaScale: step1Data.gpaScale,
      language: null,
      certifications: [],
      awards: [],
      internships: [],
      projects: [],
      githubUrl: undefined,
      skills: confirmedSkills,
      onboardingCompleted: true,
    };

    await saveProfile(profileData);
    await saveTarget(targetData);

    const [roadmap, gap] = await Promise.all([generateRoadmap(), getGapAnalysis()]);

    setProfile(profileData);
    setTarget(targetData);
    setRoadmap(roadmap);
    setBaseMatchRate(gap.matchRate);
  }

  function handleGeneratingDone() {
    navigate('/dashboard');
  }

  if (generating) return <GeneratingScreen onDone={handleGeneratingDone} />;

  const STEPS = ['학생 정보', '목표 설정'];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Compass size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-ink">Sejong Compass</span>
          </div>
          <p className="text-xs text-gray-500">세종대학교 맞춤형 커리어 &amp; 취업 가이드</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-start justify-center mb-4">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const active = s === currentStep;
            const done = s < currentStep;
            return (
              <div key={s} className="flex items-start">
                <div className="flex flex-col items-center gap-1.5 w-24">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      done
                        ? 'bg-success text-white'
                        : active
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {done ? <Check size={14} /> : s}
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap ${
                      active ? 'text-ink font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {s < STEPS.length && (
                  <div
                    className={`w-10 sm:w-16 h-0.5 mt-4 ${done ? 'bg-success' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* ===== STEP 1 ===== */}
          {currentStep === 1 && (
            <form onSubmit={step1.handleSubmit(onStep1Next)} className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-ink">학생 정보</h2>
                <button
                  type="button"
                  onClick={() => void handleTranscriptUpload()}
                  disabled={transcriptLoading}
                  className="flex items-center gap-1.5 text-xs text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-primary-light disabled:opacity-50"
                >
                  <FileSpreadsheet size={13} />
                  {transcriptLoading ? '불러오는 중...' : '엑셀 성적표 불러오기'}
                </button>
              </div>

              {/* Transcript confirmation table */}
              {parsedCourses && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                    <Upload size={12} /> 성적표 파싱 결과 — 확인 후 반영
                  </p>
                  <TranscriptTable
                    courses={parsedCourses}
                    onConfirm={handleTranscriptConfirm}
                  />
                </div>
              )}

              {/* Confirmed skills */}
              {confirmedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-green-50 rounded-lg border border-green-100">
                  {confirmedSkills.map((s) => (
                    <EvidenceTooltip key={s.id} evidences={s.evidences}>
                      <span className="text-xs bg-green-100 text-success px-2 py-0.5 rounded-full cursor-help">
                        {s.name}
                      </span>
                    </EvidenceTooltip>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>학번 *</label>
                  <input
                    {...step1.register('studentId')}
                    inputMode="numeric"
                    maxLength={8}
                    className={inputClass}
                    placeholder="20211234"
                  />
                  {step1.formState.errors.studentId && (
                    <p className={errClass}>{step1.formState.errors.studentId.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>이름 *</label>
                  <input
                    {...step1.register('name')}
                    className={inputClass}
                    placeholder="홍길동"
                  />
                  {step1.formState.errors.name && (
                    <p className={errClass}>이름을 입력하세요</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>학과 *</label>
                  <select {...step1.register('department')} className={inputClass}>
                    <option value="">선택하세요</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {step1.formState.errors.department && (
                    <p className={errClass}>학과를 선택하세요</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>학년</label>
                    <select {...step1.register('gradeYear')} className={inputClass}>
                      {[1, 2, 3, 4].map((y) => (
                        <option key={y} value={y}>
                          {y}학년
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>학기</label>
                    <select {...step1.register('semester')} className={inputClass}>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                        <option key={s} value={s}>
                          {s}학기
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>복수전공</label>
                  <input
                    {...step1.register('doubleMajor')}
                    className={inputClass}
                    placeholder="선택 사항"
                  />
                </div>
                <div>
                  <label className={labelClass}>부전공</label>
                  <input
                    {...step1.register('minor')}
                    className={inputClass}
                    placeholder="선택 사항"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>학점 *</label>
                  <input
                    {...step1.register('gpa')}
                    type="number"
                    step="0.01"
                    min="0"
                    className={inputClass}
                    placeholder="3.85"
                  />
                  {step1.formState.errors.gpa && (
                    <p className={errClass}>학점을 입력하세요</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>전체학점 *</label>
                  <input
                    {...step1.register('gpaScale')}
                    type="number"
                    step="0.1"
                    min="0"
                    className={inputClass}
                    placeholder="4.5"
                  />
                  {step1.formState.errors.gpaScale && (
                    <p className={errClass}>전체학점을 입력하세요</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                다음 단계 →
              </button>
            </form>
          )}

          {/* ===== STEP 2 ===== */}
          {currentStep === 2 && (
            <form
              onSubmit={step2Form.handleSubmit((data) => void onStep2Submit(data))}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-ink">목표 설정</h2>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-gray-500 hover:text-ink"
                >
                  ← 이전
                </button>
              </div>

              <div>
                <label className={labelClass}>희망 직무 *</label>
                <div className="flex flex-wrap gap-2">
                  <Controller
                    control={step2Form.control}
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
                        {...step2Form.register('companySize')}
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
                  <span className="text-primary font-semibold">
                    {salary.toLocaleString()}만원
                  </span>
                </label>
                <input
                  type="range"
                  min={3000}
                  max={8000}
                  step={100}
                  {...step2Form.register('targetSalary', { valueAsNumber: true })}
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
                          step2Form.setValue(
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
                {step2Form.formState.errors.regions && (
                  <p className={errClass}>지역을 선택하세요</p>
                )}
              </div>

              <div>
                <label className={labelClass}>경력 구분</label>
                <div className="flex gap-4">
                  {(['NEW', 'EXPERIENCED'] as const).map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        {...step2Form.register('careerType')}
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
                  <input
                    {...step2Form.register('targetCompany')}
                    className={inputClass}
                    placeholder="네이버"
                  />
                  {step2Form.formState.errors.targetCompany && (
                    <p className={errClass}>기업명을 입력하세요</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>목표 직무 *</label>
                  <input
                    {...step2Form.register('targetRole')}
                    className={inputClass}
                    placeholder="백엔드 개발자"
                  />
                  {step2Form.formState.errors.targetRole && (
                    <p className={errClass}>직무를 입력하세요</p>
                  )}
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
                          step2Form.setValue('targetCompany', job.company);
                          step2Form.setValue('targetRole', job.title);
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
                <select {...step2Form.register('targetDate')} className={inputClass}>
                  {TARGET_DATES.map((d) => (
                    <option key={d} value={d}>
                      {d.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                진단 시작 →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

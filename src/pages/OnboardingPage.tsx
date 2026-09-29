import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Upload, Github, Plus, X, Compass,
  Check, Trash2, Edit2, FileSpreadsheet, Sparkles, SkipForward,
} from 'lucide-react';
import { useUserStore, useRoadmapStore, useUIStore } from '@/store';
import {
  saveProfile, saveTarget, parseTranscript, parseGithub,
  generateRoadmap, getGapAnalysis, checkStudentIdAvailable,
} from '@/api';
import { EvidenceTooltip } from '@/components/common/EvidenceTooltip';
import type { JobField, CompanySize, ParsedCourse, Skill } from '@/types';

// ---- Schemas ----
const step1Schema = z.object({
  studentId: z
    .string()
    .regex(/^\d{8}$/, '학번은 8자리 숫자입니다')
    .refine(async (v) => checkStudentIdAvailable(v), { message: '이미 등록된 학번입니다' }),
  name: z.string().min(1),
  department: z.string().min(1),
  doubleMajor: z.string().optional(),
  minor: z.string().optional(),
  gradeYear: z.coerce.number().min(1).max(4),
  semester: z.coerce.number().min(1).max(8),
  gpa: z.coerce.number().min(0).max(4.5),
});

const step2Schema = z.object({
  languageName: z.string().optional(),
  languageScore: z.coerce.number().optional(),
  codingPlatform: z.string().optional(),
  codingTier: z.string().optional(),
  githubUrl: z.string().optional(),
  certifications: z.array(z.string()),
  awards: z.array(z.string()),
  internships: z.array(z.string()),
  projects: z.array(z.object({
    title: z.string().min(1),
    stack: z.array(z.string()),
    description: z.string(),
  })),
});

const step3Schema = z.object({
  jobField: z.enum(['BACKEND', 'FRONTEND', 'DATA', 'AI', 'CLOUD', 'SECURITY'] as const),
  companySize: z.enum(['LARGE', 'MID', 'STARTUP'] as const),
  targetSalary: z.number(),
  regions: z.array(z.string()).min(1),
  careerType: z.enum(['NEW', 'EXPERIENCED'] as const),
  targetCompany: z.string().min(1),
  targetRole: z.string().min(1),
  targetDate: z.string(),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;
type Step3Form = z.infer<typeof step3Schema>;

// ---- Constants ----
const JOB_FIELDS: { value: JobField; label: string }[] = [
  { value: 'BACKEND', label: '백엔드' },
  { value: 'FRONTEND', label: '프론트엔드' },
  { value: 'DATA', label: '데이터' },
  { value: 'AI', label: 'AI/ML' },
  { value: 'CLOUD', label: '클라우드' },
  { value: 'SECURITY', label: '보안' },
];

const DEPARTMENTS = [
  '컴퓨터공학과', '소프트웨어학과', '정보보호학과', '데이터사이언스학과',
  '전자공학과', '기계공학과', '경영학과', '기타',
];
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '제주'];
const TARGET_DATES = ['2026-1H', '2026-2H', '2027-1H', '2027-2H', '2028-1H', '2028-2H'];

// ---- Sub-components ----
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput('');
  };
  return (
    <div className="border border-gray-200 rounded-lg p-2 flex flex-wrap gap-1.5 min-h-[42px]">
      {value.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-primary-light text-primary text-xs px-2 py-1 rounded-full"
        >
          {tag}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== tag))}>
            <X size={10} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
      />
    </div>
  );
}

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

// Live match rate preview
function LiveMatchPreview({ watchedFields }: { watchedFields: Partial<Step3Form> }) {
  const filled = [
    watchedFields.companySize,
    watchedFields.targetCompany,
    watchedFields.targetRole,
    (watchedFields.regions ?? []).length > 0 ? 'ok' : undefined,
    watchedFields.targetDate,
  ].filter(Boolean).length;
  const rate = 60 + filled * 5;

  return (
    <div className="bg-primary-light border border-primary/20 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-2">입력 기반 예상 매칭률</p>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-primary tabular-nums">{rate}</span>
        <span className="text-xl font-bold text-primary mb-1">%</span>
        <span className="text-xs text-gray-400 mb-1 ml-1">
          → 로드맵 완료 시 {rate + 8}%
        </span>
      </div>
      <div className="w-full bg-white rounded-full h-2 mt-2 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5">목표를 구체화할수록 더 정확해집니다</p>
    </div>
  );
}

// Loading screen
const LOAD_STEPS = ['스펙 분석 중', '공고 208건 대조 중', '갭 산출 중', '로드맵 생성 중'];

function GeneratingScreen({ onDone }: { onDone: () => void }) {
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
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Transcript state
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[] | null>(null);
  const [confirmedSkills, setConfirmedSkills] = useState<Skill[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubSkills, setGithubSkills] = useState<Skill[]>([]);

  // Collected data across steps
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Form | null>(null);

  const step1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      studentId: prefillStudentId,
      gradeYear: 3,
      semester: 6,
      gpa: 0,
    },
  });

  const step2Form = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      certifications: [],
      awards: [],
      internships: [],
      projects: [{ title: '', stack: [], description: '' }],
    },
  });

  const {
    fields: projFields,
    append: appendProj,
    remove: removeProj,
  } = useFieldArray({
    control: step2Form.control,
    name: 'projects',
  });

  const step3Form = useForm<Step3Form>({
    resolver: zodResolver(step3Schema),
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

  const watchedStep3 = step3Form.watch();
  const salary = step3Form.watch('targetSalary');
  const selectedRegions = step3Form.watch('regions');

  function markSaved() {
    setSavedAt(Date.now());
  }

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
    markSaved();
    showToast('성적표 확인 완료 — 스킬에 반영되었습니다');
  }

  async function handleGithubParse() {
    const url = step2Form.getValues('githubUrl');
    if (!url) return;
    setGithubLoading(true);
    try {
      const skills = await parseGithub(url);
      setGithubSkills(skills);
      markSaved();
      showToast('GitHub 스택 파싱 완료');
    } finally {
      setGithubLoading(false);
    }
  }

  function onStep1Next(data: Step1Form) {
    setStep1Data(data);
    markSaved();
    setCurrentStep(2);
  }

  function onStep2Next(data: Step2Form) {
    setStep2Data(data);
    markSaved();
    setCurrentStep(3);
  }

  function handleSkipStep2() {
    setStep2Data(step2Form.getValues());
    setCurrentStep(3);
  }

  async function onStep3Submit(data: Step3Form) {
    if (!step1Data || !step2Data) return;
    setGenerating(true);

    const allSkills = [...confirmedSkills, ...githubSkills];
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
      language:
        step2Data.languageName && step2Data.languageScore
          ? { name: step2Data.languageName, score: step2Data.languageScore }
          : null,
      certifications: step2Data.certifications,
      awards: step2Data.awards,
      internships: step2Data.internships,
      projects: step2Data.projects,
      codingTest:
        step2Data.codingPlatform && step2Data.codingTier
          ? { platform: step2Data.codingPlatform, tier: step2Data.codingTier }
          : null,
      githubUrl: step2Data.githubUrl,
      skills: allSkills,
      onboardingCompleted: true,
    };

    const { jobField: _jobField, ...targetData } = data;

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

  const STEPS = ['학생 정보', '개인 스펙', '목표 설정'];

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
        <div className="flex items-center gap-1 mb-5">
          {STEPS.map((label, i) => {
            const s = i + 1;
            const active = s === currentStep;
            const done = s < currentStep;
            return (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      done
                        ? 'bg-success text-white'
                        : active
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {done ? <Check size={12} /> : s}
                  </div>
                  <span
                    className={`text-xs ${
                      active ? 'text-ink font-semibold' : 'text-gray-400'
                    } hidden sm:block`}
                  >
                    {label}
                  </span>
                </div>
                {s < STEPS.length && (
                  <div className={`h-0.5 flex-1 ${done ? 'bg-success' : 'bg-gray-200'}`} />
                )}
              </div>
            );
          })}
          {savedAt !== null && (
            <span className="text-[11px] text-success flex items-center gap-1 ml-2 shrink-0">
              <Check size={10} /> 저장됨
            </span>
          )}
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

              <div>
                <label className={labelClass}>GPA *</label>
                <input
                  {...step1.register('gpa')}
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.5"
                  className={inputClass}
                  placeholder="3.85"
                />
                {step1.formState.errors.gpa && (
                  <p className={errClass}>GPA를 입력하세요</p>
                )}
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
            <form onSubmit={step2Form.handleSubmit(onStep2Next)} className="space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-ink">개인 스펙</h2>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipStep2}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-ink"
                  >
                    <SkipForward size={12} /> 건너뛰기
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-gray-500 hover:text-ink"
                  >
                    ← 이전
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>어학시험</label>
                  <input
                    {...step2Form.register('languageName')}
                    className={inputClass}
                    placeholder="TOEIC"
                  />
                </div>
                <div>
                  <label className={labelClass}>점수</label>
                  <input
                    {...step2Form.register('languageScore')}
                    type="number"
                    className={inputClass}
                    placeholder="870"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>코딩테스트 플랫폼</label>
                  <input
                    {...step2Form.register('codingPlatform')}
                    className={inputClass}
                    placeholder="백준"
                  />
                </div>
                <div>
                  <label className={labelClass}>티어</label>
                  <input
                    {...step2Form.register('codingTier')}
                    className={inputClass}
                    placeholder="Gold I"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>GitHub URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Github
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      {...step2Form.register('githubUrl')}
                      className={inputClass + ' pl-8'}
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleGithubParse()}
                    disabled={githubLoading}
                    className="shrink-0 text-xs border border-gray-200 rounded-lg px-3 hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    {githubLoading ? '파싱 중...' : 'GitHub 연동'}
                  </button>
                </div>
                {githubSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {githubSkills.map((s) => (
                      <EvidenceTooltip key={s.id} evidences={s.evidences}>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full cursor-help">
                          {s.name}
                        </span>
                      </EvidenceTooltip>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className={labelClass}>자격증</label>
                <Controller
                  control={step2Form.control}
                  name="certifications"
                  render={({ field }) => (
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="SQLD 입력 후 Enter"
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>수상 내역</label>
                  <Controller
                    control={step2Form.control}
                    name="awards"
                    render={({ field }) => (
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="해커톤 우수상..."
                      />
                    )}
                  />
                </div>
                <div>
                  <label className={labelClass}>인턴십</label>
                  <Controller
                    control={step2Form.control}
                    name="internships"
                    render={({ field }) => (
                      <TagInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="카카오 인턴..."
                      />
                    )}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={labelClass + ' mb-0'}>프로젝트</label>
                  <button
                    type="button"
                    onClick={() => appendProj({ title: '', stack: [], description: '' })}
                    className="text-xs text-primary flex items-center gap-1"
                  >
                    <Plus size={12} /> 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {projFields.map((field, idx) => (
                    <div key={field.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          프로젝트 {idx + 1}
                        </span>
                        {projFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeProj(idx)}
                            className="text-gray-400 hover:text-danger"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <input
                        {...step2Form.register(`projects.${idx}.title`)}
                        className={inputClass}
                        placeholder="프로젝트 제목"
                      />
                      <Controller
                        control={step2Form.control}
                        name={`projects.${idx}.stack`}
                        render={({ field: f }) => (
                          <TagInput
                            value={f.value}
                            onChange={f.onChange}
                            placeholder="Spring Boot 입력 후 Enter"
                          />
                        )}
                      />
                      <textarea
                        {...step2Form.register(`projects.${idx}.description`)}
                        className={inputClass + ' resize-none h-16'}
                        placeholder="프로젝트 설명"
                      />
                    </div>
                  ))}
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

          {/* ===== STEP 3 ===== */}
          {currentStep === 3 && (
            <form
              onSubmit={step3Form.handleSubmit((data) => void onStep3Submit(data))}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base font-semibold text-ink">목표 설정</h2>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs text-gray-500 hover:text-ink"
                >
                  ← 이전
                </button>
              </div>

              <LiveMatchPreview watchedFields={watchedStep3} />

              <div>
                <label className={labelClass}>희망 직무 *</label>
                <div className="flex flex-wrap gap-2">
                  <Controller
                    control={step3Form.control}
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
                  {(
                    [
                      ['LARGE', '대기업'],
                      ['MID', '중견기업'],
                      ['STARTUP', '스타트업'],
                    ] as [CompanySize, string][]
                  ).map(([val, label]) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        {...step3Form.register('companySize')}
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
                  {...step3Form.register('targetSalary', { valueAsNumber: true })}
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
                          step3Form.setValue(
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
                {step3Form.formState.errors.regions && (
                  <p className={errClass}>지역을 선택하세요</p>
                )}
              </div>

              <div>
                <label className={labelClass}>경력 구분</label>
                <div className="flex gap-4">
                  {(['NEW', 'EXPERIENCED'] as const).map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer">
                      <input
                        {...step3Form.register('careerType')}
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
                    {...step3Form.register('targetCompany')}
                    className={inputClass}
                    placeholder="네이버"
                  />
                  {step3Form.formState.errors.targetCompany && (
                    <p className={errClass}>기업명을 입력하세요</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>목표 직무 *</label>
                  <input
                    {...step3Form.register('targetRole')}
                    className={inputClass}
                    placeholder="백엔드 개발자"
                  />
                  {step3Form.formState.errors.targetRole && (
                    <p className={errClass}>직무를 입력하세요</p>
                  )}
                </div>
              </div>

              <div>
                <label className={labelClass}>목표 시기</label>
                <select {...step3Form.register('targetDate')} className={inputClass}>
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

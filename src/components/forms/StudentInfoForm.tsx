import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileSpreadsheet, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useUserStore, useUIStore } from '@/store';
import { patchMe, putMajors, patchOnboarding, previewTranscript, confirmAllTranscript } from '@/api/me';
import { errorMessage } from '@/api/http';
import { useStudentCodes, sortCodes } from '@/hooks/useCodes';
import { studentInfoSchema, COMPLETION_TYPE, type StudentInfoForm as FormValues } from '@/lib/profileOptions';
import type { TranscriptPreview } from '@/api/backend';
import type { MajorSelection } from '@/types';
import type { StepChange } from '@/api/backend';

interface Props {
  submitLabel: string;
  /** 엑셀 성적표 업로드 영역 표시 여부 */
  withTranscript?: boolean;
  onSaved: () => void;
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errClass = 'text-xs text-danger mt-0.5';

function findMajor(majors: MajorSelection[], type: string): string {
  return majors.find((m) => m.completionTypeCode === type)?.majorCode ?? '';
}

/**
 * 학생 기본 정보 + 전공 + (선택) 성적표 업로드.
 * 저장 순서: PATCH /me → PUT /me/majors → (성적표) confirm-all → PATCH /me/onboarding
 */
export function StudentInfoForm({ submitLabel, withTranscript = false, onSaved }: Props) {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const setOnboarding = useUserStore((s) => s.setOnboarding);
  const showToast = useUIStore((s) => s.showToast);

  const majorsQuery = useStudentCodes('majors');
  const majorOptions = sortCodes(majorsQuery.data);

  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<TranscriptPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(studentInfoSchema),
    defaultValues: {
      name: profile?.name ?? '',
      isTransfer: profile?.isTransfer ?? false,
      semester: profile?.semester ?? 1,
      gpa: profile?.gpa ?? 0,
      gpaScale: profile?.gpaScale ?? 4.5,
      primaryMajorCode: findMajor(profile?.majors ?? [], COMPLETION_TYPE.PRIMARY),
      doubleMajorCode: findMajor(profile?.majors ?? [], COMPLETION_TYPE.DOUBLE),
      minorMajorCode: findMajor(profile?.majors ?? [], COMPLETION_TYPE.MINOR),
    },
  });

  if (!profile) return null;

  async function handleFile(file: File) {
    setPreviewLoading(true);
    try {
      const result = await previewTranscript(file);
      setPreview(result);
      // 파일 기준 평점·이수학기가 있으면 폼에 미리 반영
      if (result.gpa != null) {
        form.setValue('gpa', Number(result.gpa.toFixed(2)));
        form.setValue('gpaScale', 4.5);
      }
      if (result.completedSemesters != null) form.setValue('semester', result.completedSemesters);
      const issues = result.wholeImport.rowIssues.length;
      showToast(
        issues > 0
          ? `성적표 ${result.wholeImport.ready}과목 인식 · ${issues}행은 오류로 제외됩니다`
          : `성적표 ${result.wholeImport.ready}과목을 인식했습니다`,
      );
    } catch (e) {
      showToast(errorMessage(e, '성적표를 읽지 못했습니다. .xlsx 파일인지 확인해주세요.'));
    } finally {
      setPreviewLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onSubmit(values: FormValues) {
    if (!profile) return;
    setSaving(true);
    try {
      // 1) 기본 정보
      const me = await patchMe({
        name: values.name,
        isTransfer: values.isTransfer,
        semester: values.semester,
        gpa: values.gpa,
        gpaScale: values.gpaScale,
      });

      // 2) 전공 전체 교체 — 폼에서 다루지 않는 이수 구분(제2전공 등)은 유지
      const handled = new Set<string>([COMPLETION_TYPE.PRIMARY, COMPLETION_TYPE.DOUBLE, COMPLETION_TYPE.MINOR]);
      const kept = profile.majors.filter((m) => !handled.has(m.completionTypeCode));
      const next: MajorSelection[] = [
        { majorCode: values.primaryMajorCode, completionTypeCode: COMPLETION_TYPE.PRIMARY },
        ...(values.doubleMajorCode ? [{ majorCode: values.doubleMajorCode, completionTypeCode: COMPLETION_TYPE.DOUBLE }] : []),
        ...(values.minorMajorCode ? [{ majorCode: values.minorMajorCode, completionTypeCode: COMPLETION_TYPE.MINOR }] : []),
        ...kept,
      ];
      const majors = await putMajors(next);

      // 3) 성적표 저장
      let coursesSaved = false;
      let savedGpa: number | null = null;
      let savedSemesters: number | null = null;
      if (preview) {
        const result = await confirmAllTranscript(preview.previewId);
        coursesSaved = result.inserted + result.skipped > 0;
        savedGpa = result.savedGpa;
        savedSemesters = result.savedCompletedSemesters;
        if (result.rowIssues.length > 0) {
          showToast(`성적표 ${result.inserted}과목 저장 · ${result.rowIssues.length}행은 오류로 제외됨`);
        }
        setPreview(null);
      }

      // 4) 온보딩 단계 상태
      const steps: StepChange[] = [
        { step: 'BASIC_INFO', status: 'COMPLETED' },
        { step: 'MAJORS', status: 'COMPLETED' },
      ];
      if (coursesSaved) steps.push({ step: 'COURSES', status: 'COMPLETED' });
      const view = await patchOnboarding(steps);

      updateProfile({
        name: me.name,
        isTransfer: me.isTransfer,
        semester: savedSemesters ?? me.semester,
        gpa: savedGpa ?? me.gpa,
        gpaScale: me.gpaScale,
        majors,
      });
      setOnboarding(view);
      onSaved();
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const majorSelect = (name: 'primaryMajorCode' | 'doubleMajorCode' | 'minorMajorCode', placeholder: string) => (
    <select {...form.register(name)} className={inputClass} disabled={majorsQuery.isLoading}>
      <option value="">{majorsQuery.isLoading ? '불러오는 중...' : placeholder}</option>
      {majorOptions.map((m) => (
        <option key={m.code} value={m.code}>{m.name}</option>
      ))}
    </select>
  );

  return (
    <form onSubmit={form.handleSubmit((v) => void onSubmit(v))} className="space-y-4">
      {withTranscript && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">학생 정보</h2>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={previewLoading}
            className="flex items-center gap-1.5 text-xs text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-primary-light disabled:opacity-50"
          >
            <FileSpreadsheet size={13} />
            {previewLoading ? '분석 중...' : '엑셀 성적표 불러오기'}
          </button>
        </div>
      )}

      {preview && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
              <CheckCircle2 size={12} /> 성적표 미리보기 — 저장 버튼을 누르면 과목 {preview.wholeImport.ready}건이 함께 저장됩니다
            </p>
            <button type="button" onClick={() => setPreview(null)} className="text-amber-700 hover:text-danger" aria-label="성적표 취소">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-amber-800 mb-2">
            {preview.gpa != null && <span>파일 평점 {preview.gpa.toFixed(2)} / 4.5</span>}
            {preview.completedSemesters != null && <span>이수학기 {preview.completedSemesters}개</span>}
            {preview.wholeImport.skipped > 0 && <span>기존 동일 과목 {preview.wholeImport.skipped}건</span>}
            {preview.wholeImport.rowIssues.length > 0 && (
              <span className="flex items-center gap-1 text-danger">
                <AlertTriangle size={11} /> 오류 {preview.wholeImport.rowIssues.length}행 제외
              </span>
            )}
          </div>
          <div className="max-h-48 overflow-auto border border-amber-200 rounded-lg bg-white">
            <table className="w-full text-[11px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-2 py-1.5 font-semibold text-gray-600">과목</th>
                  <th className="text-left px-2 py-1.5 font-semibold text-gray-600">학기</th>
                  <th className="text-left px-2 py-1.5 font-semibold text-gray-600">등급</th>
                  <th className="text-left px-2 py-1.5 font-semibold text-gray-600">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {preview.rows.map((row) => (
                  <tr key={`${row.sheetIndex}-${row.sourceRow}`} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                    <td className="px-2 py-1">{row.course?.courseName ?? '-'}</td>
                    <td className="px-2 py-1">{row.course ? `${row.course.academicYear}-${row.course.semester}` : '-'}</td>
                    <td className="px-2 py-1">{row.course?.grade ?? '-'}</td>
                    <td className="px-2 py-1">
                      {row.errors.length > 0 ? (
                        <span className="text-danger">{row.errors[0]?.message ?? '오류'}</span>
                      ) : row.existingCourseIds.length > 0 ? (
                        <span className="text-gray-400">기존</span>
                      ) : (
                        <span className="text-success">신규</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>이름 *</label>
          <input {...form.register('name')} className={inputClass} placeholder="홍길동" />
          {form.formState.errors.name && <p className={errClass}>{form.formState.errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>학교 이메일</label>
          <input value={profile.schoolEmail} disabled className={inputClass + ' bg-gray-50 text-gray-400 cursor-not-allowed'} />
        </div>
      </div>

      <div>
        <label className={labelClass}>주전공 *</label>
        {majorSelect('primaryMajorCode', '선택하세요')}
        {form.formState.errors.primaryMajorCode && <p className={errClass}>{form.formState.errors.primaryMajorCode.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>복수전공</label>
          {majorSelect('doubleMajorCode', '없음')}
        </div>
        <div>
          <label className={labelClass}>부전공</label>
          {majorSelect('minorMajorCode', '없음')}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>이수 학기 수</label>
          <select {...form.register('semester')} className={inputClass}>
            {Array.from({ length: 13 }, (_, i) => i).map((n) => (
              <option key={n} value={n}>{n}학기</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>학점 *</label>
          <input {...form.register('gpa')} type="number" step="0.01" min="0" className={inputClass} placeholder="3.85" />
          {form.formState.errors.gpa && <p className={errClass}>{form.formState.errors.gpa.message}</p>}
        </div>
        <div>
          <label className={labelClass}>만점 *</label>
          <input {...form.register('gpaScale')} type="number" step="0.1" min="0" max="4.5" className={inputClass} placeholder="4.5" />
          {form.formState.errors.gpaScale && <p className={errClass}>{form.formState.errors.gpaScale.message}</p>}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
        <input type="checkbox" {...form.register('isTransfer')} className="accent-primary" />
        편입생입니다
      </label>

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

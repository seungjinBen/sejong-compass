import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/common/Card';
import { useUserStore, useUIStore } from '@/store';
import { saveProfile } from '@/api';
import { studentInfoSchema, DEPARTMENTS, type StudentInfoForm } from '@/lib/profileOptions';

export function StudentInfoPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const showToast = useUIStore((s) => s.showToast);

  const [saving, setSaving] = useState(false);

  const form = useForm<StudentInfoForm>({
    resolver: zodResolver(studentInfoSchema),
    defaultValues: {
      name: profile?.name ?? '',
      department: profile?.department ?? '',
      doubleMajor: profile?.doubleMajor ?? '',
      minor: profile?.minor ?? '',
      gradeYear: profile?.gradeYear ?? 1,
      semester: profile?.semester ?? 1,
      gpa: profile?.gpa ?? 0,
      gpaScale: profile?.gpaScale ?? 4.5,
    },
  });

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
  const errClass = 'text-xs text-danger mt-0.5';

  if (!profile) return null;

  async function onSubmit(data: StudentInfoForm) {
    setSaving(true);
    try {
      const patch = {
        name: data.name,
        department: data.department,
        doubleMajor: data.doubleMajor || undefined,
        minor: data.minor || undefined,
        gradeYear: data.gradeYear as 1 | 2 | 3 | 4,
        semester: data.semester,
        gpa: data.gpa,
        gpaScale: data.gpaScale,
      };
      await saveProfile(patch);
      updateProfile(patch);
      showToast('학생 정보가 저장되었습니다');
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="학생 정보 수정">
      <Card className="max-w-2xl">
        <form onSubmit={form.handleSubmit((data) => void onSubmit(data))} className="space-y-4">
          <div>
            <label className={labelClass}>학번</label>
            <input
              value={profile.studentId}
              disabled
              className={inputClass + ' bg-gray-50 text-gray-400 cursor-not-allowed'}
            />
            <p className="text-[11px] text-gray-400 mt-0.5">학번은 변경할 수 없습니다</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>이름 *</label>
              <input {...form.register('name')} className={inputClass} placeholder="홍길동" />
              {form.formState.errors.name && <p className={errClass}>이름을 입력하세요</p>}
            </div>
            <div>
              <label className={labelClass}>학과 *</label>
              <select {...form.register('department')} className={inputClass}>
                <option value="">선택하세요</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {form.formState.errors.department && <p className={errClass}>학과를 선택하세요</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>학년</label>
              <select {...form.register('gradeYear')} className={inputClass}>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>{y}학년</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>학기</label>
              <select {...form.register('semester')} className={inputClass}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>{s}학기</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>복수전공</label>
              <input {...form.register('doubleMajor')} className={inputClass} placeholder="선택 사항" />
            </div>
            <div>
              <label className={labelClass}>부전공</label>
              <input {...form.register('minor')} className={inputClass} placeholder="선택 사항" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>학점 *</label>
              <input
                {...form.register('gpa')}
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                placeholder="3.85"
              />
              {form.formState.errors.gpa && <p className={errClass}>학점을 입력하세요</p>}
            </div>
            <div>
              <label className={labelClass}>전체학점 *</label>
              <input
                {...form.register('gpaScale')}
                type="number"
                step="0.1"
                min="0"
                className={inputClass}
                placeholder="4.5"
              />
              {form.formState.errors.gpaScale && <p className={errClass}>전체학점을 입력하세요</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장하기'}
          </button>
        </form>
      </Card>
    </PageShell>
  );
}

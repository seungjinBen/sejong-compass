import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Github, Plus, Trash2, Save, FolderGit2, Briefcase, Award as AwardIcon, BadgeCheck, RefreshCw } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/common/Card';
import { CodeMultiSelect } from '@/components/common/CodeMultiSelect';
import { useUserStore, useUIStore } from '@/store';
import { projects as projectsApi, internships as internshipsApi, awards as awardsApi, putCertifications, patchOnboarding } from '@/api/me';
import { errorMessage } from '@/api/http';
import { useStudentCodes, useCodeName, sortCodes } from '@/hooks/useCodes';
import { todayIso } from '@/lib/profileOptions';
import type { OnboardingStep } from '@/types';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white';
const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
const errClass = 'text-xs text-danger mt-0.5';

// ---- schemas ----

const projectSchema = z.object({
  name: z.string().trim().min(1, '프로젝트 이름을 입력하세요'),
  overview: z.string().trim().min(1, '한 줄 요약을 입력하세요'),
  description: z.string().trim().min(1, '설명을 입력하세요'),
  outcome: z.string().trim().optional(),
  githubUrl: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/?$/.test(v), {
      message: 'https://github.com/owner/repo 형식의 공개 저장소 주소',
    }),
  techStackCodes: z.array(z.string()).max(100),
});
type ProjectForm = z.infer<typeof projectSchema>;

const internshipSchema = z
  .object({
    companyName: z.string().trim().min(1, '회사명을 입력하세요'),
    jobCategoryCode: z.string().min(1, '직무를 선택하세요'),
    startedOn: z.string().min(1, '시작일을 입력하세요'),
    endedOn: z.string().min(1, '종료일을 입력하세요'),
    description: z.string().trim().min(1, '업무 내용을 입력하세요'),
  })
  .refine((v) => v.startedOn <= v.endedOn, { message: '시작일이 종료일보다 늦을 수 없습니다', path: ['endedOn'] })
  .refine((v) => v.endedOn <= todayIso(), { message: '종료일은 오늘 이전이어야 합니다', path: ['endedOn'] });
type InternshipForm = z.infer<typeof internshipSchema>;

const awardSchema = z.object({
  name: z.string().trim().min(1, '수상명을 입력하세요'),
  organizer: z.string().trim().min(1, '주최 기관을 입력하세요'),
  description: z.string().trim().optional(),
});
type AwardForm = z.infer<typeof awardSchema>;

// ---- small UI ----

function SectionHeader({ icon, title, count, onAdd, adding }: {
  icon: React.ReactNode; title: string; count: number; onAdd?: () => void; adding?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
        {icon} {title}
        <span className="text-xs font-normal text-gray-400">{count}</span>
      </h2>
      {onAdd && (
        <button type="button" onClick={onAdd} className="text-xs text-primary flex items-center gap-1">
          <Plus size={12} /> {adding ? '닫기' : '추가'}
        </button>
      )}
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-xs text-gray-400 py-2">{text}</p>;
}

// ---- Projects ----

function ProjectsSection({ markStep }: { markStep: (step: OnboardingStep) => Promise<void> }) {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const showToast = useUIStore((s) => s.showToast);
  const techStacks = useStudentCodes('tech-stacks');
  const techName = useCodeName('tech-stacks');

  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<number | 'new' | null>(null);

  const form = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', overview: '', description: '', outcome: '', githubUrl: '', techStackCodes: [] },
  });

  if (!profile) return null;
  const list = profile.projects;

  async function onCreate(v: ProjectForm) {
    setBusy('new');
    try {
      const created = await projectsApi.create({
        name: v.name,
        overview: v.overview,
        description: v.description,
        outcome: v.outcome || null,
        githubUrl: v.githubUrl || null,
        techStackCodes: v.techStackCodes,
      });
      updateProfile({ projects: [...list, created] });
      await markStep('PROJECTS');
      form.reset();
      setAdding(false);
      showToast('프로젝트가 추가되었습니다');
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(id: number) {
    setBusy(id);
    try {
      await projectsApi.remove(id);
      updateProfile({ projects: list.filter((p) => p.id !== id) });
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function onCollectReadme(id: number) {
    setBusy(id);
    try {
      const view = await projectsApi.collectReadme(id);
      const msg: Record<string, string> = {
        SUCCESS: 'GitHub README를 가져왔습니다',
        NOT_FOUND: 'README를 찾지 못했습니다',
        RATE_LIMITED: 'GitHub 요청 제한 — 잠시 후 다시 시도해주세요',
        FAILED: 'README 수집에 실패했습니다',
      };
      showToast(msg[view.lastAttemptStatus ?? 'FAILED'] ?? 'README 수집 결과를 확인하세요');
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <SectionHeader icon={<FolderGit2 size={14} />} title="프로젝트" count={list.length} onAdd={() => setAdding((v) => !v)} adding={adding} />

      {list.length === 0 && !adding && <EmptyLine text="등록된 프로젝트가 없습니다. 참여한 프로젝트를 추가해 보세요." />}

      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="border border-gray-100 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.overview}</p>
                {p.techStackCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.techStackCodes.map((c) => (
                      <span key={c} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{techName(c)}</span>
                    ))}
                  </div>
                )}
                {p.githubUrl && (
                  <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary flex items-center gap-1 mt-1.5">
                    <Github size={11} /> {p.githubUrl.replace('https://github.com/', '')}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {p.githubUrl && (
                  <button
                    type="button"
                    onClick={() => void onCollectReadme(p.id)}
                    disabled={busy === p.id}
                    title="GitHub README 수집"
                    className="p-1.5 text-gray-400 hover:text-primary disabled:opacity-50"
                  >
                    <RefreshCw size={13} className={busy === p.id ? 'animate-spin' : ''} />
                  </button>
                )}
                <button type="button" onClick={() => void onRemove(p.id)} disabled={busy === p.id} className="p-1.5 text-gray-400 hover:text-danger disabled:opacity-50" aria-label="삭제">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={form.handleSubmit((v) => void onCreate(v))} className="mt-3 border border-primary/30 bg-primary-light/30 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>프로젝트 이름 *</label>
              <input {...form.register('name')} className={inputClass} placeholder="세종 컴퍼스" />
              {form.formState.errors.name && <p className={errClass}>{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>한 줄 요약 *</label>
              <input {...form.register('overview')} className={inputClass} placeholder="학생 맞춤 커리어 가이드 웹" />
              {form.formState.errors.overview && <p className={errClass}>{form.formState.errors.overview.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>설명 *</label>
            <textarea {...form.register('description')} className={inputClass + ' resize-none h-16'} placeholder="맡은 역할과 구현 내용" />
            {form.formState.errors.description && <p className={errClass}>{form.formState.errors.description.message}</p>}
          </div>
          <div>
            <label className={labelClass}>성과</label>
            <input {...form.register('outcome')} className={inputClass} placeholder="교내 해커톤 본선 진출 등 (선택)" />
          </div>
          <div>
            <label className={labelClass}>기술 스택</label>
            <CodeMultiSelect
              options={techStacks.data}
              value={form.watch('techStackCodes')}
              onChange={(codes) => form.setValue('techStackCodes', codes, { shouldValidate: true })}
              placeholder={techStacks.isLoading ? '불러오는 중...' : 'Spring 검색 후 선택'}
            />
          </div>
          <div>
            <label className={labelClass}>GitHub 저장소</label>
            <div className="relative">
              <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input {...form.register('githubUrl')} className={inputClass + ' pl-8'} placeholder="https://github.com/owner/repo (선택)" />
            </div>
            {form.formState.errors.githubUrl && <p className={errClass}>{form.formState.errors.githubUrl.message}</p>}
          </div>
          <button type="submit" disabled={busy === 'new'} className="w-full flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2 text-xs font-semibold hover:bg-primary-dark disabled:opacity-50">
            <Save size={13} /> {busy === 'new' ? '저장 중...' : '프로젝트 저장'}
          </button>
        </form>
      )}
    </Card>
  );
}

// ---- Internships ----

function InternshipsSection({ markStep }: { markStep: (step: OnboardingStep) => Promise<void> }) {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const showToast = useUIStore((s) => s.showToast);
  const jobs = useStudentCodes('job-categories');
  const jobName = useCodeName('job-categories');

  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<number | 'new' | null>(null);

  const form = useForm<InternshipForm>({
    resolver: zodResolver(internshipSchema),
    defaultValues: { companyName: '', jobCategoryCode: '', startedOn: '', endedOn: '', description: '' },
  });

  if (!profile) return null;
  const list = profile.internships;

  async function onCreate(v: InternshipForm) {
    setBusy('new');
    try {
      const created = await internshipsApi.create(v);
      updateProfile({ internships: [...list, created] });
      await markStep('INTERNSHIPS');
      form.reset();
      setAdding(false);
      showToast('인턴 이력이 추가되었습니다');
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(id: number) {
    setBusy(id);
    try {
      await internshipsApi.remove(id);
      updateProfile({ internships: list.filter((p) => p.id !== id) });
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <SectionHeader icon={<Briefcase size={14} />} title="인턴십" count={list.length} onAdd={() => setAdding((v) => !v)} adding={adding} />
      {list.length === 0 && !adding && <EmptyLine text="등록된 인턴 이력이 없습니다." />}
      <ul className="space-y-2">
        {list.map((it) => (
          <li key={it.id} className="border border-gray-100 rounded-xl p-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{it.companyName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{jobName(it.jobCategoryCode)} · {it.startedOn} ~ {it.endedOn}</p>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{it.description}</p>
            </div>
            <button type="button" onClick={() => void onRemove(it.id)} disabled={busy === it.id} className="p-1.5 text-gray-400 hover:text-danger disabled:opacity-50" aria-label="삭제">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={form.handleSubmit((v) => void onCreate(v))} className="mt-3 border border-primary/30 bg-primary-light/30 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>회사명 *</label>
              <input {...form.register('companyName')} className={inputClass} placeholder="카카오" />
              {form.formState.errors.companyName && <p className={errClass}>{form.formState.errors.companyName.message}</p>}
            </div>
            <div>
              <label className={labelClass}>직무 *</label>
              <select {...form.register('jobCategoryCode')} className={inputClass} disabled={jobs.isLoading}>
                <option value="">{jobs.isLoading ? '불러오는 중...' : '선택하세요'}</option>
                {sortCodes(jobs.data).map((j) => (
                  <option key={j.code} value={j.code}>{j.name}</option>
                ))}
              </select>
              {form.formState.errors.jobCategoryCode && <p className={errClass}>{form.formState.errors.jobCategoryCode.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>시작일 *</label>
              <input {...form.register('startedOn')} type="date" max={todayIso()} className={inputClass} />
              {form.formState.errors.startedOn && <p className={errClass}>{form.formState.errors.startedOn.message}</p>}
            </div>
            <div>
              <label className={labelClass}>종료일 *</label>
              <input {...form.register('endedOn')} type="date" max={todayIso()} className={inputClass} />
              {form.formState.errors.endedOn && <p className={errClass}>{form.formState.errors.endedOn.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>업무 내용 *</label>
            <textarea {...form.register('description')} className={inputClass + ' resize-none h-16'} placeholder="담당 업무와 성과" />
            {form.formState.errors.description && <p className={errClass}>{form.formState.errors.description.message}</p>}
          </div>
          <button type="submit" disabled={busy === 'new'} className="w-full flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2 text-xs font-semibold hover:bg-primary-dark disabled:opacity-50">
            <Save size={13} /> {busy === 'new' ? '저장 중...' : '인턴 이력 저장'}
          </button>
        </form>
      )}
    </Card>
  );
}

// ---- Awards ----

function AwardsSection({ markStep }: { markStep: (step: OnboardingStep) => Promise<void> }) {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const showToast = useUIStore((s) => s.showToast);

  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<number | 'new' | null>(null);

  const form = useForm<AwardForm>({
    resolver: zodResolver(awardSchema),
    defaultValues: { name: '', organizer: '', description: '' },
  });

  if (!profile) return null;
  const list = profile.awards;

  async function onCreate(v: AwardForm) {
    setBusy('new');
    try {
      const created = await awardsApi.create({ name: v.name, organizer: v.organizer, description: v.description || null });
      updateProfile({ awards: [...list, created] });
      await markStep('AWARDS');
      form.reset();
      setAdding(false);
      showToast('수상 이력이 추가되었습니다');
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function onRemove(id: number) {
    setBusy(id);
    try {
      await awardsApi.remove(id);
      updateProfile({ awards: list.filter((p) => p.id !== id) });
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <SectionHeader icon={<AwardIcon size={14} />} title="수상 내역" count={list.length} onAdd={() => setAdding((v) => !v)} adding={adding} />
      {list.length === 0 && !adding && <EmptyLine text="등록된 수상 내역이 없습니다." />}
      <ul className="space-y-2">
        {list.map((a) => (
          <li key={a.id} className="border border-gray-100 rounded-xl p-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{a.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{a.organizer}</p>
              {a.description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{a.description}</p>}
            </div>
            <button type="button" onClick={() => void onRemove(a.id)} disabled={busy === a.id} className="p-1.5 text-gray-400 hover:text-danger disabled:opacity-50" aria-label="삭제">
              <Trash2 size={13} />
            </button>
          </li>
        ))}
      </ul>

      {adding && (
        <form onSubmit={form.handleSubmit((v) => void onCreate(v))} className="mt-3 border border-primary/30 bg-primary-light/30 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>수상명 *</label>
              <input {...form.register('name')} className={inputClass} placeholder="교내 해커톤 우수상" />
              {form.formState.errors.name && <p className={errClass}>{form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>주최 *</label>
              <input {...form.register('organizer')} className={inputClass} placeholder="세종대학교 SW중심대학사업단" />
              {form.formState.errors.organizer && <p className={errClass}>{form.formState.errors.organizer.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>설명</label>
            <input {...form.register('description')} className={inputClass} placeholder="수상 내용 (선택)" />
          </div>
          <button type="submit" disabled={busy === 'new'} className="w-full flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2 text-xs font-semibold hover:bg-primary-dark disabled:opacity-50">
            <Save size={13} /> {busy === 'new' ? '저장 중...' : '수상 내역 저장'}
          </button>
        </form>
      )}
    </Card>
  );
}

// ---- Certifications ----

function CertificationsSection({ markStep }: { markStep: (step: OnboardingStep) => Promise<void> }) {
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const showToast = useUIStore((s) => s.showToast);
  const certs = useStudentCodes('certifications');

  const [selected, setSelected] = useState<string[]>(profile?.certificationCodes ?? []);
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const dirty =
    selected.length !== profile.certificationCodes.length ||
    selected.some((c) => !profile.certificationCodes.includes(c));

  function toggle(code: string) {
    setSelected((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]));
  }

  async function onSave() {
    setSaving(true);
    try {
      const codes = await putCertifications(selected);
      updateProfile({ certificationCodes: codes });
      if (codes.length > 0) await markStep('CERTIFICATIONS');
      showToast('보유 자격증이 저장되었습니다');
    } catch (e) {
      showToast(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <SectionHeader icon={<BadgeCheck size={14} />} title="보유 자격증" count={profile.certificationCodes.length} />
      {certs.isLoading && <EmptyLine text="자격증 목록 불러오는 중..." />}
      <div className="flex flex-wrap gap-2">
        {sortCodes(certs.data).map((c) => {
          const on = selected.includes(c.code);
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => toggle(c.code)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                on ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-gray-400 mt-2">목록에 없는 자격증은 아직 등록할 수 없어요.</p>
      {dirty && (
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={saving}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-primary text-white rounded-lg py-2 text-xs font-semibold hover:bg-primary-dark disabled:opacity-50"
        >
          <Save size={13} /> {saving ? '저장 중...' : '자격증 저장'}
        </button>
      )}
    </Card>
  );
}

// ---- Page ----

export function SpecPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const setOnboarding = useUserStore((s) => s.setOnboarding);

  if (!profile) return null;

  /** 선택 단계는 기록이 생기면 COMPLETED 로 표시 (실패해도 입력 자체는 저장됨) */
  async function markStep(step: OnboardingStep) {
    const status = profile?.onboarding?.steps.find((s) => s.step === step)?.status;
    if (status === 'COMPLETED') return;
    try {
      const view = await patchOnboarding([{ step, status: 'COMPLETED' }]);
      setOnboarding(view);
    } catch {
      // 상태 갱신 실패는 치명적이지 않음
    }
  }

  return (
    <PageShell title="개인 스펙 입력">
      <div className="max-w-2xl space-y-4">
        <ProjectsSection markStep={markStep} />
        <InternshipsSection markStep={markStep} />
        <AwardsSection markStep={markStep} />
        <CertificationsSection markStep={markStep} />
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full bg-white border border-gray-200 text-ink rounded-xl py-3 text-sm font-semibold hover:border-primary transition-colors"
        >
          대시보드로 돌아가기
        </button>
      </div>
    </PageShell>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Github, Plus, X, Save } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/common/Card';
import { EvidenceTooltip } from '@/components/common/EvidenceTooltip';
import { useUserStore, useUIStore } from '@/store';
import { saveProfile, parseGithub } from '@/api';
import type { Skill } from '@/types';

const specSchema = z.object({
  languageName: z.string().optional(),
  languageScore: z.coerce.number().optional(),
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

type SpecForm = z.infer<typeof specSchema>;

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

export function SpecPage() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const showToast = useUIStore((s) => s.showToast);

  const [githubLoading, setGithubLoading] = useState(false);
  const [githubSkills, setGithubSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);

  const form = useForm<SpecForm>({
    resolver: zodResolver(specSchema),
    defaultValues: {
      languageName: profile?.language?.name ?? '',
      languageScore: profile?.language?.score,
      githubUrl: profile?.githubUrl ?? '',
      certifications: profile?.certifications ?? [],
      awards: profile?.awards ?? [],
      internships: profile?.internships ?? [],
      projects: profile?.projects && profile.projects.length > 0
        ? profile.projects
        : [{ title: '', stack: [], description: '' }],
    },
  });

  const {
    fields: projFields,
    append: appendProj,
    remove: removeProj,
  } = useFieldArray({
    control: form.control,
    name: 'projects',
  });

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  if (!profile) return null;

  async function handleGithubParse() {
    const url = form.getValues('githubUrl');
    if (!url) return;
    setGithubLoading(true);
    try {
      const skills = await parseGithub(url);
      setGithubSkills(skills);
      showToast('GitHub 스택 파싱 완료');
    } finally {
      setGithubLoading(false);
    }
  }

  async function onSubmit(data: SpecForm) {
    if (!profile) return;
    setSaving(true);
    try {
      const patch = {
        language:
          data.languageName && data.languageScore
            ? { name: data.languageName, score: data.languageScore }
            : null,
        certifications: data.certifications,
        awards: data.awards,
        internships: data.internships,
        projects: data.projects,
        githubUrl: data.githubUrl,
        skills: [...profile.skills, ...githubSkills],
      };
      await saveProfile(patch);
      updateProfile(patch);
      showToast('스펙이 저장되었습니다');
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="개인 스펙 입력">
      <Card className="max-w-2xl">
        <form onSubmit={form.handleSubmit((data) => void onSubmit(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>어학시험</label>
              <input {...form.register('languageName')} className={inputClass} placeholder="TOEIC" />
            </div>
            <div>
              <label className={labelClass}>점수</label>
              <input
                {...form.register('languageScore')}
                type="number"
                className={inputClass}
                placeholder="870"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>GitHub URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Github size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...form.register('githubUrl')}
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
              control={form.control}
              name="certifications"
              render={({ field }) => (
                <TagInput value={field.value} onChange={field.onChange} placeholder="SQLD 입력 후 Enter" />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>수상 내역</label>
              <Controller
                control={form.control}
                name="awards"
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} placeholder="해커톤 우수상..." />
                )}
              />
            </div>
            <div>
              <label className={labelClass}>인턴십</label>
              <Controller
                control={form.control}
                name="internships"
                render={({ field }) => (
                  <TagInput value={field.value} onChange={field.onChange} placeholder="카카오 인턴..." />
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
                    <span className="text-xs font-medium text-gray-500">프로젝트 {idx + 1}</span>
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
                    {...form.register(`projects.${idx}.title`)}
                    className={inputClass}
                    placeholder="프로젝트 제목"
                  />
                  <Controller
                    control={form.control}
                    name={`projects.${idx}.stack`}
                    render={({ field: f }) => (
                      <TagInput value={f.value} onChange={f.onChange} placeholder="Spring Boot 입력 후 Enter" />
                    )}
                  />
                  <textarea
                    {...form.register(`projects.${idx}.description`)}
                    className={inputClass + ' resize-none h-16'}
                    placeholder="프로젝트 설명"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-primary text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? '저장 중...' : '저장하고 대시보드로'}
          </button>
        </form>
      </Card>
    </PageShell>
  );
}

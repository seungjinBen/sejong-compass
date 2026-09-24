import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ExternalLink, Heart, HeartOff, ChevronDown, ChevronUp,
  ArrowRight, CheckCircle, AlertCircle, Zap, Filter,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { MatchRateRing } from '@/components/common/MatchRateRing';
import { ReasonPanel } from '@/components/reason/ReasonPanel';
import { EvidenceTooltip } from '@/components/common/EvidenceTooltip';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { useUserStore, useRoadmapStore, useUIStore } from '@/store';
import { getJobsList, generateRoadmap, logBehavior } from '@/api';
import type { JobPosting, GapAxis, GapStatus } from '@/types';

const SOURCE_LABELS: Record<string, string> = {
  SARAMIN: '사람인', WANTED: '원티드', JOBKOREA: '잡코리아', COMPANY: '공식',
};

const GAP_STATUS_COLORS: Record<GapStatus, string> = {
  MET: 'bg-green-100 text-success border-green-200',
  PARTIAL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LACK: 'bg-red-100 text-danger border-red-200',
};

function getDDay(deadline: string): { label: string; urgent: boolean } {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: '마감', urgent: true };
  if (diff === 0) return { label: 'D-day', urgent: true };
  return { label: `D-${diff}`, urgent: diff <= 7 };
}

export function DiagnosisPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useUserStore(s => s.profile);
  const setRoadmap = useRoadmapStore(s => s.setRoadmap);
  const setBaseMatchRate = useRoadmapStore(s => s.setBaseMatchRate);
  const { showToast } = useUIStore();

  // gapAxes from window
  const [gapAxes, setGapAxes] = useState<GapAxis[]>(() => {
    const win = window as Window & { __sc_gapAxes?: GapAxis[] };
    return win.__sc_gapAxes ?? [];
  });
  useEffect(() => {
    const t = setTimeout(() => {
      const win = window as Window & { __sc_gapAxes?: GapAxis[] };
      if ((win.__sc_gapAxes ?? []).length > 0) setGapAxes(win.__sc_gapAxes!);
    }, 150);
    return () => clearTimeout(t);
  }, []);

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<JobPosting | null>(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [sort, setSort] = useState<'matchRate' | 'deadline'>('matchRate');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [openAxis, setOpenAxis] = useState<string | null>(null);

  // Load initial axis from hash
  useEffect(() => {
    const hash = location.hash;
    if (hash.startsWith('#axis=')) {
      setOpenAxis(hash.replace('#axis=', ''));
    }
  }, [location.hash]);

  async function loadJobs() {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getJobsList({ sort });
      const sorted = sort === 'matchRate'
        ? [...data].sort((a, b) => b.matchRate - a.matchRate)
        : [...data].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
      setJobs(sorted);
      setSelected(prev => prev ? (sorted.find(j => j.id === prev.id) ?? sorted[0] ?? null) : (sorted[0] ?? null));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadJobs(); }, [sort]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectJob(job: JobPosting) {
    if (selected?.id === job.id) return;
    setPanelLoading(true);
    setTimeout(() => {
      setSelected(job);
      setPanelLoading(false);
      void logBehavior({ type: 'JOB_VIEW', targetId: job.id, at: new Date().toISOString() });
    }, 300);
  }

  function toggleSave(jobId: string) {
    setSavedIds(s => {
      const next = new Set(s);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
        void logBehavior({ type: 'JOB_SAVE', targetId: jobId, at: new Date().toISOString() });
      }
      return next;
    });
  }

  async function handleGenerateRoadmap() {
    if (!selected) return;
    setGeneratingRoadmap(true);
    setConfirmOpen(false);
    try {
      const updated = await generateRoadmap(selected.id);
      setRoadmap(updated);
      setBaseMatchRate(updated.currentMatchRate);
      showToast('로드맵이 갱신되었습니다');
      navigate(`/roadmap?job=${selected.id}`);
    } catch {
      showToast('로드맵 생성 실패 — 다시 시도해주세요');
    } finally {
      setGeneratingRoadmap(false);
    }
  }

  // Owned skill IDs from profile
  const ownedSkillIds = new Set((profile?.skills ?? []).map(s => s.id));

  return (
    <PageShell title="스펙 진단 & 갭">
      {/* Gap Summary Bar */}
      <div className="mb-5">
        <div className="flex flex-wrap gap-2 mb-2">
          {gapAxes.map(ax => (
            <button
              key={ax.key}
              onClick={() => setOpenAxis(prev => prev === ax.key ? null : ax.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${GAP_STATUS_COLORS[ax.status]} ${openAxis === ax.key ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
            >
              {ax.label}
              <span className="font-normal opacity-80">{ax.myValueText}</span>
              {openAxis === ax.key ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          ))}
        </div>

        {/* Evidence Drawer */}
        {openAxis && (() => {
          const ax = gapAxes.find(a => a.key === openAxis);
          if (!ax) return null;
          return (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{ax.label} 역량 상세</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    내 값 <strong>{ax.myValueText}</strong> · 요구 <strong>{ax.requiredText}</strong> · 매칭 기여{' '}
                    <span className={ax.deltaPercent < 0 ? 'text-danger font-semibold' : 'text-success font-semibold'}>
                      {ax.deltaPercent >= 0 ? '+' : ''}{ax.deltaPercent}%p
                    </span>
                  </p>
                </div>
                <button onClick={() => setOpenAxis(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
              {ax.evidences.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">출처 근거</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ax.evidences.map((ev, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {ev.label} ({Math.round(ev.weight * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">보완 처방</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/roadmap#axis=${ax.key}`)}
                    className="text-xs text-primary border border-primary rounded-lg px-3 py-1.5 hover:bg-primary-light transition-colors flex items-center gap-1"
                  >
                    로드맵에서 처방 보기 <ArrowRight size={11} />
                  </button>
                  <button
                    onClick={() => navigate('/dodream')}
                    className="text-xs text-amber-600 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors flex items-center gap-1"
                  >
                    두드림 프로그램 <ArrowRight size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Main 2-column layout */}
      <div className="flex gap-5 items-start">
        {/* LEFT: Job list */}
        <div className="w-[42%] shrink-0">
          {/* Sort/Filter bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
              {(['matchRate', 'deadline'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 ${sort === s ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {s === 'matchRate' ? '매칭률순' : '마감임박순'}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-auto">{jobs.length}개 공고</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <ErrorState title="공고 불러오기 실패" onRetry={() => void loadJobs()} />
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {jobs.map(job => {
                const dday = getDDay(job.deadline);
                const isSelected = selected?.id === job.id;
                const isSaved = savedIds.has(job.id);
                return (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary-light/20 shadow-sm' : 'border-gray-200 bg-white hover:border-primary/50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-ink">{job.company}</span>
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            {SOURCE_LABELS[job.source] ?? job.source}
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${dday.urgent ? 'bg-red-100 text-danger' : 'bg-gray-100 text-gray-500'}`}>
                            {dday.label}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-700 mb-2 line-clamp-2">{job.title}</p>
                        {job.blocker && (
                          <div className="flex items-center gap-1 text-[11px] text-warn">
                            <AlertCircle size={11} />
                            <span>{job.blocker.skillName} 부족 {job.blocker.deltaPercent}%</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <MatchRateRing value={job.matchRate} size="sm" animated={isSelected} />
                        <button
                          onClick={e => { e.stopPropagation(); toggleSave(job.id); }}
                          className={`p-1 rounded ${isSaved ? 'text-primary' : 'text-gray-300 hover:text-gray-400'}`}
                          aria-label={isSaved ? '저장 취소' : '관심 저장'}
                        >
                          {isSaved ? <Heart size={14} fill="currentColor" /> : <HeartOff size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: AI Analysis Panel */}
        <div className="flex-1 sticky top-20">
          {panelLoading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : selected ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Panel header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">[{selected.company}] 요구 스펙 vs 내 스펙</p>
                    <p className="text-base font-bold text-ink">{selected.title}</p>
                  </div>
                  <MatchRateRing value={selected.matchRate} size="md" label="적합도" />
                </div>
              </div>

              <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Required skills */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                    <Zap size={13} className="text-warn" /> 요구 스킬
                  </p>
                  <div className="mb-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5 block">필수</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.requiredSkills.filter(s => s.type === 'REQUIRED').map(skill => {
                        const owned = ownedSkillIds.has(skill.skillId);
                        const profileSkill = profile?.skills.find(s => s.id === skill.skillId);
                        return owned && profileSkill ? (
                          <EvidenceTooltip key={skill.skillId} evidences={profileSkill.evidences}>
                            <span className="text-xs bg-green-100 text-success border border-green-200 px-2.5 py-1 rounded-full font-medium cursor-help flex items-center gap-1">
                              <CheckCircle size={10} />{skill.name}
                            </span>
                          </EvidenceTooltip>
                        ) : (
                          <span key={skill.skillId} className="text-xs bg-white text-gray-400 border border-gray-200 px-2.5 py-1 rounded-full">
                            {skill.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {selected.requiredSkills.some(s => s.type === 'PREFERRED') && (
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1.5 block">우대</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.requiredSkills.filter(s => s.type === 'PREFERRED').map(skill => {
                          const owned = ownedSkillIds.has(skill.skillId);
                          return (
                            <span
                              key={skill.skillId}
                              className={`text-xs px-2.5 py-1 rounded-full border text-[11px] ${owned ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200 border-dashed'}`}
                            >
                              {skill.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Strong points */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-success" /> 강점
                  </p>
                  <div className="space-y-2">
                    {selected.strongPoints.map((sp, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-success mt-0.5 shrink-0">✓</span>
                        <div>
                          <p className="text-xs text-ink">{sp.text}</p>
                          {sp.evidences.length > 0 && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              ← {sp.evidences.map(e => e.label).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Improvements */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                    <AlertCircle size={13} className="text-warn" /> 보완 필요
                  </p>
                  <div className="space-y-2">
                    {selected.improvements.map((imp, i) => (
                      <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                        <AlertCircle size={13} className="text-warn shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-ink">{imp.text}</p>
                        </div>
                        <span className="text-xs font-semibold text-danger shrink-0">{imp.deltaPercent}%</span>
                        <button
                          onClick={() => navigate(`/roadmap?task=${imp.skillId}`)}
                          className="text-[11px] text-primary hover:underline shrink-0"
                        >
                          처방 보기 →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why this job */}
                <div>
                  <ReasonPanel
                    reason={selected.reason}
                    collapsible
                    defaultExpanded={false}
                    onExpand={() => void logBehavior({ type: 'REASON_OPEN', targetId: selected.id, at: new Date().toISOString() })}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <a
                    href={selected.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    원본 공고 보기 <ExternalLink size={13} />
                  </a>
                  <button
                    onClick={() => setConfirmOpen(true)}
                    disabled={generatingRoadmap}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                  >
                    {generatingRoadmap ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>이 공고 기준 로드맵 갱신 →</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <Filter size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-500">왼쪽에서 공고를 선택하세요</p>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={() => void handleGenerateRoadmap()}
        onCancel={() => setConfirmOpen(false)}
        title="로드맵 갱신"
        message="현재 로드맵의 미완료 태스크가 재배치됩니다. 계속하시겠습니까?"
        confirmLabel="갱신하기"
      />
    </PageShell>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, BookOpen, Calendar, Users, Sparkles, Plus, Check } from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { GainBadge } from '@/components/common/GainBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { useRoadmapStore, useUIStore } from '@/store';
import { getDoDreamPrograms, addTaskFromDoDream, logBehavior } from '@/api';
import type { DoDreamProgram, GapKey, GapStatus } from '@/types';

const GAP_LABELS: Record<GapKey, string> = {
  GPA: '전공학점',
  LANGUAGE: '어학',
  CERT: '자격증',
  PROJECT: '직무 프로젝트',
  CODING_TEST: '코딩테스트',
  STACK: '기술 스택',
};

const CATEGORY_COLORS: Record<DoDreamProgram['category'], string> = {
  '현직자멘토링': 'bg-purple-100 text-purple-700 border border-purple-200',
  '마이크로디그리': 'bg-blue-100 text-blue-700 border border-blue-200',
  '오픈소스캠프': 'bg-green-100 text-green-700 border border-green-200',
  '스터디': 'bg-orange-100 text-orange-700 border border-orange-200',
  '부트캠프': 'bg-red-100 text-red-700 border border-red-200',
};

const ALL_CATEGORIES = ['현직자멘토링', '마이크로디그리', '오픈소스캠프', '스터디', '부트캠프'] as const;

type CategoryType = typeof ALL_CATEGORIES[number];

function getDDay(deadline: string): { label: string; urgent: boolean } {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { label: '마감', urgent: true };
  if (diff === 0) return { label: 'D-day', urgent: true };
  return { label: `D-${diff}`, urgent: diff <= 7 };
}

const GAP_STATUS_CHIP: Record<GapStatus, string> = {
  MET: 'bg-green-100 text-success border-green-200',
  PARTIAL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LACK: 'bg-red-100 text-danger border-red-200',
};

function AddToRoadmapPopover({
  currentSemester,
  onAdd,
}: {
  currentSemester: string;
  onAdd: (semKey: string) => void;
}) {
  const nextSemKey = currentSemester.endsWith('-2')
    ? currentSemester.replace('-2', '-W')
    : '2027-1';

  return (
    <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
      <p className="text-xs font-semibold text-gray-500 px-3 py-2 border-b border-gray-100">학기 선택</p>
      <button
        onClick={() => onAdd(currentSemester)}
        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-ink"
      >
        현재 학기
      </button>
      <button
        onClick={() => onAdd(nextSemKey)}
        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 text-ink"
      >
        다음 학기
      </button>
    </div>
  );
}

export function DoDreamPage() {
  const navigate = useNavigate();
  const roadmap = useRoadmapStore(s => s.roadmap);
  const dodreamAddedIds = useRoadmapStore(s => s.dodreamAddedIds);
  const addDoDreamTaskLocal = useRoadmapStore(s => s.addDoDreamTask);
  const setRoadmap = useRoadmapStore(s => s.setRoadmap);
  const { showToast, dodreamCapacities } = useUIStore();

  const [programs, setPrograms] = useState<DoDreamProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<Set<CategoryType>>(new Set());
  const [creditOnly, setCreditOnly] = useState(false);
  const [gapRelated, setGapRelated] = useState(true);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortMode, setSortMode] = useState<'gain' | 'deadline'>('gain');

  // Gap axes for coloring
  const [gapStatuses, setGapStatuses] = useState<Record<GapKey, GapStatus>>({
    GPA: 'MET',
    LANGUAGE: 'MET',
    CERT: 'MET',
    PROJECT: 'PARTIAL',
    CODING_TEST: 'PARTIAL',
    STACK: 'LACK',
  });

  useEffect(() => {
    const win = window as Window & { __sc_gapAxes?: Array<{ key: GapKey; status: GapStatus }> };
    const axes = win.__sc_gapAxes ?? [];
    if (axes.length > 0) {
      const map = {} as Record<GapKey, GapStatus>;
      axes.forEach(ax => {
        map[ax.key] = ax.status;
      });
      setGapStatuses(map);
    }
  }, []);

  // Popover state
  const [popoverFor, setPopoverFor] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const data = await getDoDreamPrograms();
      setPrograms(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Close popover on outside click
  useEffect(() => {
    if (!popoverFor) return;
    const handler = () => setPopoverFor(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [popoverFor]);

  async function handleAddToRoadmap(program: DoDreamProgram, semKey: string) {
    setPopoverFor(null);
    setAddingId(program.id);
    try {
      addDoDreamTaskLocal(program, semKey);
      const updated = await addTaskFromDoDream(program.id);
      setRoadmap(updated);
      await logBehavior({ type: 'DODREAM_ADD', targetId: program.id, at: new Date().toISOString() });
      showToast(`"${program.title}" 로드맵에 추가됨`, {
        label: '로드맵 보기',
        onClick: () => navigate('/roadmap'),
      });
    } catch {
      showToast('추가 실패');
    } finally {
      setAddingId(null);
    }
  }

  // Filtered + sorted programs
  const gapRelatedKeys = Object.entries(gapStatuses)
    .filter(([, v]) => v !== 'MET')
    .map(([k]) => k as GapKey);

  const filtered = programs
    .filter(p => {
      if (selectedCategories.size > 0 && !selectedCategories.has(p.category)) return false;
      if (creditOnly && !p.creditLinked) return false;
      if (
        gapRelated &&
        gapRelatedKeys.length > 0 &&
        !p.relatedGapKeys.some(k => gapRelatedKeys.includes(k))
      )
        return false;
      if (availableOnly) {
        const diff = new Date(p.applyDeadline).getTime() - Date.now();
        if (diff < 0) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'gain') return b.expectedGain - a.expectedGain;
      return new Date(a.applyDeadline).getTime() - new Date(b.applyDeadline).getTime();
    });

  const currentSemester = roadmap?.currentSemester ?? '2026-2';

  return (
    <PageShell title="학사·비교과 연계">
      {/* Dark banner */}
      <div className="bg-ink text-white rounded-2xl p-6 mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-warn" />
          <h2 className="text-lg font-bold">두드림 프로그램</h2>
        </div>
        <p className="text-sm text-gray-400">내 부족 역량 기준으로 정렬됨 · 세종대학교 비교과 프로그램 연계</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 space-y-3">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategories(s => {
                  const next = new Set(s);
                  if (next.has(cat)) next.delete(cat);
                  else next.add(cat);
                  return next;
                })
              }
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                selectedCategories.has(cat)
                  ? CATEGORY_COLORS[cat] + ' font-semibold'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Toggle filters + sort */}
        <div className="flex flex-wrap items-center gap-3">
          {(
            [
              { label: '학점 연계만', value: creditOnly, set: setCreditOnly },
              { label: '내 부족 역량 관련만', value: gapRelated, set: setGapRelated },
              { label: '신청 가능만', value: availableOnly, set: setAvailableOnly },
            ] as const
          ).map(({ label, value, set }) => (
            <button
              key={label}
              onClick={() => set(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                value
                  ? 'bg-primary text-white border-primary'
                  : 'border-gray-200 text-gray-600 hover:border-primary'
              }`}
            >
              {value && <Check size={11} />}
              {label}
            </button>
          ))}
          <div className="ml-auto flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {(['gain', 'deadline'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortMode(s)}
                className={`px-3 py-1.5 ${
                  sortMode === s ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'gain' ? '효과순' : '마감임박순'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Programs grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-5 bg-gray-100 rounded w-2/3" />
              <div className="h-12 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState title="프로그램 불러오기 실패" onRetry={load} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">조건에 맞는 프로그램이 없습니다</p>
          <button
            onClick={() => {
              setSelectedCategories(new Set());
              setCreditOnly(false);
              setGapRelated(false);
              setAvailableOnly(false);
            }}
            className="mt-3 text-xs text-primary hover:underline"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(program => {
            const dday = getDDay(program.applyDeadline);
            const isAdded = dodreamAddedIds.has(program.id);
            const isAdding = addingId === program.id;
            const liveCapacity = dodreamCapacities[program.id];
            const capacity =
              liveCapacity !== undefined && program.capacity
                ? { ...program.capacity, current: liveCapacity }
                : program.capacity;
            const capPercent = capacity ? Math.round((capacity.current / capacity.max) * 100) : 0;
            const isAlmostFull = capPercent >= 80;

            return (
              <div
                key={program.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-primary/30 transition-colors"
              >
                {/* Category + title */}
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[program.category]}`}
                    >
                      {program.category}
                    </span>
                    {program.creditLinked && (
                      <span className="text-[11px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <BookOpen size={9} /> 학점 연계
                      </span>
                    )}
                    {isAlmostFull && (
                      <span className="text-[11px] bg-red-50 text-danger border border-red-200 px-2 py-0.5 rounded-full">
                        마감 임박
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-ink">{program.title}</p>
                </div>

                {/* Reason headline */}
                <div className="bg-amber-50 border-l-4 border-warn px-3 py-2 rounded-r-lg">
                  <p className="text-xs font-medium text-ink">💡 {program.reason.headline}</p>
                </div>

                {/* Related gap chips */}
                <div className="flex flex-wrap gap-1.5">
                  {program.relatedGapKeys.map(key => {
                    const status = gapStatuses[key] ?? 'MET';
                    return (
                      <span
                        key={key}
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${GAP_STATUS_CHIP[status]}`}
                      >
                        {GAP_LABELS[key]}
                      </span>
                    );
                  })}
                </div>

                {/* Capacity + deadline */}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span
                    className={`flex items-center gap-1 ${dday.urgent ? 'text-danger font-semibold' : ''}`}
                  >
                    <Calendar size={12} /> {dday.label}
                  </span>
                  {capacity && (
                    <div className="flex items-center gap-2 flex-1">
                      <Users size={12} />
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            capPercent >= 80 ? 'bg-danger' : 'bg-primary'
                          }`}
                          style={{ width: `${capPercent}%` }}
                        />
                      </div>
                      <span>
                        {capacity.current}/{capacity.max}명
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-auto pt-1">
                  <a
                    href={program.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      logBehavior({
                        type: 'DODREAM_ADD',
                        targetId: program.id,
                        at: new Date().toISOString(),
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1 text-xs bg-ink text-white rounded-lg py-2 hover:bg-gray-800"
                  >
                    두드림 신청 <ExternalLink size={11} />
                  </a>

                  <div className="relative flex-1" onClick={e => e.stopPropagation()}>
                    {isAdded ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-1 text-xs bg-green-50 text-success border border-green-200 rounded-lg py-2 cursor-default"
                      >
                        <Check size={11} /> 로드맵에 있음
                      </button>
                    ) : (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setPopoverFor(v => (v === program.id ? null : program.id));
                        }}
                        disabled={isAdding}
                        className="w-full flex items-center justify-center gap-1 text-xs border border-primary text-primary rounded-lg py-2 hover:bg-primary-light disabled:opacity-50"
                      >
                        {isAdding ? (
                          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus size={11} /> 로드맵에 추가
                          </>
                        )}
                      </button>
                    )}

                    {popoverFor === program.id && !isAdded && (
                      <AddToRoadmapPopover
                        currentSemester={currentSemester}
                        onAdd={semKey => handleAddToRoadmap(program, semKey)}
                      />
                    )}
                  </div>

                  {/* +%p */}
                  <GainBadge gain={program.expectedGain} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

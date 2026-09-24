import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, Map, GraduationCap, Compass, ChevronRight } from 'lucide-react';
import { useRoadmapStore, useUserStore } from '@/store';
import { selectCurrentSemesterTasks } from '@/store/selectors';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: '대시보드' },
  { to: '/diagnosis', icon: Search, label: '스펙 진단 & 갭' },
  { to: '/roadmap', icon: Map, label: '커리어 로드맵' },
  { to: '/dodream', icon: GraduationCap, label: '학사·비교과 연계' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const roadmap = useRoadmapStore(s => s.roadmap);
  const target = useUserStore(s => s.target);

  const currentMatchRate = roadmap?.currentMatchRate ?? 0;
  const targetMatchRate = roadmap?.targetMatchRate ?? 100;
  const progressPct = targetMatchRate > 0 ? Math.round((currentMatchRate / targetMatchRate) * 100) : 0;

  const currentTasks = roadmap ? selectCurrentSemesterTasks(roadmap) : [];
  const remaining = currentTasks.filter(t => t.status !== 'DONE' && t.status !== 'SKIPPED').length;

  return (
    <aside className="fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-200 z-40 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <Compass size={16} className="text-white" />
        </div>
        <span className="text-sm font-bold text-ink leading-tight">
          Sejong<br />Compass
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-light text-primary border-l-[3px] border-primary pl-[9px]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-ink'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Mini Progress Widget */}
      {roadmap && (
        <div
          className="mx-3 mb-3 p-3 rounded-xl bg-background border border-gray-100 cursor-pointer hover:border-primary transition-colors"
          onClick={() => navigate('/roadmap')}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                {target ? `${target.targetCompany} ${target.targetRole}` : '목표 미설정'}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-primary tabular-nums">{currentMatchRate}%</span>
                <span className="text-xs text-gray-400">→</span>
                <span className="text-xs text-gray-500 tabular-nums">{targetMatchRate}%</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-gray-400" />
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            이번 학기 남은 할 일 <span className="font-semibold text-ink">{remaining}개</span>
          </p>
        </div>
      )}

      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 text-center">세종대학교 맞춤형 커리어 가이드</p>
      </div>
    </aside>
  );
}

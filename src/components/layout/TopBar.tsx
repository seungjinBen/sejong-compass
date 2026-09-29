import { useState, useRef, useEffect } from 'react';
import { Bell, ExternalLink, ChevronDown, Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore, useUIStore } from '@/store';
import { getActiveScenario, setActiveScenario, scenarios } from '@/mocks/scenarios';
import type { ScenarioId } from '@/mocks/scenarios';

const KIND_LABELS: Record<string, { label: string; className: string }> = {
  INTERN: { label: '인턴십', className: 'bg-blue-100 text-blue-700' },
  BOOTCAMP: { label: '부트캠프', className: 'bg-purple-100 text-purple-700' },
  JOB: { label: '공채', className: 'bg-primary-light text-primary' },
  DODREAM: { label: '두드림', className: 'bg-green-100 text-success' },
};

const isDev = import.meta.env.DEV;

interface TopBarProps {
  title: string;
  breadcrumb?: string[];
  onMenuClick?: () => void;
}

export function TopBar({ title, breadcrumb, onMenuClick }: TopBarProps) {
  const [bellOpen, setBellOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const scenarioRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const profile = useUserStore(s => s.profile);
  const logout = useUserStore(s => s.logout);
  const { opportunities, readOppIds, markOppRead } = useUIStore();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }
  const unread = opportunities.filter(o => !readOppIds.has(o.id) && !o.read).length;
  const currentScenario = getActiveScenario();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (scenarioRef.current && !scenarioRef.current.contains(e.target as Node)) setScenarioOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleScenarioChange(id: ScenarioId) {
    setActiveScenario(id);
    localStorage.removeItem('sc:profile');
    localStorage.removeItem('sc:task_status');
    localStorage.removeItem('sc:roadmap');
    localStorage.removeItem('sc:user');
    window.location.href = '/dashboard';
  }

  return (
    <header className="fixed top-0 left-0 lg:left-60 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-gray-500 hover:text-ink hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="메뉴 열기"
          >
            <Menu size={20} />
          </button>
        )}

        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span className={i === breadcrumb.length - 1 ? 'font-semibold text-ink' : ''}>{crumb}</span>
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-base font-semibold text-ink">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* DEV scenario switcher */}
        {isDev && (
          <div className="relative" ref={scenarioRef}>
            <button
              onClick={() => setScenarioOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 hover:border-primary hover:text-primary transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warn" />
              {scenarios[currentScenario].label}
              <ChevronDown size={12} />
            </button>
            {scenarioOpen && (
              <div className="absolute right-0 top-8 w-44 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                {(Object.keys(scenarios) as ScenarioId[]).map(id => (
                  <button
                    key={id}
                    onClick={() => handleScenarioChange(id)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${id === currentScenario ? 'text-primary font-semibold' : 'text-gray-700'}`}
                  >
                    {scenarios[id].label}
                  </button>
                ))}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => {
                      import('@/mocks/realtime').then(m => {
                        const addOpp = useUIStore.getState().addOpportunity;
                        const updateCap = useUIStore.getState().updateDoDreamCapacity;
                        m.triggerImmediateNotification(addOpp, updateCap);
                      });
                      setScenarioOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-warn hover:bg-amber-50"
                  >
                    알림 즉시 발생
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {profile && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              <span className="font-medium text-ink">{profile.name}</span>
              <span className="ml-1 text-xs text-gray-400">{profile.gradeYear}학년 {profile.semester}학기</span>
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="로그아웃"
              title="로그아웃"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}

        {/* Bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen(v => !v)}
            className="relative p-2 text-gray-500 hover:text-ink hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="알림"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">실시간 기회 알림</p>
                {unread > 0 && <span className="text-xs text-primary">{unread}개 미읽음</span>}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {opportunities.length === 0 ? (
                  <p className="text-sm text-gray-400 p-4 text-center">알림이 없습니다</p>
                ) : (
                  opportunities.map(opp => {
                    const isRead = readOppIds.has(opp.id) || opp.read;
                    const kind = KIND_LABELS[opp.kind] ?? { label: opp.kind, className: 'bg-gray-100 text-gray-700' };
                    return (
                      <div
                        key={opp.id}
                        className={`px-4 py-3 flex items-start gap-3 ${!isRead ? 'bg-primary-light/30' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${kind.className}`}>
                              {kind.label}
                            </span>
                            {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                          </div>
                          <p className="text-xs font-medium text-ink">{opp.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{opp.reasonHeadline}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {opp.kind === 'DODREAM' && (
                            <button
                              onClick={() => { markOppRead(opp.id); setBellOpen(false); navigate('/dodream'); }}
                              className="text-[11px] text-success hover:underline"
                            >
                              두드림
                            </button>
                          )}
                          <a
                            href={opp.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markOppRead(opp.id)}
                            className="text-[11px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            {opp.ctaLabel} <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

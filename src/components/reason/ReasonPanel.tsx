import { useState } from 'react';
import { ChevronDown, ChevronUp, Lightbulb, BarChart2, GitBranch } from 'lucide-react';
import type { Reason } from '@/types';
import { GainBadge } from '@/components/common/GainBadge';
import { TaskTypeIcon } from '@/components/common/TaskTypeIcon';

interface ReasonPanelProps {
  reason: Reason;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  onExpand?: () => void;
  className?: string;
}

export function ReasonPanel({
  reason,
  collapsible = true,
  defaultExpanded = false,
  onExpand,
  className = '',
}: ReasonPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  function toggle() {
    if (!expanded && onExpand) onExpand();
    setExpanded(v => !v);
  }

  return (
    <div className={`rounded-xl overflow-hidden border border-amber-200 ${className}`}>
      {/* Headline — always visible */}
      <button
        className="w-full text-left bg-amber-50 border-l-4 border-warn px-4 py-3 flex items-start gap-2"
        onClick={collapsible ? toggle : undefined}
        aria-expanded={expanded}
      >
        <Lightbulb size={16} className="text-warn shrink-0 mt-0.5" />
        <p className="text-sm font-medium text-ink flex-1">{reason.headline}</p>
        {collapsible && (
          expanded
            ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-0.5" />
            : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        )}
      </button>

      {(!collapsible || expanded) && (
        <div className="bg-white border-t border-amber-100">
          {/* Metrics table */}
          {reason.metrics.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-1.5 mb-2">
                <BarChart2 size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">정량 근거</span>
              </div>
              <div className="space-y-1.5">
                {reason.metrics.map((m, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{m.label}</span>
                    <span className="text-xs font-semibold text-ink">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidences */}
          {reason.evidences && reason.evidences.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">내 근거 출처</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reason.evidences.map((ev, i) => (
                  <span key={i} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {ev.label} ({Math.round(ev.weight * 100)}%)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {reason.alternatives && reason.alternatives.length > 0 && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <GitBranch size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">대안 처방</span>
              </div>
              <div className="space-y-2">
                {reason.alternatives.map((alt, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 hover:border-gray-200">
                    <TaskTypeIcon type={alt.type} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{alt.title}</p>
                      {alt.constraint && <p className="text-[11px] text-gray-400">{alt.constraint}</p>}
                    </div>
                    <GainBadge gain={alt.expectedGain} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

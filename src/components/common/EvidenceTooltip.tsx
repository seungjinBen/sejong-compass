import { useState } from 'react';
import type { Evidence } from '@/types';

interface EvidenceTooltipProps {
  evidences: Evidence[];
  children: React.ReactNode;
}

export function EvidenceTooltip({ evidences, children }: EvidenceTooltipProps) {
  const [visible, setVisible] = useState(false);

  if (evidences.length === 0) return <>{children}</>;

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-ink text-white rounded-xl shadow-lg p-3 pointer-events-none">
          <p className="text-xs font-semibold mb-2 text-gray-300">출처 추적</p>
          <div className="space-y-1.5">
            {evidences.map((ev, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-300 truncate">{ev.label}</span>
                <span className="text-[11px] font-semibold text-white shrink-0">
                  {Math.round(ev.weight * 100)}%
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-ink" />
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

interface MatchRateRingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  label?: string;
}

const SIZE_MAP = {
  sm: { wh: 56, stroke: 4, fontSize: 'text-sm' },
  md: { wh: 80, stroke: 5, fontSize: 'text-xl' },
  lg: { wh: 112, stroke: 6, fontSize: 'text-3xl' },
};

export function MatchRateRing({ value, max = 100, size = 'md', animated = true, label }: MatchRateRingProps) {
  const [displayed, setDisplayed] = useState(animated ? 0 : value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animated) {
      setDisplayed(value);
      return;
    }
    const duration = 600;
    const start = performance.now();
    const from = 0;
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (value - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, animated]);

  const { wh, stroke, fontSize } = SIZE_MAP[size];
  const radius = (wh - stroke * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(Math.max(value / max, 0), 1);
  const offset = circumference * (1 - percent);
  const cx = wh / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-block" style={{ width: wh, height: wh }}>
        <svg width={wh} height={wh} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={cx} cy={cx} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="#C8102E"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: animated ? 'stroke-dashoffset 0.6s ease' : 'none' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${fontSize} font-bold text-primary tabular-nums`}>{displayed}</span>
        </div>
      </div>
      {label && <span className="text-xs text-gray-500">{label}</span>}
    </div>
  );
}

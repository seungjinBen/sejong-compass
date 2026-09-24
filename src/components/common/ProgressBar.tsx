interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'success' | 'warning';
  showLabel?: boolean;
}

const COLOR_MAP = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
};

export function ProgressBar({ value, max = 100, className = '', color = 'primary', showLabel = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${COLOR_MAP[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 mt-1">{pct}%</span>
      )}
    </div>
  );
}

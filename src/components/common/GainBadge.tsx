interface GainBadgeProps {
  gain: number;
  className?: string;
}

export function GainBadge({ gain, className = '' }: GainBadgeProps) {
  if (!gain) return null;
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold text-success bg-green-50 border border-green-200 rounded-full px-2 py-0.5 ${className}`}
    >
      +{gain}%p
    </span>
  );
}

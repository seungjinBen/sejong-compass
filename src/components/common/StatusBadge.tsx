import type { TaskStatus } from '@/types';

type BadgeStatus = 'MET' | 'PARTIAL' | 'LACK' | TaskStatus;

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

const CONFIG: Record<BadgeStatus, { label: string; className: string }> = {
  MET: { label: '충족', className: 'bg-green-100 text-success border border-green-200' },
  PARTIAL: { label: '부족', className: 'bg-yellow-100 text-warning border border-yellow-200' },
  LACK: { label: '미달', className: 'bg-red-100 text-danger border border-red-200' },
  DONE: { label: '완료', className: 'bg-green-100 text-success border border-green-200' },
  IN_PROGRESS: { label: '진행중', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
  TODO: { label: '예정', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
  SKIPPED: { label: '건너뜀', className: 'bg-gray-100 text-gray-400 border border-gray-200' },
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const { label, className: baseClass } = CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${baseClass} ${className}`}>
      {label}
    </span>
  );
}

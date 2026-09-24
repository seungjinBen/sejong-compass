import {
  BookOpen,
  Award,
  FolderGit2,
  Sparkles,
  Code2,
  Languages,
  Briefcase,
  CalendarCheck,
} from 'lucide-react';
import type { TaskType } from '@/types';

const CONFIG: Record<TaskType, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  COURSE: { icon: BookOpen, bg: 'bg-teal-100', text: 'text-teal-700', label: '수업' },
  CERT: { icon: Award, bg: 'bg-blue-100', text: 'text-blue-700', label: '자격증' },
  PROJECT: { icon: FolderGit2, bg: 'bg-pink-100', text: 'text-pink-700', label: '프로젝트' },
  DODREAM: { icon: Sparkles, bg: 'bg-amber-100', text: 'text-amber-700', label: '두드림' },
  CODING_TEST: { icon: Code2, bg: 'bg-violet-100', text: 'text-violet-700', label: '코테' },
  LANGUAGE: { icon: Languages, bg: 'bg-cyan-100', text: 'text-cyan-700', label: '어학' },
  INTERN: { icon: Briefcase, bg: 'bg-orange-100', text: 'text-orange-700', label: '인턴' },
  EVENT: { icon: CalendarCheck, bg: 'bg-gray-100', text: 'text-gray-600', label: '일정' },
};

interface TaskTypeIconProps {
  type: TaskType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function TaskTypeIcon({ type, size = 'md', showLabel = false }: TaskTypeIconProps) {
  const { icon: Icon, bg, text, label } = CONFIG[type] ?? CONFIG['EVENT'];
  const iconSize = size === 'sm' ? 12 : 16;
  const padding = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`${bg} ${padding} rounded-lg shrink-0`}>
        <Icon size={iconSize} className={text} />
      </div>
      {showLabel && <span className={`text-xs font-medium ${text}`}>{label}</span>}
    </div>
  );
}

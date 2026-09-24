import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = '불러오기 실패', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertTriangle size={32} className="text-danger mb-2" />
      <p className="text-sm font-semibold text-ink mb-1">{title}</p>
      {message && <p className="text-xs text-gray-500 mb-3">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:border-primary hover:text-primary transition-colors"
        >
          <RefreshCw size={12} /> 다시 시도
        </button>
      )}
    </div>
  );
}

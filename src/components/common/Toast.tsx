import { CheckCircle, X } from 'lucide-react';
import { useUIStore } from '@/store';

export function ToastContainer() {
  const { toasts, dismissToast } = useUIStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="flex items-center gap-3 bg-ink text-white px-4 py-3 rounded-xl shadow-lg pointer-events-auto max-w-sm"
          style={{ animation: 'slideIn 0.2s ease' }}
        >
          <CheckCircle size={16} className="text-success shrink-0" />
          <span className="text-sm flex-1">{toast.message}</span>
          {toast.action && (
            <button
              onClick={() => { toast.action?.onClick(); dismissToast(toast.id); }}
              className="text-xs text-warn hover:underline shrink-0"
            >
              {toast.action.label}
            </button>
          )}
          <button onClick={() => dismissToast(toast.id)} className="text-gray-400 hover:text-white shrink-0">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// Legacy compat — existing pages may import Toast
export function Toast() {
  return null;
}

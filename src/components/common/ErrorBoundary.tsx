import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <AlertTriangle size={40} className="text-danger mb-3" />
          <p className="text-base font-semibold text-ink mb-1">오류가 발생했습니다</p>
          <p className="text-sm text-gray-500 mb-4 max-w-xs">{this.state.error.message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
          >
            <RefreshCw size={14} /> 새로고침
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

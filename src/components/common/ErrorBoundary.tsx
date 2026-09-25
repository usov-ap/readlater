import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // В продакшене логируем ошибку в систему мониторинга, если подключена
    console.error('Неперехваченная ошибка в приложении:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/inbox';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fcfbf9] dark:bg-[#121417] text-neutral-900 dark:text-neutral-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/40">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Что-то пошло не так
            </h1>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Произошла непредвиденная ошибка в интерфейсе. Ваши сохранённые ссылки в безопасности.
            </p>

            {this.state.error?.message && (
              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg text-xs font-mono text-neutral-500 dark:text-neutral-400 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="primary" onClick={this.handleReload} className="w-full sm:w-auto">
                <RefreshCw className="w-4 h-4 mr-1.5" />
                <span>Обновить страницу</span>
              </Button>

              <Button variant="outline" onClick={this.handleReset} className="w-full sm:w-auto">
                <Home className="w-4 h-4 mr-1.5" />
                <span>Вернуться в Inbox</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginScreen } from './LoginScreen';

/** Показывает экран входа, пока пароль не проверен. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf9] dark:bg-[#121417]">
        <div className="animate-pulse font-mono text-xs text-neutral-400">
          Проверка доступа...
        </div>
      </div>
    );
  }

  if (status === 'locked') {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

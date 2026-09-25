import { Loader2, Lock } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function LoginScreen() {
  const { login, isSubmitting, error } = useAuth();
  const [password, setPasswordValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isSubmitting) return;
    await login(password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfbf9] dark:bg-[#121417] text-neutral-900 dark:text-neutral-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 sm:p-8 space-y-5"
      >
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">ReadLater</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Введите пароль для входа
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="readlater-password"
            className="block text-xs font-medium text-neutral-600 dark:text-neutral-400"
          >
            Пароль
          </label>
          <input
            id="readlater-password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPasswordValue(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full justify-center"
          disabled={isSubmitting || !password}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              <span>Проверка...</span>
            </>
          ) : (
            <span>Войти</span>
          )}
        </Button>
      </form>
    </div>
  );
}

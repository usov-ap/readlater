import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_BASE_URL, clearPassword, getPassword, isApiMode, setPassword } from '../lib/auth';

type AuthStatus = 'loading' | 'locked' | 'ready';

interface AuthContextType {
  status: AuthStatus;
  /** true, если на бэкенде задан APP_PASSWORD (нужно показывать кнопку «Выйти»). */
  isRequired: boolean;
  isSubmitting: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

interface AuthStatusResponse {
  required: boolean;
  authenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchAuthStatus(password: string): Promise<AuthStatusResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/status`, {
    headers: password ? { Authorization: `Bearer ${password}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Auth status request failed: ${res.status}`);
  }
  return (await res.json()) as AuthStatusResponse;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Без API (localStorage-режим) защита не применяется.
  const [status, setStatus] = useState<AuthStatus>(isApiMode ? 'loading' : 'ready');
  const [isRequired, setIsRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверяем сохранённый пароль при старте.
  useEffect(() => {
    if (!isApiMode) return;
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchAuthStatus(getPassword());
        if (cancelled) return;
        setIsRequired(data.required);
        setStatus(data.required && !data.authenticated ? 'locked' : 'ready');
      } catch {
        // Бэкенд недоступен — не блокируем интерфейс: данные всё равно не загрузятся.
        if (!cancelled) setStatus('ready');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Любой ответ 401 от API означает, что пароль неверен или устарел.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearPassword();
      setIsRequired(true);
      setStatus('locked');
    };
    window.addEventListener('readlater:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('readlater:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (password: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const data = await fetchAuthStatus(password);
      if (!data.required || data.authenticated) {
        setPassword(password);
        setIsRequired(data.required);
        setStatus('ready');
        return true;
      }
      setError('Неверный пароль');
      return false;
    } catch {
      setError('Не удалось связаться с сервером');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearPassword();
    setStatus('locked');
  }, []);

  return (
    <AuthContext.Provider value={{ status, isRequired, isSubmitting, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

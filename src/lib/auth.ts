/**
 * Простая защита паролем: один общий пароль из APP_PASSWORD на бэкенде.
 * Пароль хранится в localStorage и отправляется в заголовке Authorization.
 * Если VITE_API_BASE_URL не задан, приложение работает на localStorage без бэкенда
 * и защита не применяется.
 */

const STORAGE_KEY = 'readlater_auth_token';

const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined;

export const API_BASE_URL = (envUrl || '/api').replace(/\/$/, '');

/** true, когда приложение общается с Go API (а значит, возможна защита паролем). */
export const isApiMode = Boolean(envUrl);

export function getPassword(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setPassword(password: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, password);
  } catch {
    // ignore (private mode / disabled storage)
  }
}

export function clearPassword(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Заголовки авторизации для запросов к API. */
export function authHeaders(): Record<string, string> {
  const password = getPassword();
  return password ? { Authorization: `Bearer ${password}` } : {};
}

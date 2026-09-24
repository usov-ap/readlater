/**
 * Форматирует ISO timestamp в читаемый относительный формат на русском
 */
export function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffSec < 45) return 'только что';
    if (diffMin < 60) return `${diffMin} мин назад`;
    if (diffHour < 24) return `${diffHour} ч назад`;
    if (diffDay === 1) return 'вчера';
    if (diffDay < 30) return `${diffDay} дн назад`;
    if (diffMonth < 12) return `${diffMonth} мес назад`;
    return `${diffYear} г назад`;
  } catch {
    return dateStr;
  }
}

/**
 * Форматирует полную понятную дату (например, 24 сент. 2026 г.)
 */
export function formatFullDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Генерирует уникальный ID
 */
export function generateId(): string {
  return 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

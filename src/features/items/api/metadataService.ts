import { detectItemType, getFaviconUrl, getSiteName, isValidWebUrl, normalizeUrl } from '../../../lib/url';
import { ItemType } from '../../../types/item';

export interface FetchedMetadata {
  url: string;
  normalizedUrl: string;
  title: string;
  description: string;
  siteName: string;
  faviconUrl: string;
  imageUrl?: string;
  type: ItemType;
  author?: string;
  publishedAt?: string;
}

/**
 * Извлечение метаданных без блокировки сохранения
 */
export async function extractMetadata(rawUrl: string): Promise<FetchedMetadata> {
  if (!isValidWebUrl(rawUrl)) {
    throw new Error('Пожалуйста, введите корректный HTTP или HTTPS URL');
  }

  const normalized = normalizeUrl(rawUrl);
  const parsed = new URL(normalized);
  const siteName = getSiteName(normalized);
  const detectedType = detectItemType(normalized);
  const favicon = getFaviconUrl(normalized);

  // Определение названия страницы из URL
  const pathParts = parsed.pathname.split('/').filter(Boolean);
  let derivedTitle = '';

  if (parsed.hostname.includes('github.com') && pathParts.length >= 2) {
    const [owner, repo, sub1, sub2] = pathParts;
    if (sub1 === 'issues' || sub1 === 'pull') {
      derivedTitle = `${owner}/${repo} #${sub2 || ''}`;
    } else {
      derivedTitle = `${owner}/${repo}: Репозиторий GitHub`;
    }
  } else if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    const cleaned = lastPart
      .replace(/\.(html|php|md|htm)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (cleaned.length > 0) {
      derivedTitle = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  if (!derivedTitle) {
    derivedTitle = siteName !== 'Web' ? `${siteName} — ${parsed.hostname}` : parsed.hostname;
  }

  const derivedDescription = `Материал с сайта ${parsed.hostname}${parsed.pathname !== '/' ? parsed.pathname : ''}`;

  return {
    url: rawUrl.trim(),
    normalizedUrl: normalized,
    title: derivedTitle,
    description: derivedDescription,
    siteName,
    faviconUrl: favicon,
    type: detectedType,
    author: siteName,
    publishedAt: new Date().toISOString(),
  };
}

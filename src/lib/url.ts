import { ItemType } from '../types/item';

const TRACKING_PARAMS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'ref',
  'ref_src',
  'ref_url',
  'source',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'yclid',
  'si',
];

/**
 * Validates whether string is a secure web URL (http or https)
 */
export function isValidWebUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') return false;
  const trimmed = urlString.trim();
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes URL for deduplication and clean saving
 */
export function normalizeUrl(urlString: string): string {
  try {
    const trimmed = urlString.trim();
    const url = new URL(trimmed);

    // Remove tracking query parameters
    TRACKING_PARAMS.forEach((param) => {
      url.searchParams.delete(param);
    });

    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();

    // Standardize pathname trailing slash
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1);
    }

    // Strip hash fragments for canonical matching
    url.hash = '';

    return url.toString();
  } catch {
    return urlString.trim();
  }
}

/**
 * Extracts friendly site name from URL
 */
export function getSiteName(urlString: string): string {
  try {
    const url = new URL(urlString);
    const host = url.hostname.replace(/^www\./, '');
    
    // Known domain mappings
    const KNOWN_DOMAINS: Record<string, string> = {
      'github.com': 'GitHub',
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'go.dev': 'Go.dev',
      'developer.mozilla.org': 'MDN Web Docs',
      'news.ycombinator.com': 'Hacker News',
      'theverge.com': 'The Verge',
      'x.com': 'X / Twitter',
      'twitter.com': 'Twitter',
      'threads.net': 'Threads',
      'reddit.com': 'Reddit',
      'medium.com': 'Medium',
      'substack.com': 'Substack',
      'nytimes.com': 'The New York Times',
      'bbc.com': 'BBC',
      'bloomberg.com': 'Bloomberg',
      'rust-lang.org': 'Rust Language',
      'kubernetes.io': 'Kubernetes Docs',
      'docker.com': 'Docker',
      'arxiv.org': 'arXiv',
      'wikipedia.org': 'Wikipedia',
    };

    if (KNOWN_DOMAINS[host]) {
      return KNOWN_DOMAINS[host];
    }

    // Capitalize first letter of base domain
    const parts = host.split('.');
    if (parts.length >= 2) {
      const base = parts[parts.length - 2];
      return base.charAt(0).toUpperCase() + base.slice(1);
    }

    return host;
  } catch {
    return 'Web';
  }
}

/**
 * Automatically infers ItemType based on URL structure
 */
export function detectItemType(urlString: string): ItemType {
  try {
    const url = new URL(urlString);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = url.pathname.toLowerCase();

    // GitHub
    if (host === 'github.com' || host === 'gist.github.com' || host === 'gitlab.com') {
      return 'github';
    }

    // Video
    if (
      host === 'youtube.com' ||
      host === 'youtu.be' ||
      host === 'vimeo.com' ||
      host === 'loom.com' ||
      host === 'twitch.tv' ||
      pathname.includes('/video/')
    ) {
      return 'video';
    }

    // Documentation
    if (
      host.startsWith('docs.') ||
      host.includes('developer.') ||
      host === 'devdocs.io' ||
      pathname.startsWith('/docs') ||
      pathname.startsWith('/doc') ||
      pathname.includes('/reference/') ||
      pathname.includes('/guide/') ||
      pathname.includes('/manual/') ||
      pathname.includes('/documentation/') ||
      host === 'go.dev' && pathname.includes('/doc') ||
      host === 'developer.mozilla.org'
    ) {
      return 'documentation';
    }

    // News
    if (
      host === 'news.ycombinator.com' ||
      host === 'nytimes.com' ||
      host === 'theverge.com' ||
      host === 'bbc.com' ||
      host === 'reuters.com' ||
      host === 'wsj.com' ||
      host === 'techcrunch.com' ||
      host === 'wired.com' ||
      host === 'arstechnica.com'
    ) {
      return 'news';
    }

    // Social Post
    if (
      host === 'x.com' ||
      host === 'twitter.com' ||
      host === 'threads.net' ||
      host === 'bsky.app' ||
      host === 'linkedin.com' ||
      host === 'mastodon.social'
    ) {
      return 'post';
    }

    return 'article';
  } catch {
    return 'other';
  }
}

/**
 * Generates best-guess favicon URL using Google Favicon API
 */
export function getFaviconUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`;
  } catch {
    return '';
  }
}

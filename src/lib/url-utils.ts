import LZString from 'lz-string';

/**
 * Pack data into a URL-safe compressed string
 */
export function pack<T>(data: T): string {
  const json = JSON.stringify(data);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Unpack a compressed string back to original data
 */
export function unpack<T>(compressedString: string): T | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(compressedString);
    if (!json) return null;
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Generate a shareable URL with compressed data
 */
export function generateShareableUrl(
  basePath: string,
  queryParams: Record<string, string>,
  hashData?: unknown
): string {
  const url = new URL(basePath, typeof window !== 'undefined' ? window.location.origin : 'https://paramhub.vercel.app');

  // Add query params (visible to crawlers)
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  // Add hash data (heavy payload, not sent to server)
  if (hashData) {
    url.hash = pack(hashData);
  }

  return url.toString();
}

/**
 * Parse URL data from current location
 */
export function parseUrlData<T = Record<string, string>, H = unknown>(
  searchParams: URLSearchParams,
  hash?: string
): { params: T; hashData: H | null } {
  const params = Object.fromEntries(searchParams.entries()) as T;

  let hashData: H | null = null;
  if (hash && hash.startsWith('#')) {
    hashData = unpack<H>(hash.slice(1));
  }

  return { params, hashData };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Format date for URL
 */
export function formatDateForUrl(date: Date): string {
  return date.toISOString().slice(0, 16);
}

/**
 * Parse date from URL
 */
export function parseDateFromUrl(dateString: string): Date {
  return new Date(dateString);
}

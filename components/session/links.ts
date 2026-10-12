import { BASE_PATH, SITE_URL } from '@/lib/paths';

/** Absolute, shareable URL that starts a session with the given settings query. */
export function sessionUrl(query: string): string {
  const root = typeof window !== 'undefined' ? `${window.location.origin}${BASE_PATH}` : SITE_URL;
  return `${root}/session/play/?${query}`;
}

/** Copies text to the clipboard, with a fallback for older browsers. */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to the legacy path
    }
  }
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

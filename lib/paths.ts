/**
 * Base path the site is served under ("/radiordle" on GitHub Pages, "" locally).
 * next/link and the router apply it automatically; plain <img>/next/image
 * sources and hand-built URLs must go through withBasePath().
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

/** Public site URL, used for metadata and share text. */
export const SITE_URL = 'https://ethanuser.github.io/radiordle';

/** Prefixes a root-relative public asset path ("/x.png") with the base path. */
export function withBasePath(path: string): string {
  if (!path.startsWith('/')) return path;
  return `${BASE_PATH}${path}`;
}

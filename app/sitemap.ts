import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/paths';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/session/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/about/`, changeFrequency: 'monthly', priority: 0.5 },
  ];
}

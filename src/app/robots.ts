import type { MetadataRoute } from 'next';

/**
 * Keep the whole thing out of search engines.
 *
 * This is one child's schoolwork, their writing and their voice recordings. A
 * public URL is needed to test it on a phone; being findable by strangers is
 * not, and the two are separable. Login already gates the data - this stops the
 * app from being discoverable in the first place.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}

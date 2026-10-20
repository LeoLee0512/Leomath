import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { publishedConcepts } from '../src/content/graph';
import { pageMeta, conceptImage, OG_IMAGE } from '../src/lib/seo';

describe('share images', () => {
  it('keeps the generic card for the home page', () => {
    expect(pageMeta('zh', '', '理解数学', {description:'首页'}).image).toEqual(OG_IMAGE);
  });
  it('every published concept has distinct, valid 1200 × 630 PNGs in both languages', () => {
    const hashes = new Set<string>();
    for (const concept of publishedConcepts()) for (const locale of ['zh', 'en'] as const) {
      const image = conceptImage(locale, concept.slug, concept.title[locale]);
      const meta = pageMeta(locale, `/concepts/${concept.slug}`, '', {description:concept.summary[locale], image});
      expect(meta.image).toEqual(image);
      expect(image.alt).toContain(concept.title[locale]);
      const png = readFileSync(new URL(`../public${image.url}`, import.meta.url));
      expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
      hashes.add(createHash('sha256').update(png).digest('hex'));
    }
    expect(hashes.size).toBe(publishedConcepts().length * 2);
  });
});

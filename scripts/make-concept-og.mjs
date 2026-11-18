// Regenerate committed concept cards after changing titles, summaries or paths.
// Requires Noto Sans CJK SC (e.g. fonts-noto-cjk on Debian); images ship as PNG,
// so production containers and social crawlers need no fonts or image renderer.
import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { publishedConcepts, paths } from '../src/content/graph.ts';

const fonts = execFileSync('fc-list', [':lang=zh', 'family'], { encoding: 'utf8' });
if (!fonts.includes('Noto Sans CJK SC')) throw new Error('Install Noto Sans CJK SC before regenerating concept cards.');
const escape = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));
function wrap(text, max) {
  const lines = []; let line = '', width = 0;
  for (const word of text.match(/[\p{Script=Han}]|[^\p{Script=Han}\s]+\s*|\s+/gu) ?? []) {
    const size = [...word].reduce((sum, char) => sum + (char.codePointAt(0) > 255 ? 1 : .56), 0);
    if (line && width + size > max) { lines.push(line.trim()); line = ''; width = 0; }
    line += word; width += size;
  }
  if (line) lines.push(line.trim());
  return lines;
}
const palette = ['#1f5cb8', '#1b6e45', '#8a6418', '#794790'];
let total = 0;
for (const c of publishedConcepts()) {
  const index = paths.findIndex(p => p.slug === c.path), path = paths[index];
  for (const locale of ['zh', 'en']) {
    const title = wrap(c.title[locale], 16), summary = wrap(c.summary[locale], 33);
    if (title.length > 2 || summary.length > 3) throw new Error(`Card needs a layout adjustment: ${c.slug}/${locale}`);
    const color = palette[Math.max(0, index) % palette.length];
    const chapter = path ? `${String(path.concepts.indexOf(c.slug) + 1).padStart(2, '0')} / ${String(path.concepts.length).padStart(2, '0')}` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
      <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#e8e3d8" stroke-width="1"/></pattern></defs>
      <rect width="1200" height="630" fill="#faf8f3"/><rect width="1200" height="630" fill="url(#grid)" opacity=".6"/>
      <rect width="12" height="630" fill="${color}"/>
      <g font-family="'Noto Sans CJK SC',sans-serif">
        <text x="76" y="82" font-size="34" font-weight="700" fill="#17191e">Leo<tspan fill="${color}">Math</tspan></text>
        <text x="1124" y="80" text-anchor="end" font-size="23" fill="#62666e">${escape(chapter)}</text>
        <text x="78" y="153" font-size="25" fill="${color}">${escape(path?.title[locale] ?? (locale === 'zh' ? '数学知识' : 'Mathematical ideas'))}</text>
        ${title.map((line,i)=>`<text x="74" y="${245+i*82}" font-size="64" font-weight="700" fill="#17191e">${escape(line)}</text>`).join('')}
        ${summary.map((line,i)=>`<text x="78" y="${397+i*42}" font-size="30" fill="#3a3d44">${escape(line)}</text>`).join('')}
        <path d="M78 531H1122" stroke="#cfc9bc"/>
        <text x="78" y="582" font-size="23" fill="#62666e">leomath.cn/${locale}/concepts/${escape(c.slug)}</text>
        <circle cx="1098" cy="575" r="6" fill="${color}"/>
      </g></svg>`;
    await mkdir(`public/og/concepts/${locale}`, {recursive:true});
    await sharp(Buffer.from(svg)).png().toFile(`public/og/concepts/${locale}/${c.slug}.png`);
    total++;
  }
}
console.log(`Generated ${total} concept cards (1200 × 630).`);

// Generates public/favicon.ico, public/apple-touch-icon.png and public/og.png from public/icon.svg.
// The outputs are committed; run again only when the logo or the share card changes:
//   node scripts/make-icons.mjs
// Uses sharp, which Next.js installs for image optimisation.
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const icon = await readFile("public/icon.svg");

// favicon.ico: an ICO container holding 16 × 16 and 32 × 32 PNGs.
const sizes = [16, 32];
const pngs = await Promise.all(sizes.map((s) => sharp(icon, { density: 384 }).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((png, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(sizes[i], e);
  header.writeUInt8(sizes[i], e + 1);
  header.writeUInt8(0, e + 2);
  header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(png.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += png.length;
});
await writeFile("public/favicon.ico", Buffer.concat([header, ...pngs]));

// Apple touch icon: square, opaque, 180 × 180.
await sharp(icon, { density: 768 }).resize(180, 180).flatten({ background: "#faf8f3" }).png().toFile("public/apple-touch-icon.png");

// Share card, 1200 × 630: the logo's grid and basis vectors, the name and the tagline in both languages.
const grid = [];
for (let x = 60; x <= 1140; x += 60) grid.push(`<path d="M${x} 0V630"/>`);
for (let y = 45; y <= 630; y += 60) grid.push(`<path d="M0 ${y}H1200"/>`);
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf8f3"/>
  <g stroke="#ebe6db" stroke-width="1">${grid.join("")}</g>
  <g transform="translate(930 330)">
    <path d="M0 0 L150 -90" stroke="#c2452d" stroke-width="10" stroke-linecap="round"/>
    <path d="M0 0 L-60 -150" stroke="#1f7a4d" stroke-width="10" stroke-linecap="round"/>
    <path d="M0 0 L150 -90 L90 -240 L-60 -150 Z" fill="#1f5cb8" fill-opacity="0.08" stroke="#1f5cb8" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 7"/>
    <circle r="11" fill="#17191e"/>
  </g>
  <text x="90" y="290" font-family="Georgia, 'Times New Roman', serif" font-size="112" font-weight="600" fill="#17191e">Leo<tspan fill="#1f5cb8">Math</tspan></text>
  <text x="94" y="380" font-family="'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', sans-serif" font-size="44" fill="#17191e">理解数学，而不只是记住它。</text>
  <text x="94" y="436" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-style="italic" fill="#3a3d44">Understand mathematics. Don't just memorise it.</text>
  <text x="94" y="552" font-family="'Microsoft YaHei', 'Segoe UI', sans-serif" font-size="26" fill="#6c7079">leomath.cn</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og.png");
console.log("wrote public/favicon.ico, public/apple-touch-icon.png, public/og.png");

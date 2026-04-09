// Preview: run FB-009 seed-to-primary for 10 seeds and show derived hex +
// corresponding live /theme/generate result. Not part of CI — diagnostic only.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
function seedToBigInt(seed) {
  let acc = 0n;
  const upper = seed.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const idx = ALPHABET.indexOf(upper[i]);
    acc = (acc << 5n) | BigInt(idx < 0 ? 0 : idx);
  }
  return acc;
}
function hslToHex(h, s, l) {
  const sN = s / 100, lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp < 1) [r1,g1,b1]=[c,x,0];
  else if (hp < 2) [r1,g1,b1]=[x,c,0];
  else if (hp < 3) [r1,g1,b1]=[0,c,x];
  else if (hp < 4) [r1,g1,b1]=[0,x,c];
  else if (hp < 5) [r1,g1,b1]=[x,0,c];
  else [r1,g1,b1]=[c,0,x];
  const m = lN - c/2;
  const to255 = v => Math.max(0, Math.min(255, Math.round((v + m) * 255)));
  const hex = n => n.toString(16).padStart(2,'0').toUpperCase();
  return `#${hex(to255(r1))}${hex(to255(g1))}${hex(to255(b1))}`;
}
function seedToPrimary(seed) {
  const big = seedToBigInt(seed);
  const top = Number((big >> 45n) & 0xfffffn);
  const mid = Number((big >> 22n) & 0xfffffn);
  const low = Number(big & 0xfffffn);
  return hslToHex(top % 360, 40 + (mid % 51), 25 + (low % 41));
}

const SEEDS = [
  'ABCDEFGHJKMNP', 'ZYXWVTSRQPNMK', '1234567890ABC', 'QPNMKJHGFEDCB',
  '0000000000000', 'ZZZZZZZZZZZZZ', 'A1B2C3D4E5F6G', 'N7P8Q9R0S1T2V',
  'W3X4Y5Z6J7K8M', 'H9G8F7E6D5C4B',
];

const BASE = 'https://color-palette-api-production-a68b.up.railway.app';
const KEY = 'cpa_live_frontenddev20260409aaaa1234';

console.log('seed          | derived primary | backend primary.500 | secondary.500 | accent.500');
console.log('--------------|-----------------|----------------------|---------------|-----------');
for (const seed of SEEDS) {
  const primary = seedToPrimary(seed);
  const res = await fetch(`${BASE}/api/v1/theme/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': KEY },
    body: JSON.stringify({ primary, seed, mode: 'both', semanticTokens: true }),
  });
  const j = await res.json();
  const p500 = j.primitive?.primary?.['500']?.hex ?? '?';
  const s500 = j.primitive?.secondary?.['500']?.hex ?? '?';
  const a500 = j.primitive?.accent?.['500']?.hex ?? '?';
  console.log(`${seed} | ${primary}         | ${p500}              | ${s500}       | ${a500}`);
}

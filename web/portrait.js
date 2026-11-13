// Procedural identification photographs: the same invented face drawn from the front and in left profile.
// Everything is derived from one parameter set, so the two views agree.

const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c) => '#' + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hx(a), B = hx(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
const dark = (c, t) => mix(c, '#000000', t), light = (c, t) => mix(c, '#ffffff', t);
const f1 = (n) => Math.round(n * 10) / 10;

// smooth closed or open curve through points (Catmull–Rom, as cubic Béziers)
function spline(p, closed = false) {
  const n = p.length, g = (i) => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
  let d = `M${f1(p[0][0])} ${f1(p[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + (closed ? 'Z' : '');
}
const poly = (p) => 'M' + p.map(q => `${f1(q[0])} ${f1(q[1])}`).join('L') + 'Z';

export const HAIR_NAMES = [['#0e0b09', 'black'], ['#17110d', 'black'], ['#1c1410', 'black'], ['#241812', 'dark brown'], ['#2a1d14', 'dark brown'], ['#3a281a', 'dark brown'], ['#4a3120', 'brown'], ['#6b4a2b', 'brown'], ['#8a6a3c', 'light brown'], ['#b8935a', 'dark blond'], ['#d9bd7c', 'blond'], ['#7a3b1e', 'red']];
export const EYE_NAMES = { '#5b7fa3': 'blue', '#6d8f6a': 'green', '#7a5a3a': 'brown', '#4d3a26': 'brown', '#8a9aa6': 'grey', '#5f7d8c': 'blue-grey', '#3a2616': 'dark brown', '#2e1e12': 'dark brown', '#4a301c': 'brown', '#5a3d22': 'brown', '#6d7a4a': 'hazel' };

// the face: every measurement the two drawings need
export function makeFace(r, look, sex, age) {
  const pick = (a) => a[Math.floor(r() * a.length)], rr = (a, b) => a + r() * (b - a);
  const male = sex === 'M', tex = pick(look.tex);
  const greyness = age < 38 ? 0 : Math.min(1, Math.max(0, (age - 38) / 34 + rr(-0.25, 0.25)));
  const baseHair = pick(look.hair);
  let style;
  if (male) {
    const baldP = Math.max(0, (age - 30) / 110);
    style = r() < baldP ? 'bald' : tex === 'coily' ? pick(['buzz', 'buzz', 'short', 'afro']) : pick(['buzz', 'short', 'short', 'side', 'side', 'medium', 'curly'].filter(s => s !== 'curly' || tex !== 'straight'));
    if (r() < 0.04) style = 'long';
  } else {
    style = tex === 'coily' ? pick(['afro', 'afro', 'short', 'bun', 'long']) : pick(['long', 'long', 'medium', 'medium', 'bun', 'pony', 'short', 'curly'].filter(s => s !== 'curly' || tex !== 'straight'));
  }
  const beard = male ? (r() < 0.52 ? 'none' : pick(['stubble', 'stubble', 'moustache', 'goatee', 'full', 'full'])) : 'none';
  const noseL = rr(27, 34), chinLen = male ? rr(27, 33) : rr(24, 29);
  const f = {
    sex, age, tex, style, beard, male,
    skin: pick(look.skin), eye: pick(look.eyes), hairBase: baseHair,
    hair: mix(baseHair, '#c9c6bf', greyness * 0.85), greyness,
    w: male ? rr(57, 65) : rr(54, 61), jaw: male ? rr(0.74, 0.9) : rr(0.62, 0.78), chinW: male ? rr(17, 24) : rr(12, 18),
    noseL, H: noseL + 12 + chinLen, noseW: rr(9, 14.5), nosePro: rr(11, 18), noseHump: rr(-1.5, 2.5), tipUp: rr(-1, 3),
    eyeGap: rr(25, 30), eyeW: rr(9.5, 12), eyeH: rr(3.6, 5.6), eyeTilt: rr(-1.5, 2.5), lidHeavy: r() < 0.3,
    browT: male ? rr(3, 5) : rr(1.8, 3.2), browTilt: rr(-2, 3), browR: male ? rr(1, 3.5) : rr(0, 1.5),
    mouthW: rr(17, 24), lipU: rr(2.2, 4.6), lipL: rr(3.2, 6), lipPro: rr(1, 4), chinPro: rr(-1, 4), smile: rr(-1.2, 1.5),
    ear: rr(0.85, 1.2), neckW: male ? rr(27, 34) : rr(21, 26), slope: rr(0, 5),
    hl: rr(36, 44) + (male ? Math.max(0, (age - 35) / 8) : 0), vol: 4, fringe: pick(['round', 'round', 'widow', 'part', 'part']),
    glasses: r() < 0.2 + (age > 50 ? 0.2 : 0), glassShape: pick(['rect', 'round']),
    shirt: pick(['#2f3a4a', '#4b4f55', '#6d5a48', '#3f4a3c', '#7b7f86', '#2a2a2e', '#59463f', '#8a8f97', '#3e3550']), collar: pick(['tee', 'shirt', 'shirt', 'jacket']),
    mole: r() < 0.14 ? [rr(-30, 30), rr(8, 45)] : null, phase: r() * 6.28, part: r() < 0.5 ? -1 : 1,
  };
  f.vol = { bald: 0, buzz: 2, short: 5, side: 6, medium: 9, long: 8, bun: 5, pony: 5, curly: 11, afro: rr(16, 26) }[style];
  if (!male && r() < 0.35 && (style === 'long' || style === 'medium')) f.fringe = 'bangs';
  f.bumpy = tex === 'coily' || tex === 'curly' || style === 'curly' || style === 'afro';
  f.hairName = style === 'bald' ? 'bald' : greyness > 0.7 ? 'grey' : greyness > 0.35 ? 'greying ' + (HAIR_NAMES.find(h => h[0] === baseHair)?.[1] || 'brown') : (HAIR_NAMES.find(h => h[0] === baseHair)?.[1] || 'brown');
  f.eyeName = EYE_NAMES[f.eye] || 'brown';
  f.hairDesc = { bald: 'bald', buzz: 'cropped', short: 'short', side: 'short, side parting', medium: male ? 'collar length' : 'bob, chin length', long: 'long', bun: 'long, worn up', pony: 'long, tied back', curly: 'curly', afro: 'natural, full' }[style];
  f.beardDesc = { none: male ? 'clean-shaven' : '', stubble: 'stubble', moustache: 'moustache', goatee: 'goatee', full: 'full beard' }[beard];
  return f;
}

let uid = 0;
const CX = 100, CY = 112;   // front view: middle of the face, eye line

function arc(cx, cy, rx, ry, a0, a1, n, bump = 0, k = 9, ph = 0) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, m = 1 + bump * Math.sin(k * a + ph) + bump * 0.5 * Math.sin(k * 2.3 * a + ph * 2); out.push([cx + rx * m * Math.cos(a), cy + ry * m * Math.sin(a)]); }
  return out;
}

export function front(f) {
  const id = 'p' + (++uid), { w, H } = f, jw = w * f.jaw, yT = CY - 64, cyS = CY - 12;
  const skin = f.skin, sh = dark(skin, 0.2), sh2 = dark(skin, 0.36), hi = light(skin, 0.14);
  const lip = mix(dark(skin, 0.12), '#a44a44', f.male ? 0.28 : 0.5), brow = dark(f.hair, f.greyness > 0.5 ? 0.25 : 0.1);
  const head = `M${f1(CX - w)} ${CY}C${f1(CX - w)} ${CY - 44} ${f1(CX - w * 0.74)} ${yT} ${CX} ${yT}C${f1(CX + w * 0.74)} ${yT} ${f1(CX + w)} ${CY - 44} ${f1(CX + w)} ${CY}`
    + `C${f1(CX + w)} ${f1(CY + H * 0.45)} ${f1(CX + jw)} ${f1(CY + H * 0.78)} ${f1(CX + f.chinW)} ${f1(CY + H * 0.97)}Q${CX} ${f1(CY + H * 1.06)} ${f1(CX - f.chinW)} ${f1(CY + H * 0.97)}`
    + `C${f1(CX - jw)} ${f1(CY + H * 0.78)} ${f1(CX - w)} ${f1(CY + H * 0.45)} ${f1(CX - w)} ${CY}Z`;
  let s = `<defs><clipPath id="${id}h"><path d="${head}"/></clipPath>
    <radialGradient id="${id}g" cx=".42" cy=".4" r=".75"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${skin}"/><stop offset="1" stop-color="${sh}"/></radialGradient></defs>`;
  const v = f.vol, bump = f.bumpy ? (f.style === 'afro' ? 0.035 : 0.022) : 0;

  // hair behind the head
  if (['long', 'medium', 'pony', 'bun'].includes(f.style) || (f.style === 'curly' && !f.male)) {
    const len = f.style === 'long' ? CY + H + 42 : f.style === 'medium' || f.style === 'curly' ? CY + H * (f.male ? 0.5 : 0.82) : CY + 20;
    const sp = f.style === 'long' ? 10 : 6;
    const pts = [[CX - w - v, cyS], ...arc(CX, cyS, w + v, 52 + v, Math.PI, 2 * Math.PI, 14, bump, 9, f.phase), [CX + w + v + sp * 0.4, (cyS + len) / 2], [CX + w + v + sp, len - 6], [CX + w * 0.5, len], [CX - w * 0.5, len], [CX - w - v - sp, len - 6], [CX - w - v - sp * 0.4, (cyS + len) / 2]];
    s += `<path d="${spline(pts, true)}" fill="${dark(f.hair, 0.18)}"/>`;
  }
  if (f.style === 'bun') s += `<circle cx="${CX}" cy="${yT - 8}" r="15" fill="${f.hair}"/><path d="M${CX - 12} ${yT - 4}q12 8 24 0" stroke="${dark(f.hair, 0.3)}" fill="none"/>`;

  // shoulders and clothes
  const sy = 196, n0 = f.neckW;
  s += `<path d="M${CX - n0} ${CY + H - 16}L${CX - n0 - 2} ${sy + 12}L${CX + n0 + 2} ${sy + 12}L${CX + n0} ${CY + H - 16}Z" fill="${sh}"/>`;
  s += `<path d="M${CX - n0} ${CY + H - 4}Q${CX} ${CY + H + 26} ${CX + n0} ${CY + H - 4}L${CX + n0} ${CY + H - 16}L${CX - n0} ${CY + H - 16}Z" fill="${sh2}" opacity=".55"/>`;
  s += `<path d="M6 250C10 214 46 204 ${CX - n0 - 6} ${sy}L${CX + n0 + 6} ${sy}C154 204 190 214 194 250Z" fill="${f.shirt}"/>`;
  if (f.collar === 'tee') s += `<path d="M${CX - n0 - 6} ${sy}Q${CX} ${sy + 26} ${CX + n0 + 6} ${sy}" fill="${sh}" stroke="${dark(f.shirt, 0.3)}" stroke-width="3"/>`;
  else {
    s += `<path d="M${CX - n0 - 6} ${sy}L${CX} ${sy + 34}L${CX + n0 + 6} ${sy}Z" fill="${f.collar === 'jacket' ? '#e9e6df' : sh}"/>`;
    s += `<path d="M${CX - n0 - 8} ${sy - 3}L${CX - 8} ${sy + 30}L${CX - n0 - 22} ${sy + 22}Z M${CX + n0 + 8} ${sy - 3}L${CX + 8} ${sy + 30}L${CX + n0 + 22} ${sy + 22}Z" fill="${f.collar === 'jacket' ? '#f4f2ec' : light(f.shirt, 0.12)}" stroke="${dark(f.shirt, 0.35)}" stroke-width=".8"/>`;
    if (f.collar === 'jacket') s += `<path d="M6 250C10 214 46 204 ${CX - n0 - 14} ${sy + 2}L${CX - 14} 250Z M194 250C190 214 154 204 ${CX + n0 + 14} ${sy + 2}L${CX + 14} 250Z" fill="${dark(f.shirt, 0.25)}"/>`;
  }

  // ears, head
  for (const sg of [-1, 1]) s += `<ellipse cx="${f1(CX + sg * (w + 2))}" cy="${CY + 10}" rx="${f1(7 * f.ear)}" ry="${f1(14 * f.ear)}" fill="${sh}"/><path d="M${f1(CX + sg * (w + 4))} ${CY + 2}q${sg * 3} 8 ${-sg} 16" stroke="${sh2}" fill="none" stroke-width="1.2"/>`;
  s += `<path d="${head}" fill="url(#${id}g)"/>`;
  // cheek and temple shading
  s += `<g clip-path="url(#${id}h)"><ellipse cx="${CX + w}" cy="${CY + 20}" rx="22" ry="60" fill="${sh2}" opacity=".28"/><ellipse cx="${CX - w}" cy="${CY + 24}" rx="14" ry="56" fill="${sh2}" opacity=".16"/>`;
  // beard
  const mY = CY + f.noseL + 12;
  if (f.beard === 'full' || f.beard === 'stubble') s += `<path d="M${CX - w - 2} ${CY + 14}Q${CX - w * 0.55} ${mY - 12} ${CX - 16} ${mY - 9}Q${CX} ${mY - 15} ${CX + 16} ${mY - 9}Q${CX + w * 0.55} ${mY - 12} ${CX + w + 2} ${CY + 14}L${CX + w + 4} ${CY + H + 12}L${CX - w - 4} ${CY + H + 12}Z" fill="${f.hair}" opacity="${f.beard === 'full' ? 0.93 : 0.26}"/>`;
  if (f.beard === 'goatee') s += `<ellipse cx="${CX}" cy="${mY + 12}" rx="${f1(f.mouthW * 0.82)}" ry="${f1(H - f.noseL - 12)}" fill="${f.hair}" opacity=".9"/>`;
  s += `</g>`;

  // top hair
  if (f.style !== 'bald') {
    const side = { buzz: 8, short: 10, side: 12, medium: 30, long: 34, bun: 10, pony: 10, curly: 20, afro: 22 }[f.style];
    const outer = [[CX - w - v * 0.5, cyS + side], ...arc(CX, cyS, w + v, 52 + v * 1.15, Math.PI, 2 * Math.PI, 26, bump, 11, f.phase), [CX + w + v * 0.5, cyS + side]];
    const hy = CY - f.hl, t = [[CX + w - 1.5, cyS + side], [CX + w - 3, CY - 16]];
    if (f.fringe === 'bangs') t.push([CX + w * 0.6, CY - 20], [CX, CY - 17], [CX - w * 0.6, CY - 20]);
    else if (f.fringe === 'widow') t.push([CX + w * 0.55, hy - 2], [CX + 8, hy + 1], [CX, hy + 6], [CX - 8, hy + 1], [CX - w * 0.55, hy - 2]);
    else if (f.fringe === 'part') t.push([CX + f.part * w * 0.62, hy + (f.part > 0 ? -6 : 8)], [CX + f.part * w * 0.3, hy - 8], [CX - f.part * w * 0.2, hy + 3], [CX - f.part * w * 0.62, hy + (f.part > 0 ? 9 : -5)]);
    else t.push([CX + w * 0.6, hy], [CX, hy - 5], [CX - w * 0.6, hy]);
    t.push([CX - w + 3, CY - 16], [CX - w + 1.5, cyS + side]);
    const d = spline(outer).replace(/^M/, 'M') + spline(t).replace(/^M/, 'L') + 'Z';
    s += `<path d="${d}" fill="${f.hair}" opacity="${f.style === 'buzz' ? 0.8 : 1}"/>`;
    // a few strands for texture
    if (!f.bumpy && f.style !== 'buzz') for (let i = -3; i <= 3; i++) s += `<path d="M${f1(CX + i * w * 0.24)} ${f1(hy - 2 + Math.abs(i) * 2)}Q${f1(CX + i * w * 0.3)} ${f1(yT - v * 0.4 + 6)} ${f1(CX + i * w * 0.17 + f.part * 6)} ${f1(yT - v + 3)}" stroke="${dark(f.hair, 0.35)}" stroke-width=".7" fill="none" opacity=".5"/>`;
  } else if (f.age > 30) {
    for (const sg of [-1, 1]) s += `<path d="${spline([[CX + sg * (w - 1), CY - 26], [CX + sg * (w + 3), CY - 8], [CX + sg * (w + 1.5), CY + 2], [CX + sg * (w - 3), CY - 6], [CX + sg * (w - 4), CY - 22]], true)}" fill="${f.hair}" opacity=".85"/>`;
  }

  // wrinkles
  const wr = Math.max(0, (f.age - 40) / 35);
  if (wr > 0) {
    s += `<g stroke="${sh2}" fill="none" stroke-width=".9" opacity="${f1(Math.min(0.75, wr))}">`;
    for (let i = 0; i < 2 + Math.round(wr * 2); i++) s += `<path d="M${CX - 22} ${CY - 22 - i * 5}q22 ${i % 2 ? 3 : -3} 44 0"/>`;
    for (const sg of [-1, 1]) s += `<path d="M${CX + sg * (f.noseW + 3)} ${CY + f.noseL - 4}q${sg * 7} 8 ${sg * 5} 20"/><path d="M${CX + sg * (f.eyeGap + f.eyeW + 2)} ${CY - 2}l${sg * 5} -2M${CX + sg * (f.eyeGap + f.eyeW + 2)} ${CY + 1}l${sg * 5} 2"/><path d="M${CX + sg * (f.eyeGap - 6)} ${CY + 8}q${sg * 7} 4 ${sg * 14} 0"/>`;
    s += `</g>`;
  }

  // brows, eyes
  for (const sg of [-1, 1]) {
    const ex = CX + sg * f.eyeGap, ew = f.eyeW, eh = f.eyeH, tl = sg * f.eyeTilt;
    s += `<path d="M${f1(ex - sg * (ew + 3))} ${f1(CY - 11 + f.browTilt * 0.4)}Q${f1(ex)} ${f1(CY - 15 - f.browT * 0.4 - f.browTilt)} ${f1(ex + sg * (ew + 4))} ${f1(CY - 11 + f.browTilt)}" stroke="${brow}" stroke-width="${f1(f.browT)}" fill="none" stroke-linecap="round" opacity=".92"/>`;
    const almond = `M${f1(ex - ew)} ${f1(CY + tl * 0.5)}Q${f1(ex)} ${f1(CY - eh * 1.9)} ${f1(ex + ew)} ${f1(CY - tl * 0.5)}Q${f1(ex)} ${f1(CY + eh * 1.35)} ${f1(ex - ew)} ${f1(CY + tl * 0.5)}Z`;
    s += `<clipPath id="${id}e${sg}"><path d="${almond}"/></clipPath><path d="${almond}" fill="#efe9df"/>`;
    s += `<g clip-path="url(#${id}e${sg})"><circle cx="${f1(ex)}" cy="${f1(CY - 0.4)}" r="${f1(eh * 1.12)}" fill="${f.eye}"/><circle cx="${f1(ex)}" cy="${f1(CY - 0.4)}" r="${f1(eh * 0.5)}" fill="#0b0907"/><circle cx="${f1(ex + 1.3)}" cy="${f1(CY - 1.6)}" r=".9" fill="#fff" opacity=".8"/><rect x="${ex - ew}" y="${CY - eh * 2}" width="${ew * 2}" height="${f1(eh * (f.lidHeavy ? 1.25 : 0.9))}" fill="${sh2}" opacity=".35"/></g>`;
    s += `<path d="M${f1(ex - ew)} ${f1(CY + tl * 0.5)}Q${f1(ex)} ${f1(CY - eh * 1.9)} ${f1(ex + ew)} ${f1(CY - tl * 0.5)}" stroke="${dark(skin, 0.72)}" stroke-width="${f.male ? 1.3 : 1.8}" fill="none"/>`;
    s += `<path d="M${f1(ex - ew + 1)} ${f1(CY - eh * 1.25)}Q${f1(ex)} ${f1(CY - eh * 2.9)} ${f1(ex + ew - 1)} ${f1(CY - eh * 1.3)}" stroke="${sh2}" stroke-width=".8" fill="none" opacity=".6"/>`;
  }
  // nose
  const ny = CY + f.noseL, nw = f.noseW;
  s += `<path d="M${CX + 3} ${CY - 2}Q${CX + 6} ${f1(ny - 14)} ${f1(CX + nw * 0.6)} ${f1(ny - 6)}" stroke="${sh2}" stroke-width="1.6" fill="none" opacity=".45"/>`;
  s += `<ellipse cx="${CX}" cy="${f1(ny - 5)}" rx="${f1(nw * 0.6)}" ry="5" fill="${hi}" opacity=".35"/>`;
  s += `<path d="M${f1(CX - nw)} ${f1(ny - 5)}q-2 5 3 6q3 0 ${f1(nw - 5)} 2q2 1.5 4 0q${f1(nw - 5)} -2 ${f1(nw - 2)} -2q5 -1 3 -6" stroke="${dark(skin, 0.5)}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  s += `<ellipse cx="${f1(CX - nw * 0.5)}" cy="${f1(ny + 1)}" rx="2.4" ry="1.2" fill="${dark(skin, 0.6)}"/><ellipse cx="${f1(CX + nw * 0.5)}" cy="${f1(ny + 1)}" rx="2.4" ry="1.2" fill="${dark(skin, 0.6)}"/>`;
  // mouth
  const mw = f.mouthW;
  s += `<path d="M${f1(CX - mw)} ${f1(mY - f.smile)}Q${f1(CX - mw * 0.5)} ${f1(mY - f.lipU - 1)} ${CX - 3} ${f1(mY - f.lipU)}Q${CX} ${f1(mY - f.lipU + 1.6)} ${CX + 3} ${f1(mY - f.lipU)}Q${f1(CX + mw * 0.5)} ${f1(mY - f.lipU - 1)} ${f1(CX + mw)} ${f1(mY - f.smile)}Q${CX} ${f1(mY + 2)} ${f1(CX - mw)} ${f1(mY - f.smile)}Z" fill="${dark(lip, 0.12)}"/>`;
  s += `<path d="M${f1(CX - mw)} ${f1(mY - f.smile)}Q${CX} ${f1(mY + f.lipL * 2.1)} ${f1(CX + mw)} ${f1(mY - f.smile)}Q${CX} ${f1(mY + 1.5)} ${f1(CX - mw)} ${f1(mY - f.smile)}Z" fill="${lip}"/>`;
  s += `<path d="M${f1(CX - mw)} ${f1(mY - f.smile)}Q${CX} ${f1(mY + 2)} ${f1(CX + mw)} ${f1(mY - f.smile)}" stroke="${dark(lip, 0.55)}" stroke-width="1.1" fill="none"/>`;
  s += `<path d="M${CX - 9} ${f1(mY + f.lipL * 2 + 5)}q9 4 18 0" stroke="${sh2}" stroke-width="1" fill="none" opacity=".5"/>`;
  if (f.beard === 'moustache' || f.beard === 'full' || f.beard === 'goatee') s += `<path d="M${f1(CX - mw - 2)} ${f1(mY - 1)}Q${f1(CX - mw * 0.5)} ${f1(mY - f.lipU - 7)} ${CX} ${f1(mY - f.lipU - 4)}Q${f1(CX + mw * 0.5)} ${f1(mY - f.lipU - 7)} ${f1(CX + mw + 2)} ${f1(mY - 1)}Q${f1(CX + mw * 0.5)} ${f1(mY - f.lipU - 1)} ${CX} ${f1(mY - f.lipU)}Q${f1(CX - mw * 0.5)} ${f1(mY - f.lipU - 1)} ${f1(CX - mw - 2)} ${f1(mY - 1)}Z" fill="${f.hair}"/>`;
  if (f.mole) s += `<circle cx="${f1(CX + f.mole[0])}" cy="${f1(CY + f.mole[1])}" r="1.3" fill="${dark(skin, 0.55)}"/>`;
  if (f.glasses) {
    const gw = f.eyeW + 6, gh = f.glassShape === 'round' ? gw : 9.5, rxg = f.glassShape === 'round' ? gw : 3;
    for (const sg of [-1, 1]) s += `<rect x="${f1(CX + sg * f.eyeGap - gw)}" y="${f1(CY - gh - 0.5)}" width="${f1(gw * 2)}" height="${f1(gh * 2)}" rx="${rxg}" fill="#fff" fill-opacity=".1" stroke="#1d1a17" stroke-width="1.8"/><path d="M${f1(CX + sg * (f.eyeGap + gw))} ${CY - 3}L${f1(CX + sg * (w + 1))} ${CY - 1}" stroke="#1d1a17" stroke-width="1.6"/>`;
    s += `<path d="M${f1(CX - f.eyeGap + gw)} ${CY - 3}q${f1(f.eyeGap - gw)} -4 ${f1(2 * (f.eyeGap - gw))} 0" stroke="#1d1a17" stroke-width="1.8" fill="none"/>`;
  }
  return s;
}

export function side(f) {
  const id = 'p' + (++uid), { H } = f, fx = 62, cxS = 112, cyS = CY - 12, v = f.vol;
  const skin = f.skin, sh = dark(skin, 0.2), sh2 = dark(skin, 0.36), hi = light(skin, 0.12);
  const lip = mix(dark(skin, 0.12), '#a44a44', f.male ? 0.28 : 0.5), brow = dark(f.hair, f.greyness > 0.5 ? 0.25 : 0.1);
  const nl = f.noseL, mY = CY + nl + 12, np = f.nosePro, lp = f.lipPro;
  const face = [
    [fx - 1 + f.slope * 0.5, CY - 25], [fx - 2 - f.browR, CY - 12], [fx + 1.5, CY - 2],
    [fx - np * 0.42 - f.noseHump, CY + nl * 0.48], [fx - np - 0.5, CY + nl - 5 - f.tipUp], [fx - np * 0.72, CY + nl + 0.5], [fx + 1.5, CY + nl + 2.5],
    [fx - 1.5 - lp, mY - 3.4], [fx + 2.2, mY + 0.3], [fx - 0.5 - lp * 0.8, mY + 4.6], [fx + 3.5, mY + 10],
    [fx + 1 - f.chinPro, CY + H - 9], [fx + 4, CY + H - 1], [fx + 14, CY + H + 1.5],
    [fx + 27, CY + H - 1], [fx + 31, CY + H + 22], [fx + 30, CY + H + 60],
    [cxS + 27, CY + H + 60], [cxS + 26, CY + H * 0.6], [cxS + 38, CY + 28],
    ...arc(cxS, cyS, 50, 52, 2 * Math.PI + 0.42, Math.PI + 0.5, 16),
  ];
  let s = `<defs><linearGradient id="${id}g" x1="0" x2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${skin}"/><stop offset="1" stop-color="${sh}"/></linearGradient>
    <clipPath id="${id}h"><path d="${spline(face, true)}"/></clipPath></defs>`;
  const bump = f.bumpy ? (f.style === 'afro' ? 0.035 : 0.022) : 0;

  // clothes
  s += `<path d="M36 250C40 222 66 206 96 197L150 190C176 198 190 224 194 250Z" fill="${f.shirt}"/>`;
  // long hair behind the neck
  if (['long', 'medium', 'pony'].includes(f.style) || (f.style === 'curly' && !f.male)) {
    const len = f.style === 'long' ? CY + H + 46 : f.style === 'pony' ? CY + H + 30 : CY + H * (f.male ? 0.5 : 0.84);
    const x0 = f.style === 'pony' ? cxS + 38 : cxS + 2;
    s += `<path d="${spline([[x0, CY - 10], [cxS + 52 + v, CY + 4], [cxS + 50 + v, (CY + len) / 2], [cxS + 44, len], [x0 + 6, len - 2], [x0 - 2, (CY + len) / 2]], true)}" fill="${dark(f.hair, 0.12)}"/>`;
  }
  s += `<path d="${spline(face, true)}" fill="url(#${id}g)"/>`;
  s += `<g clip-path="url(#${id}h)"><path d="M${fx + 30} ${CY + H - 4}Q${fx + 60} ${CY + H + 4} ${cxS + 36} ${CY + H - 30}L${cxS + 40} ${CY + H + 70}L${fx + 26} ${CY + H + 70}Z" fill="${sh2}" opacity=".4"/>`;
  if (f.collar !== 'tee') s += `<path d="M${fx + 20} ${CY + H + 44}L${cxS + 40} ${CY + H + 34}L${cxS + 40} ${CY + H + 70}L${fx + 20} ${CY + H + 70}Z" fill="${f.collar === 'jacket' ? '#efede7' : light(f.shirt, 0.1)}"/>`;
  // beard
  if (f.beard === 'full' || f.beard === 'stubble') s += `<path d="${spline([[cxS - 6, CY + 12], [cxS - 16, mY - 6], [fx + 12, mY - 9], [fx - 6, mY - 4], [fx - 8, mY + 8], [fx - 8, CY + H + 6], [fx + 30, CY + H + 8], [cxS - 2, CY + H * 0.62], [cxS + 2, CY + 14]], true)}" fill="${f.hair}" opacity="${f.beard === 'full' ? 0.93 : 0.26}"/>`;
  if (f.beard === 'goatee') s += `<path d="${spline([[fx + 14, mY + 2], [fx - 8, mY + 2], [fx - 8, CY + H + 6], [fx + 16, CY + H + 6]], true)}" fill="${f.hair}" opacity=".9"/>`;
  s += `</g>`;
  if (f.collar !== 'tee') s += `<path d="M${fx + 22} ${CY + H + 46}L${fx + 40} ${CY + H + 62}L${fx + 16} ${CY + H + 66}Z" fill="${f.collar === 'jacket' ? '#f4f2ec' : light(f.shirt, 0.14)}" stroke="${dark(f.shirt, 0.35)}" stroke-width=".8"/>`;
  s += `<path d="M36 250C40 230 58 214 84 205L${fx + 34} ${CY + H + 52}L${cxS + 30} ${CY + H + 44}L150 192C176 200 190 224 194 250Z" fill="${f.collar === 'jacket' ? dark(f.shirt, 0.2) : f.shirt}"/>`;

  // jawline, ear
  s += `<path d="M${fx + 12} ${CY + H}Q${cxS - 8} ${CY + H - 2} ${cxS + 4} ${CY + H * 0.52}" stroke="${sh2}" stroke-width="1.4" fill="none" opacity=".5"/>`;
  const ex = cxS + 9, ey = CY + 9, er = f.ear;
  s += `<path d="${spline([[ex - 6 * er, ey - 10 * er], [ex + 2 * er, ey - 15 * er], [ex + 9 * er, ey - 6 * er], [ex + 5 * er, ey + 6 * er], [ex - 2 * er, ey + 15 * er], [ex - 6 * er, ey + 6 * er]], true)}" fill="${skin}" stroke="${sh2}" stroke-width="1"/>`;
  s += `<path d="M${f1(ex - 2 * er)} ${f1(ey - 9 * er)}q${f1(8 * er)} -2 ${f1(6 * er)} ${f1(8 * er)}q-${f1(4 * er)} 2 -${f1(4 * er)} ${f1(8 * er)}" stroke="${sh2}" stroke-width="1.1" fill="none"/>`;

  // hair
  if (f.style !== 'bald') {
    const aF = Math.PI + 0.3 + Math.max(0, (f.hl - 36) * 0.035), nape = ['buzz', 'short', 'side', 'bun', 'pony'].includes(f.style) ? 0.5 : 0.75;
    const outer = arc(cxS, cyS, 50 + v, 52 + v * 1.1, aF, 2 * Math.PI + nape, 26, bump, 11, f.phase);
    const sb = { buzz: 4, short: 8, side: 10, medium: 16, long: 16, bun: 8, pony: 8, curly: 14, afro: 12 }[f.style];
    const fp = [cxS + 50 * Math.cos(aF), cyS + 52 * Math.sin(aF)];
    const inner = [[cxS + 36, CY + (nape > 0.6 ? 38 : 26)], [ex + 12 * er, ey + 4], [ex + 6 * er, ey - 14 * er], [ex - 5 * er, ey - 14 * er], [ex - 9 * er, CY + sb], [ex - 16, CY - 2], [fx + 22, CY - 18]];
    if (f.fringe === 'bangs') inner.push([fx + 8, CY - 16], [fx + 1, CY - 20]); else inner.push([fp[0] + 5, fp[1] + 4]);
    s += `<path d="${spline([...outer, ...inner], true)}" fill="${f.hair}" opacity="${f.style === 'buzz' ? 0.8 : 1}"/>`;
    if (f.style === 'bun') s += `<circle cx="${cxS + 52}" cy="${CY - 26}" r="14" fill="${f.hair}"/>`;
    if (f.style === 'pony') s += `<circle cx="${cxS + 49}" cy="${CY - 4}" r="5" fill="${dark(f.hair, 0.3)}"/>`;
  } else if (f.age > 30) {
    s += `<path d="${spline([[ex - 12, CY - 14], [ex + 4, CY - 22], [cxS + 44, CY - 6], [cxS + 38, CY + 26], [ex + 12, ey + 6], [ex + 4, ey - 15 * er], [ex - 8, CY - 2]], true)}" fill="${f.hair}" opacity=".85"/>`;
  }

  // eye, brow, nostril, mouth
  const eh = f.eyeH;
  s += `<path d="M${fx + 5.5} ${CY}Q${fx + 10} ${f1(CY - eh * 1.7)} ${fx + 16} ${CY - 1}Q${fx + 11} ${f1(CY + eh * 0.9)} ${fx + 5.5} ${CY}Z" fill="#efe9df"/>`;
  s += `<ellipse cx="${fx + 8.6}" cy="${f1(CY - 0.6)}" rx="2.3" ry="${f1(eh * 0.95)}" fill="${f.eye}"/><ellipse cx="${fx + 7.9}" cy="${f1(CY - 0.6)}" rx="1.1" ry="${f1(eh * 0.5)}" fill="#0b0907"/>`;
  s += `<path d="M${fx + 5} ${CY + 0.4}Q${fx + 10} ${f1(CY - eh * 1.9)} ${fx + 17} ${CY - 1}" stroke="${dark(skin, 0.72)}" stroke-width="${f.male ? 1.3 : 1.8}" fill="none"/>`;
  s += `<path d="M${fx + 2} ${f1(CY - 10.5)}Q${fx + 10} ${f1(CY - 15 - f.browT * 0.4)} ${fx + 20} ${f1(CY - 11 + f.browTilt)}" stroke="${brow}" stroke-width="${f1(f.browT)}" fill="none" stroke-linecap="round" opacity=".92"/>`;
  s += `<path d="M${f1(fx - np * 0.45)} ${f1(CY + nl - 1)}q4 -5 7 0q-1 3 -4 3" stroke="${dark(skin, 0.5)}" stroke-width="1.2" fill="none"/>`;
  s += `<path d="${spline([[fx - 1.5 - lp, mY - 3.4], [fx + 2.2, mY + 0.3], [fx + 9, mY - 0.5], [fx + 4, mY - 3.6]], true)}" fill="${dark(lip, 0.12)}"/>`;
  s += `<path d="${spline([[fx - 0.5 - lp * 0.8, mY + 4.6], [fx + 2.2, mY + 0.3], [fx + 9, mY - 0.3], [fx + 4.5, mY + 5]], true)}" fill="${lip}"/>`;
  s += `<path d="M${fx + 2.2} ${f1(mY + 0.3)}Q${fx + 7} ${f1(mY + 0.6)} ${fx + 11} ${f1(mY - 0.8 - f.smile * 0.5)}" stroke="${dark(lip, 0.55)}" stroke-width="1.1" fill="none"/>`;
  if (f.beard === 'moustache' || f.beard === 'full' || f.beard === 'goatee') s += `<path d="${spline([[fx + 1, CY + nl + 3.5], [fx - 3 - lp, mY - 3], [fx + 6, mY - 1.5], [fx + 13, mY - 1], [fx + 10, CY + nl + 5]], true)}" fill="${f.hair}"/>`;
  const wr = Math.max(0, (f.age - 40) / 35);
  if (wr > 0) s += `<g stroke="${sh2}" fill="none" stroke-width=".9" opacity="${f1(Math.min(0.75, wr))}"><path d="M${fx + 18} ${CY - 2}l6 -3M${fx + 18} ${CY + 1}l6 2"/><path d="M${fx + 8} ${CY + nl - 2}q8 8 6 20"/><path d="M${fx + 4} ${CY - 22}q5 -2 14 -1M${fx + 5} ${CY - 27}q5 -2 13 -1"/></g>`;
  if (f.mole && f.mole[0] < 0) s += `<circle cx="${f1(fx + 14 - f.mole[0] * 0.5)}" cy="${f1(CY + f.mole[1])}" r="1.3" fill="${dark(skin, 0.55)}"/>`;
  if (f.glasses) {
    const gh = f.glassShape === 'round' ? 9 : 8;
    s += `<rect x="${fx + 2}" y="${f1(CY - gh)}" width="7" height="${gh * 2}" rx="2" fill="#fff" fill-opacity=".12" stroke="#1d1a17" stroke-width="1.8"/><path d="M${fx + 9} ${CY - 3}L${f1(ex - 2)} ${f1(CY - 2)}" stroke="#1d1a17" stroke-width="1.7"/>`;
  }
  return s;
}

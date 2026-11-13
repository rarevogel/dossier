// Makes one invented person: everything in the file follows from a seed plus the chosen country, ethnicity and sex.
import { COUNTRIES, ETHNICITIES, LOOKS, JOBS, SECTORS, STUDIES, MARKS, HABITS, OBSERVATIONS, PLACES, WHO, CODEWORDS } from './data.js';
import { rng } from './finger.js';
import { makeFace } from './portrait.js';

export function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const LET = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const pad = (n, l = 2) => String(n).padStart(l, '0');
export const fmtDate = (d) => `${pad(d.getDate())} ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()]} ${d.getFullYear()}`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/ı/g, 'i').replace(/ø/g, 'o').replace(/ß/g, 'ss').replace(/[’']/g, '');

const EUROPE = ['GB', 'NL', 'DE', 'FR', 'ES', 'IT', 'SE', 'PL'];
export function newSeed() { let s = ''; for (let i = 0; i < 7; i++) s += '23456789ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 31)]; return s; }

export function generate(opt = {}) {
  const seed = opt.seed || newSeed();
  const r = rng(hash(seed + '|' + (opt.country || '') + '|' + (opt.eth || '') + '|' + (opt.sex || '')));
  const pick = (a) => a[Math.floor(r() * a.length)], ri = (a, b) => a + Math.floor(r() * (b - a + 1)), chance = (p) => r() < p;
  const weighted = (o) => { const e = Object.entries(o), t = e.reduce((s, x) => s + x[1], 0); let v = r() * t; for (const [k, w] of e) { v -= w; if (v <= 0) return k; } return e[0][0]; };
  const fill = (t) => t.replace(/[#@Q]/g, (c) => c === '#' ? ri(0, 9) : pick(LET));
  const names = (cc) => { const c = COUNTRIES[cc]; return c.like ? { ...COUNTRIES[c.like], ...c, m: COUNTRIES[c.like].m, f: COUNTRIES[c.like].f, s: COUNTRIES[c.like].s } : c; };

  const cc = opt.country || pick(Object.keys(COUNTRIES)), C = COUNTRIES[cc];
  const eth = opt.eth || weighted(C.mix);
  const sex = opt.sex || (chance(0.5) ? 'M' : 'F');
  const now = new Date(), age = Math.round(21 + Math.abs(r() + r() + r() - 1.5) * 36 + r() * 8);
  const dob = new Date(now.getFullYear() - age, ri(0, 11), ri(1, 28));
  if (dob > new Date(now.getFullYear() - age, now.getMonth(), now.getDate())) dob.setFullYear(dob.getFullYear() - 1);
  const year = (a) => dob.getFullYear() + a;

  // where the name comes from: the country itself, or a country of origin for the chosen ethnicity
  const local = C.local.includes(eth);
  const origin = local ? cc : pick(ETHNICITIES[eth].origins.filter(o => o !== cc));
  const bornAbroad = !local && chance(0.55);
  const N = names(origin), L = names(cc);
  const pool = (X, e) => (X.pools && X.pools[e]) || X;
  const NP = pool(N, eth), LP = pool(L, eth);
  const given = (X, sx) => pick(sx === 'M' ? X.m : X.f);
  const femSur = (X, s, sx) => {
    if (sx !== 'F' || !X.fem) return s;
    if (X.fem === 'ska') return s.replace(/ski$/, 'ska').replace(/cki$/, 'cka').replace(/dzki$/, 'dzka');
    return /(ov|ev|in|yov)$/.test(s) ? s + 'a' : s;
  };
  const surOf = (X, P, sx) => X.two ? pick(P.s) + ' ' + pick(P.s) : femSur(X, pick(P.s), sx);
  const full = (X, g, s) => X.order === 'sg' ? `${s} ${g}` : `${g} ${s}`;

  const fatherGiven = given(NP, 'M'), famSur = N.two ? pick(NP.s) : pick(NP.s), motherSur = pick(NP.s);
  const mySur = N.two ? `${famSur} ${motherSur}` : femSur(N, famSur, sex);
  let first = (!local && !bornAbroad && chance(0.5)) ? given(LP, sex) : given(NP, sex);
  let middle = '';
  if (N.patronymic) { const stem = fatherGiven === 'Pavel' ? 'Pavlo' : /[iy]$/.test(fatherGiven) ? fatherGiven.slice(0, -1) + 'ye' : fatherGiven + 'o'; middle = stem + (sex === 'M' ? 'vich' : 'vna'); }
  else if (['US', 'GB', 'AU', 'CA', 'NL', 'DE', 'SE'].includes(origin) && chance(0.6)) { middle = given(NP, sex); if (middle === first) middle = ''; }
  const name = full(N, middle ? `${first} ${middle}` : first, mySur);
  const person = (X, P, sx, sur) => full(X, given(P, sx), sur || surOf(X, P, sx));

  const look = LOOKS[eth], face = makeFace(rng(hash(seed + 'face')), look, sex, age);

  // body
  const height = Math.round((sex === 'M' ? C.h[0] : C.h[1]) + (r() + r() + r() - 1.5) * 11 + (local ? 0 : (names(origin).h[sex === 'M' ? 0 : 1] - (sex === 'M' ? C.h[0] : C.h[1])) * 0.6));
  const bmi = 19 + r() * 6 + r() * 6, weight = Math.round(bmi * (height / 100) ** 2);
  const build = bmi < 20.5 ? 'slim' : bmi < 24.5 ? 'medium' : bmi < 27.5 ? (sex === 'M' ? 'stocky' : 'medium') : 'heavy';
  const imperial = cc === 'US';
  const ft = (cm) => { const inch = Math.round(cm / 2.54); return `${Math.floor(inch / 12)}′${inch % 12}″`; };

  // address
  const mkAddr = (K, city) => {
    const n = ri(1, 240), u = ri(1, 40);
    let line = K.addr.replace('{s}', pick(K.streets)).replace('{n}', n).replace('{u2}', ri(1, 28)).replace('{u3}', ri(1, 19));
    if (K.unit && chance(0.4)) line += (K.unit.startsWith('-') ? '' : ', ') + K.unit.replace('{u}', u);
    return { line, city: city[0], region: city[1], postal: fill(K.postal), country: K.name };
  };
  const homeCity = pick(C.cities), home = mkAddr(C, homeCity);
  const BC = COUNTRIES[bornAbroad ? origin : cc], birthCity = chance(0.45) && !bornAbroad ? homeCity : pick(BC.cities);
  const arrived = bornAbroad ? year(ri(Math.min(4, age - 2), Math.max(5, Math.min(age - 1, 34)))) : null;
  const nationality = bornAbroad ? (chance(0.55) ? `${C.dem} (naturalised ${Math.min(now.getFullYear(), arrived + ri(5, 9))}); formerly ${BC.dem}` : `${BC.dem}; residence permit, ${C.name}`) : C.dem;

  const slugs = ascii(first).toLowerCase().replace(/[^a-z]/g, ''), slugl = ascii(mySur.split(' ').pop()).toLowerCase().replace(/[^a-z]/g, '');
  const email = pick([`${slugs}.${slugl}`, `${slugs[0]}.${slugl}`, `${slugl}${dob.getFullYear() % 100}`, `${slugs}${slugl[0]}${ri(10, 99)}`]) + '@' + pick(['postbox', 'mailhaven', 'lettera', 'inbox-one']) + '.example';

  // work and school
  const job = pick(JOBS), company = (K) => {
    const P = pool(names(K === C ? cc : origin), eth), base = chance(0.55) ? pick(P.s).split(' ')[0] : pick(K.cities)[0], suf = pick(K.suf);
    return K.prefix ? `${K.prefix} ${base} ${pick(SECTORS)}` : `${base} ${pick(SECTORS)} ${suf}`;
  };
  const employment = []; let y = now.getFullYear(), startWork = Math.min(now.getFullYear() - 1, year(ri(18, 25)));
  while (y > startWork && employment.length < 4) {
    const len = ri(2, 11), from = Math.max(startWork, y - len), abroad = bornAbroad && from < arrived;
    employment.push({ from, to: employment.length ? y : null, title: employment.length ? pick(JOBS) : job, org: company(abroad ? BC : C), city: employment.length ? pick((abroad ? BC : C).cities)[0] : homeCity[0] });
    y = from - (chance(0.2) ? 1 : 0);
  }
  const retired = age > 66 && chance(0.75);
  if (retired) employment[0].to = Math.max(employment[0].from, Math.min(now.getFullYear() - 1, year(ri(63, 67))));
  const uni = chance(0.62), study = pick(STUDIES), SC = bornAbroad && arrived > year(20) ? BC : C;
  const education = [{ from: year(12), to: year(18), what: 'Secondary school', where: birthCity[0] }];
  if (uni) education.push({ from: year(18), to: year(ri(21, 24)), what: `${study}, ${pick(['B.Sc.', 'B.A.', 'M.Sc.', 'M.A.', 'diploma', 'no degree taken'])}`, where: `University of ${pick(SC.cities)[0]}` });
  if (sex === 'M' && chance(0.3)) education.push({ from: year(18 + (uni ? 4 : 0)), to: year(19 + (uni ? 5 : 0)), what: `Military service, ${pick(['signals', 'infantry', 'engineers', 'naval reserve', 'logistics', 'air defence'])}`, where: SC.name });

  // languages
  const langs = [[(bornAbroad ? BC : C).langs[0], 'native']];
  if (bornAbroad && C.langs[0] !== BC.langs[0]) langs.push([C.langs[0], pick(['fluent', 'fluent', 'good'])]);
  if (!local && !bornAbroad && N.langs[0] !== C.langs[0]) langs.push([N.langs[0], pick(['spoken at home', 'good'])]);
  for (const l of ['English', 'French', 'German', 'Spanish', 'Russian', 'Arabic', 'Mandarin', 'Portuguese']) if (!langs.some(x => x[0] === l) && chance(l === 'English' ? 0.6 : 0.09)) langs.push([l, pick(['fluent', 'good', 'working knowledge', 'basic'])]);

  // family
  const father = { rel: 'Father', name: full(N, fatherGiven, N.two ? `${famSur} ${pick(NP.s)}` : famSur), born: year(-ri(22, 38)) };
  const mother = { rel: 'Mother', name: full(N, given(NP, 'F'), N.two ? `${motherSur} ${pick(NP.s)}` : femSur(N, motherSur, 'F')), born: year(-ri(19, 34)), note: N.two ? '' : 'maiden name' };
  for (const p of [father, mother]) { const a = now.getFullYear() - p.born; if (a > 70 && chance((a - 65) / 30)) p.died = Math.min(now.getFullYear() - 1, p.born + ri(62, Math.min(95, a - 1))); }
  const marital = age < 26 ? weighted({ single: 80, married: 15, 'cohabiting': 5 }) : weighted({ married: 52, single: 20, divorced: 14, cohabiting: 8, widowed: age > 60 ? 8 : 1 });
  const family = [father, mother];
  let spouse = null;
  if (marital === 'married' || marital === 'cohabiting' || marital === 'widowed' || marital === 'divorced') {
    const sx = chance(0.95) ? (sex === 'M' ? 'F' : 'M') : sex, SP = chance(0.75) ? [N, NP] : [L, LP];
    spouse = { rel: marital === 'divorced' ? 'Former spouse' : marital === 'cohabiting' ? 'Partner' : marital === 'widowed' ? 'Spouse (deceased)' : 'Spouse', name: person(SP[0], SP[1], sx), born: year(ri(-6, 6)) };
    family.push(spouse);
    const kids = age > 27 ? weighted({ 0: 25, 1: 25, 2: 34, 3: 13, 4: 3 }) : weighted({ 0: 70, 1: 25, 2: 5 });
    let ky = year(ri(24, 31));
    for (let k = 0; k < +kids && ky <= now.getFullYear(); k++) { const sx2 = chance(0.5) ? 'M' : 'F'; family.push({ rel: sx2 === 'M' ? 'Son' : 'Daughter', name: full(N, given(chance(0.6) || local ? LP : NP, sx2), N.two ? `${famSur} ${spouse.name.split(' ').slice(-1)[0]}` : femSur(N, famSur, sx2)), born: ky }); ky += ri(1, 4); }
  }
  if (chance(0.6)) { const sx3 = chance(0.5) ? 'M' : 'F'; family.push({ rel: sx3 === 'M' ? 'Brother' : 'Sister', name: full(N, given(NP, sx3), N.two ? `${famSur} ${motherSur}` : femSur(N, famSur, sx3)), born: year(ri(-7, 8)) }); }

  // papers
  const iss = new Date(now.getFullYear() - ri(0, 8), ri(0, 11), ri(1, 28)); if (iss > now) iss.setFullYear(now.getFullYear() - 1);
  const exp = new Date(iss); exp.setFullYear(iss.getFullYear() + 10);
  const PC = nationality.startsWith(C.dem) ? C : BC;
  const passport = { no: fill(PC.pass), country: PC.name, issued: iss, expires: exp };
  const idno = fill(C.id[1]);

  const vehicle = chance(0.68) ? { car: pick(C.cars), colour: pick(['grey', 'black', 'white', 'silver', 'dark blue', 'red', 'green', 'beige']), year: now.getFullYear() - ri(1, 17), plate: fill(C.plate) } : null;

  // aliases
  const aliases = [];
  if (first.length >= 6 && chance(0.6)) aliases.push(full(N, first.slice(0, Math.max(3, Math.min(first.length - 1, 4))) + (chance(0.4) ? 'y' : ''), mySur.split(' ')[0]));
  if (chance(0.3)) aliases.push(person(L, LP, sex));
  if (chance(0.25)) aliases.push(`“${cap(pick(['the', 'the', 'old', 'little']))} ${cap(job.split(' ').pop())}”`);

  // people around the subject
  const associates = [];
  for (let k = ri(2, 4); k > 0; k--) {
    const sx = chance(0.6) ? 'M' : 'F', loc = chance(0.7);
    associates.push({ name: loc ? person(L, pool(L, weighted(C.mix)), sx) : person(N, NP, sx), rel: pick(['colleague', 'neighbour', 'former classmate', 'landlord', 'business partner', 'frequent caller', 'chess partner', 'cousin', 'former colleague', 'contact, role unconfirmed']), note: pick(['no adverse trace', 'no adverse trace', 'see file ' + fill('####/@'), 'not yet identified with certainty', 'cooperative when approached', 'left the country ' + (now.getFullYear() - ri(0, 4)), 'holds a second passport']) });
  }

  // travel
  const travel = [], others = Object.keys(COUNTRIES).filter(k => k !== cc);
  for (let k = ri(3, 6); k > 0; k--) {
    const d = new Date(now.getTime() - r() * 6 * 365 * 864e5), to = (!local && chance(0.4)) ? origin : pick(others), K = COUNTRIES[to];
    travel.push({ date: d, to: `${pick(K.cities)[0]}, ${K.name}`, days: ri(2, 21), by: EUROPE.includes(cc) && EUROPE.includes(to) ? pick(['air', 'air', 'rail', 'rail', 'road', 'ferry']) : (cc === 'US' && (to === 'CA' || to === 'MX')) || (to === 'US' && (cc === 'CA' || cc === 'MX')) ? pick(['air', 'road']) : 'air', why: pick(['business', 'family visit', 'holiday', 'trade fair', 'conference', 'not stated', 'transit only']) });
  }
  travel.sort((a, b) => b.date - a.date);

  // previous addresses
  const previous = []; let py = now.getFullYear() - ri(1, 9);
  for (let k = ri(1, 3); k > 0 && py > year(18); k--) {
    const from = Math.max(year(18), py - ri(2, 9)), K = bornAbroad && from < arrived ? BC : C, a = mkAddr(K, pick(K.cities));
    previous.push({ from, to: py, ...a }); py = from;
  }
  const since = previous.length ? previous[0].to : year(ri(18, Math.max(19, age - 1)));

  // the file itself
  const codename = pick(CODEWORDS), opened = new Date(now.getTime() - (0.3 + r() * 9) * 365 * 864e5);
  const status = weighted({ 'UNDER OBSERVATION': 40, ACTIVE: 25, DORMANT: 20, 'CLOSED — NO FURTHER ACTION': 15 });
  const log = [], obsUsed = new Set();
  let ld = new Date(now.getTime() - ri(2, 30) * 864e5);
  for (let k = ri(5, 8); k > 0; k--) {
    let o; do { o = pick(OBSERVATIONS); } while (obsUsed.has(o) && obsUsed.size < OBSERVATIONS.length); obsUsed.add(o);
    const t = `${pad(ri(6, 23))}${pad(pick([0, 5, 10, 15, 20, 30, 40, 45, 50]))}`;
    log.push({ date: new Date(ld), time: t, text: o.replace('{t}', `${pad(ri(6, 22))}${pad(pick([0, 10, 15, 30, 45]))} hrs`).replace('{place}', pick(PLACES)).replace('{who}', pick(WHO)), by: pick(LET) + pick(LET) + '-' + ri(2, 9) });
    ld = new Date(ld.getTime() - ri(1, 40) * 864e5);
  }
  const habits = []; while (habits.length < 3) { const h = pick(HABITS); if (!habits.includes(h)) habits.push(h); }
  const marks = []; for (let k = weighted({ 0: 35, 1: 45, 2: 20 }); k > 0; k--) { const m = pick(MARKS); if (!marks.includes(m)) marks.push(m); }

  // fingerprints: chances per finger as in the Vingerafdruk app (loops most often, whorls on thumbs and ring fingers,
  // arches and radial loops mostly on index fingers), with a family tendency: one pattern is a bit more likely on every finger
  const ODDS = [[3, 1, 50, 2, 34, 10], [8, 7, 30, 17, 30, 8], [5, 2, 65, 2, 22, 4], [2, 1, 48, 1, 42, 6], [1, 1, 82, 1, 13, 2]];
  const KEYS = ['A', 'TA', 'UL', 'RL', 'W', 'DL'], lean = weighted({ UL: 50, W: 30, A: 12, DL: 8 });
  const fingers = [];
  for (let i = 0; i < 10; i++) {
    const o = {}; KEYS.forEach((k, j) => { o[k] = ODDS[i % 5][j] * (k === lean ? 1.8 : 1); });
    fingers.push({ type: weighted(o), seed: hash(seed + 'f' + i) });
  }
  const fpClass = `${ri(1, 32)} ${pick(['I', 'M', 'O'])} ${ri(1, 32)} ${pick(['U', 'W', 'R', 'A'])} ${pick(['IOI', 'OOI', 'IIO', 'MMO', 'OIM'])} ${ri(5, 22)}`;

  const fileNo = `MRD-${pad(hash(seed) % 100000, 5)}/${pad(opened.getFullYear() % 100)}-${cc}`;
  return {
    seed, opt: { country: opt.country || '', eth: opt.eth || '', sex: opt.sex || '' }, fileNo, codename, status, opened, now,
    priority: pick(['A', 'B', 'B', 'C', 'C', 'D']), officer: `${pick(LET)}. ${pick(LET)}., ${pick(['Section 4', 'Section 7', 'Desk 12', 'Registry', 'Station ' + pick(C.cities)[0]])}`, copy: ri(1, 4),
    cc, country: C, eth, ethName: ETHNICITIES[eth].name, sex, age, dob, name, first, surname: mySur, aliases, nationality,
    birthplace: `${birthCity[0]}, ${BC.name}`, origin: local ? null : names(origin).name, originDem: names(origin).dem, bornAbroad, arrived,
    face, height, weight, build, heightTxt: imperial ? `${ft(height)} (${height} cm)` : `${height} cm`, weightTxt: imperial ? `${Math.round(weight * 2.2046)} lb (${weight} kg)` : `${weight} kg`, imperial,
    blood: weighted({ 'O+': 38, 'A+': 30, 'B+': 14, 'AB+': 5, 'O−': 6, 'A−': 5, 'B−': 1.5, 'AB−': 0.5 }), marks, hand: habits.some(h => h.startsWith('Left-handed')) || chance(0.08) ? 'left' : 'right',
    home, since, previous, phone: fill(C.phone), mobile: fill(C.mobile), email,
    id: { label: C.id[0], no: idno }, passport, licence: chance(0.85) ? fill('@@######') : null, vehicle,
    job: retired ? `retired ${job}` : job, employment, education, langs, marital, family, associates, travel, log, habits, fingers, fpClass,
  };
}

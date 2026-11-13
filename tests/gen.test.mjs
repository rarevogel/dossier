import { generate } from '../web/gen.js';
import { COUNTRIES, ETHNICITIES } from '../web/data.js';
import assert from 'node:assert';
let n = 0;
for (const c of ['', ...Object.keys(COUNTRIES)]) for (const e of ['', ...Object.keys(ETHNICITIES)]) for (const s of ['', 'M', 'F']) for (let k = 0; k < 6; k++) {
  const p = generate({ seed: 'T' + k + c + e, country: c, eth: e, sex: s }); n++;
  assert.ok(p.name && !/undefined|NaN/.test(JSON.stringify(p)), JSON.stringify(p).match(/.{60}(undefined|NaN).{40}/)?.[0]);
  assert.ok(p.age >= 18 && p.age < 95, 'age ' + p.age);
  assert.ok(p.height > 135 && p.height < 215, 'height ' + p.height);
  if (c) assert.equal(p.cc, c); if (e) assert.equal(p.eth, e); if (s) assert.equal(p.sex, s);
  for (const j of p.employment) assert.ok(j.from <= (j.to || 9999));
  // same seed, same person
  const q = generate({ seed: 'T' + k + c + e, country: c, eth: e, sex: s }); assert.equal(q.name + q.home.line + q.id.no + q.face.skin, p.name + p.home.line + p.id.no + p.face.skin);
}
console.log(n, 'people ok');
for (const [c, e, s] of [['NL', '', 'M'], ['NL', 'ea', 'F'], ['RU', '', 'F'], ['JP', '', 'M'], ['MX', '', 'F'], ['US', 'la', 'M'], ['PL', '', 'F'], ['ZA', 'eu', 'M']]) {
  const p = generate({ seed: 'DEMO1', country: c, eth: e, sex: s });
  console.log(`${c}/${e || 'any'}: ${p.name} | ${p.age} | b. ${p.birthplace} | ${p.nationality} | ${p.home.line}, ${p.home.postal} ${p.home.city} | ${p.mobile} | ${p.id.label} ${p.id.no} | ${p.employment[0].title} @ ${p.employment[0].org} | ${p.langs.map(l => l.join(':')).join(', ')} | ${p.family.map(f => f.rel + ' ' + f.name).join('; ')}`);
}

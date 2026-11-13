// Dossier: lays the invented person out as a four-page modern registry file, loads the AI photographs,
// and handles the controls and the list of recent files.
// (build.py puts data.js, finger.js, portrait.js, gen.js and photo.js in front of this file.)

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const native = window.DossierApp || null;
const AGENCY = 'Meridian Records Directorate', DIVISION = 'Registry & Analysis Division';

// ───────── settings and history ─────────
const KEY = 'dossier.v1';
let ST = {};
try { ST = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
ST.sel ||= { country: '', eth: '', sex: '' }; ST.hist ||= []; ST.photo ||= { key: '', model: 'flux', side: false, off: false };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch {} };

$('#country').innerHTML = `<option value="">Any country</option>` + Object.entries(COUNTRIES).sort((a, b) => a[1].name.localeCompare(b[1].name)).map(([k, c]) => `<option value="${k}">${esc(c.name)}</option>`).join('');
$('#eth').innerHTML = `<option value="">Typical for the country</option>` + Object.entries(ETHNICITIES).map(([k, e]) => `<option value="${k}">${esc(e.name)}</option>`).join('');
for (const k of ['country', 'eth', 'sex']) { $('#' + k).value = ST.sel[k] || ''; $('#' + k).onchange = (e) => { ST.sel[k] = e.target.value; save(); }; }
$('#new').onclick = () => show(generate({ ...ST.sel }), true);
// Android: the app draws the four pages into a PDF itself and lets you choose where to save it.
// Browser: the print dialog (choose "Save as PDF" there).
if (native?.pdfBegin) $('#print').textContent = 'Save PDF';
$('#print').onclick = () => { if (native?.pdfBegin) makePdf(); else print(); };
let pdfBusy = false, pdfTimer = 0;
function pdfMsg(t, ms) { const m = $('#pdfmsg'); m.textContent = t; m.hidden = !t; clearTimeout(pdfTimer); if (ms) pdfTimer = setTimeout(() => (m.hidden = true), ms); }
async function makePdf() {
  if (pdfBusy || !current) return;
  pdfBusy = true; $('#print').disabled = true;
  const p = current, wait = (ms) => new Promise(r => setTimeout(r, ms));
  // wait for the fingerprints (and give the photographs a moment)
  for (let t = 0; document.querySelectorAll('.scan canvas').length < 10 && t < 240; t++) { pdfMsg('Waiting for the fingerprint scans…'); await wait(500); }
  for (let t = 0; document.querySelector('.ph .spin') && t < 60; t++) { pdfMsg('Waiting for the photographs…'); await wait(500); }
  if (current !== p) { pdfBusy = false; $('#print').disabled = false; pdfMsg(''); return; }
  pdfMsg('Making PDF…');
  await wait(400);
  const y0 = scrollY, frames = (n = 2) => new Promise(r => { const f = () => (--n > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });
  const root = document.documentElement, pages = [...document.querySelectorAll('.page')];
  root.classList.add('pdf');
  await frames(3);
  const vw = root.clientWidth, vh = innerHeight;
  const name = `${p.fileNo.replace(/[^A-Za-z0-9-]+/g, '_')}_${p.surname.split(' ')[0].replace(/[^\p{L}\p{N}-]+/gu, '')}.pdf`;
  const tile = (tx, ty) => new Promise((res) => { window.__tileDone = res; native.pdfTile(tx, ty); });
  let ok = true;
  try {
    native.pdfBegin(name, vw, vh);
    // each A4 page is laid out at 794 CSS pixels wide, pinned to the top left of the screen and moved under
    // the screen tile by tile; the app copies every tile from the screen and pastes them back together
    for (const pg of pages) {
      pg.classList.add('cap');
      await frames(2);
      const W = 794, H = pg.offsetHeight;
      native.pdfPage(W, H);
      for (let ty = 0; ty < H; ty += vh) for (let tx = 0; tx < W; tx += vw) {
        pg.style.transform = `translate(${-tx}px, ${-ty}px)`;
        await frames(3); await wait(80);
        await tile(tx, ty);
      }
      pg.classList.remove('cap'); pg.style.transform = '';
    }
  } catch (e) { ok = false; }
  window.__pdfDone = (good, msg) => {
    root.classList.remove('pdf');
    for (const pg of pages) { pg.classList.remove('cap'); pg.style.transform = ''; }
    scrollTo(0, y0);
    pdfBusy = false; $('#print').disabled = false;
    pdfMsg(msg || (good ? 'PDF saved.' : 'No PDF saved.'), 4000);
  };
  if (ok) native.pdfEnd(); else window.__pdfDone(false, 'Could not make the PDF.');
}

const pops = { hist: '#histBtn', photoPop: '#photoBtn' };
function pop(id, on) {
  for (const [p, b] of Object.entries(pops)) { const show = p === id && (on ?? $('#' + p).hidden); $('#' + p).hidden = !show; $(b).setAttribute('aria-expanded', String(show)); }
}
$('#histBtn').onclick = () => { pop('hist'); renderHist(); };
$('#photoBtn').onclick = () => pop('photoPop');
document.addEventListener('click', (e) => { if (!e.target.closest('.pop, #histBtn, #photoBtn')) pop(null); });
function renderHist() {
  $('#hist').innerHTML = ST.hist.length ? ST.hist.map((h, i) => `<button data-i="${i}">${esc(h.name)}<small>${esc(h.fileNo)} · ${esc(h.where)}</small></button>`).join('') : '<p>No files opened yet.</p>';
}
$('#hist').onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; const h = ST.hist[+b.dataset.i]; pop(null); show(generate({ seed: h.seed, ...h.opt }), true); };

$('#pkey').value = ST.photo.key; $('#pmodel').value = ST.photo.model; $('#pside').checked = ST.photo.side; $('#poff').checked = ST.photo.off;
const photoChanged = () => { ST.photo = { key: $('#pkey').value.trim(), model: $('#pmodel').value, side: $('#pside').checked, off: $('#poff').checked }; save(); if (current) show(current, false); };
$('#pkey').onchange = photoChanged; $('#pmodel').onchange = photoChanged; $('#pside').onchange = photoChanged; $('#poff').onchange = photoChanged;
window.__terug = () => { if (!$('#hist').hidden || !$('#photoPop').hidden) { pop(null); return true; } return false; };

// ───────── small pieces ─────────
const d2 = (n) => String(n).padStart(2, '0');
const dEU = (d) => `${d2(d.getDate())}-${d2(d.getMonth() + 1)}-${d.getFullYear()}`;
const K = (label, value, cls = '', mono = false) => `<div class="k ${cls}"><label>${esc(label)}</label><div${mono ? ' class="mono"' : ''}>${value === '' || value == null ? '—' : esc(value)}</div></div>`;
const redact = (s) => `<span class="redact">${esc(s)}</span>`;
const mark = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><rect x="1" y="1" width="38" height="38" rx="8" fill="#14325c"/><path d="M10 29V11l10 11 10-11v18" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><path d="M10 33h20" stroke="#8fb3e3" stroke-width="2"/></svg>`;
// a square code that looks like a document tracking code (it does not encode anything)
function code(text) {
  const r = rng(hash(text)), n = 21, c = 46 / n; let s = '';
  const finder = (x, y) => `<rect x="${x * c}" y="${y * c}" width="${7 * c}" height="${7 * c}" fill="#111"/><rect x="${(x + 1) * c}" y="${(y + 1) * c}" width="${5 * c}" height="${5 * c}" fill="#fff"/><rect x="${(x + 2) * c}" y="${(y + 2) * c}" width="${3 * c}" height="${3 * c}" fill="#111"/>`;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
    if (r() < 0.47) s += `<rect x="${(x * c).toFixed(2)}" y="${(y * c).toFixed(2)}" width="${c.toFixed(2)}" height="${c.toFixed(2)}"/>`;
  }
  return `<svg class="qr" viewBox="0 0 46 46" aria-hidden="true"><rect width="46" height="46" fill="#fff"/><g fill="#111">${s}</g>${finder(0, 0)}${finder(14, 0)}${finder(0, 14)}</svg>`;
}
const hex = (s, n = 64) => { let out = '', h = hash(s); const r = rng(h); while (out.length < n) out += Math.floor(r() * 16).toString(16); return out; };

const TITLES = ['Subject identification', 'Biometric record — fingerprints', 'Background particulars', 'Movements, observation and assessment'];
function top(p, n) {
  return `<div class="class">CONFIDENTIAL</div>
    <div class="top">${mark}<div><div class="agency">${AGENCY}</div><div class="sub">${DIVISION} · Central Registry</div></div>
      <div class="meta">${code(p.fileNo + n)}<div>File <b>${esc(p.fileNo)}</b></div><div>Page ${n} of 4 · Copy ${p.copy}</div></div></div>
    <div class="doctitle"><h1>${TITLES[n - 1]}</h1><span>Form MRD-${[11, 14, 17, 22][n - 1]} · rev. 2024</span></div>`;
}
const foot = (p, n) => `<div class="foot"><span>${esc(p.fileNo)} · ${TITLES[n - 1]} · ${n}/4</span><span>Fictional document: every detail is generated at random.</span></div><div class="class bottom">CONFIDENTIAL</div>`;
const sec = (no, title, body) => `<section class="sec"><h2><i>${no}</i>${esc(title)}</h2>${body}</section>`;
const STATUS = { ACTIVE: 'red', 'UNDER OBSERVATION': 'amber', DORMANT: 'grey', 'CLOSED — NO FURTHER ACTION': 'green' };

// ───────── photographs ─────────
const silhouette = `<svg viewBox="0 0 100 120" aria-hidden="true"><circle cx="50" cy="42" r="22" fill="#9aa1ab"/><path d="M8 120c2-30 20-44 42-44s40 14 42 44z" fill="#9aa1ab"/></svg>`;
function photoFig(p, view, n) {
  const label = view === 'side' ? 'Left profile' : 'Frontal';
  return `<figure class="ph" data-view="${view}"><div class="frame">
      <div class="wait">${ST.photo.off ? silhouette + '<span>No photograph on file</span>' : '<div class="spin"></div><span>Developing photograph…</span>'}</div></div>
    <figcaption>Fig. ${n} · ${label} · ${dEU(p.now)}</figcaption></figure>`;
}
let photoRun = 0;
function loadPhotos(p) {
  if (ST.photo.off) { $('#pstat').textContent = 'Photographs are switched off.'; return; }
  const run = ++photoRun;
  for (const fig of document.querySelectorAll('.ph[data-view]')) {
    const view = fig.dataset.view, urls = photoUrls(p, view, ST.photo), frame = fig.querySelector('.frame');
    let i = 0, timer = 0;
    const tryNext = () => {
      clearTimeout(timer);
      if (run !== photoRun) return;
      if (i >= urls.length) {
        frame.querySelector('.wait').innerHTML = `${silhouette}<span>Photograph unavailable.<br>${ST.photo.key ? 'Check the API key under Photos.' : 'The free service did not answer; add a key under Photos.'}</span>`;
        $('#pstat').textContent = `Last attempt failed (${new Date().toLocaleTimeString()}).`;
        if (view === 'side' && ST.photo.side) fig.remove();
        return;
      }
      const img = new Image(), url = urls[i++];
      img.alt = `${view === 'side' ? 'Profile' : 'Frontal'} photograph of ${p.name} (AI-generated, fictional)`;
      img.referrerPolicy = 'no-referrer';
      img.onload = () => { if (run !== photoRun) return; clearTimeout(timer); if (img.naturalWidth < 64) { tryNext(); return; } frame.innerHTML = ''; frame.append(img); $('#pstat').textContent = `Photographs loaded from ${new URL(url).host}.`; };
      img.onerror = tryNext;
      timer = setTimeout(() => { img.onload = img.onerror = null; img.src = ''; tryNext(); }, 75000);
      img.src = url;
    };
    tryNext();
  }
}

// ───────── the four pages ─────────
function page1(p) {
  const f = p.face, a = p.home, kids = p.family.filter(m => /Son|Daughter/.test(m.rel)).length;
  return `<article class="page">${top(p, 1)}
    <div class="idrow">
      <div class="photos">${photoFig(p, 'front', 1)}${ST.photo.side && !ST.photo.off ? photoFig(p, 'side', 2) : ''}</div>
      <div class="summary">
        <div class="name">${esc(p.name)}</div>
        <div class="alias">${p.aliases.length ? 'Also known as ' + esc(p.aliases.join(', ')) : 'No known aliases'}</div>
        <div class="pills"><span class="pill ${STATUS[p.status]}">${esc(p.status.split(' — ')[0])}</span><span class="pill navy">Priority ${p.priority}</span><span class="pill grey">${esc(p.codename)}</span></div>
        <div class="kv">${K('Date of birth', `${dEU(p.dob)} (${p.age})`, 's6')}${K('Sex', p.sex === 'M' ? 'Male' : 'Female', 's6')}
          ${K('Nationality', p.nationality, 's12')}${K('Residence', `${a.city}, ${a.country}`, 's6')}${K('Occupation', p.job, 's6')}
          ${K('File opened', dEU(p.opened), 's6')}${K('Case officer', p.officer, 's6')}</div>
      </div>
    </div>
    ${sec('01', 'Identity', `<div class="kv">${K('Surname', p.surname.toUpperCase(), 's6')}${K('Given names', p.name.replace(p.surname, '').trim(), 's6')}
      ${K('Place of birth', p.birthplace, 's6')}${K('Ethnicity', p.ethName, 's6')}
      ${K('Marital status', p.marital + (kids ? `, ${kids} child${kids > 1 ? 'ren' : ''}` : ''), 's6')}${K('Languages', p.langs.map(l => l[0]).join(', '), 's6')}</div>`)}
    ${sec('02', 'Physical description', `<div class="kv">${K('Height', p.heightTxt, 's3')}${K('Weight', p.weightTxt, 's3')}${K('Build', p.build, 's3')}${K('Blood group', p.blood, 's3')}
      ${K('Hair', f.style === 'bald' ? 'bald' : `${f.hairName}, ${f.hairDesc}`, 's3')}${K('Eyes', f.eyeName, 's3')}${K(p.sex === 'M' ? 'Facial hair' : 'Spectacles', p.sex === 'M' ? f.beardDesc : (f.glasses ? 'yes' : 'no'), 's3')}${K('Handedness', p.hand, 's3')}
      ${K('Distinguishing marks', p.marks.join('; ') || 'none recorded', 's12')}</div>`)}
    ${sec('03', 'Residence and contact', `<div class="kv">${K('Address', `${a.line}, ${a.postal} ${a.city}`, 's8')}${K('Since', p.since, '')}
      ${K('Region', a.region, '')}${K('Telephone', p.phone, '', true)}${K('Mobile', p.mobile, '', true)}${K('E-mail', p.email, 's12', true)}</div>`)}
    ${sec('04', 'Documents and vehicles', `<div class="kv">${K(p.id.label, p.id.no, '', true)}${K('Passport', `${p.passport.no} · ${p.passport.country}`, '', true)}${K('Passport valid', `${dEU(p.passport.issued)} – ${dEU(p.passport.expires)}`, '')}
      ${K('Driving licence', p.licence || 'none held', '', !!p.licence)}${K('Vehicle', p.vehicle ? `${p.vehicle.car}, ${p.vehicle.colour}, ${p.vehicle.year}` : 'none registered', '')}${K('Registration', p.vehicle ? p.vehicle.plate : '—', '', true)}</div>`)}
    ${foot(p, 1)}</article>`;
}

const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Little'];
function page2(p) {
  const row = (hand, off) => `<div class="hand">${hand} hand</div><div class="prints">${FINGERS.map((n, i) => { const f = p.fingers[off + i]; return `<div class="pr"><label><b>${hand[0]}${i + 1} ${n}</b><span>${PATTERNS[f.type]}</span></label><div class="scan" data-i="${off + i}" role="img" aria-label="${hand} ${n.toLowerCase()}, ${PATTERNS[f.type].toLowerCase()}"><span>Waiting for scanner…</span></div><div class="mn" data-mn="${off + i}">&nbsp;</div></div>`; }).join('')}</div>`;
  const count = {}; for (const f of p.fingers) count[f.type] = (count[f.type] || 0) + 1;
  const quality = rng(hash(p.seed + 'q'));
  return `<article class="page">${top(p, 2)}
    <div class="kv" style="margin-top:14px">${K('Subject', p.name, 's6')}${K('Date of birth', dEU(p.dob), 's3')}${K('Sex', p.sex, 's3')}
      ${K('Henry classification', p.fpClass, 's6', true)}${K('Captured', `${dEU(p.now)}, ${p.country.cities[0][0]}`, 's3')}${K('Method', 'Rolled, live-scan 500 ppi', 's3')}</div>
    ${row('Right', 0)}${row('Left', 5)}
    ${sec('05', 'Pattern summary', `<div class="scroll"><table><tr>${Object.entries(PATTERNS).map(([k, n]) => `<th>${k} · ${n}</th>`).join('')}</tr><tr>${Object.keys(PATTERNS).map(k => `<td class="mono">${count[k] || 0}</td>`).join('')}</tr></table></div>
      <div class="kv" style="margin-top:10px">${K('Image quality (NFIQ)', `${1 + Math.floor(quality() * 2)} — good`, 's3')}<div class="k s3"><label>Minutiae</label><div id="mintotal">counting…</div></div>${K('Remarks', p.marks.find(m => /finger|hand/.test(m)) || 'All ten digits recorded.', 's6')}</div>`)}
    <div class="sign"><div>Captured by<b>${esc(p.officer)}</b><span class="mono">device MRD-LS-${hex(p.seed + 'dev', 6).toUpperCase()}</span></div>
      <div>Database comparison<b class="ok">No match in central index</b><span class="mono">query ${hex(p.seed + 'q', 16)}</span></div></div>
    ${foot(p, 2)}</article>`;
}
function page3(p) {
  const yr = (a, b) => `${a}–${b || 'present'}`;
  return `<article class="page">${top(p, 3)}
    ${sec('06', 'Employment', `<div class="scroll"><table><tr><th>Period</th><th>Position</th><th>Employer</th><th>Place</th></tr>${p.employment.map(e => `<tr><td class="mono">${yr(e.from, e.to)}</td><td>${esc(e.title)}</td><td>${esc(e.org)}</td><td>${esc(e.city)}</td></tr>`).join('')}</table></div>`)}
    ${sec('07', 'Education and service', `<div class="scroll"><table><tr><th>Period</th><th>Course</th><th>Institution</th></tr>${p.education.map(e => `<tr><td class="mono">${yr(e.from, e.to)}</td><td>${esc(e.what)}</td><td>${esc(e.where)}</td></tr>`).join('')}</table></div>`)}
    ${sec('08', 'Languages', `<div class="kv">${p.langs.map(l => K(l[0], l[1], 's3')).join('')}</div>`)}
    ${sec('09', 'Family', `<div class="scroll"><table><tr><th>Relation</th><th>Name</th><th>Born</th><th>Remarks</th></tr>${p.family.map(m => `<tr><td>${esc(m.rel)}</td><td>${esc(m.name)}</td><td class="mono">${m.born}</td><td>${esc(m.died ? 'deceased ' + m.died : m.note || '')}</td></tr>`).join('')}</table></div>`)}
    ${sec('10', 'Previous addresses', `<div class="scroll"><table><tr><th>Period</th><th>Address</th><th>Country</th></tr>${p.previous.length ? p.previous.map(a => `<tr><td class="mono">${yr(a.from, a.to)}</td><td>${esc(`${a.line}, ${a.postal} ${a.city}`)}</td><td>${esc(a.country)}</td></tr>`).join('') : '<tr><td colspan="3">No earlier address on record.</td></tr>'}</table></div>`)}
    ${sec('11', 'Known associates', `<div class="scroll"><table><tr><th>Name</th><th>Connection</th><th>Remarks</th></tr>${p.associates.map((a, i) => `<tr><td>${i === 1 ? redact(a.name) : esc(a.name)}</td><td>${esc(a.rel)}</td><td>${esc(a.note)}</td></tr>`).join('')}</table></div>`)}
    ${foot(p, 3)}</article>`;
}
function page4(p) {
  const kids = p.family.filter(m => /Son|Daughter/.test(m.rel)).length, he = p.sex === 'M' ? 'He' : 'She';
  const verdict = { ACTIVE: 'Coverage to continue at the present level; review in ninety days.', DORMANT: 'No activity of interest for some months. File to be reviewed annually.', 'UNDER OBSERVATION': 'Pattern of life not yet established. Recommend that observation be extended and the telephone record obtained.', 'CLOSED — NO FURTHER ACTION': 'Nothing adverse established. Recommend that the file be closed and retained in the registry.' }[p.status];
  const signed = new Date(p.now); signed.setHours(9 + (hash(p.seed) % 8), hash(p.seed + 'm') % 60);
  return `<article class="page">${top(p, 4)}
    <div class="kv" style="margin-top:14px">${K('Cover name', p.codename, 's3')}${K('Status', p.status, 's6')}${K('Priority', p.priority, 's3')}
      ${K('Case officer', p.officer, 's6')}${K('Opened', dEU(p.opened), 's3')}${K('Last entry', dEU(p.log[0].date), 's3')}</div>
    ${sec('12', 'Travel abroad', `<div class="scroll"><table><tr><th>Departed</th><th>Destination</th><th>Days</th><th>By</th><th>Stated purpose</th></tr>${p.travel.map(t => `<tr><td class="mono">${dEU(t.date)}</td><td>${esc(t.to)}</td><td class="mono">${t.days}</td><td>${esc(t.by)}</td><td>${esc(t.why)}</td></tr>`).join('')}</table></div>`)}
    ${sec('13', 'Pattern of life', `<ul class="para" style="padding-left:18px;margin:4px 0">${p.habits.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`)}
    ${sec('14', 'Observation log', `<div class="log">${p.log.map((l, i) => `<p><time>${dEU(l.date)} · ${l.time.slice(0, 2)}:${l.time.slice(2)} · ${i % 3 === 1 ? redact(l.by) : esc(l.by)}</time>${i === 2 ? esc(l.text.split(';')[0]) + '; ' + redact('source withheld by registry') + '.' : esc(l.text)}</p>`).join('')}</div>`)}
    ${sec('15', 'Assessment', `<p class="para">${esc(`${p.name}, ${p.age}, ${p.job}, resident in ${p.home.city} since ${p.since}. ${he} is ${p.marital}${kids ? ` with ${kids} child${kids > 1 ? 'ren' : ''}` : ''} and speaks ${p.langs.map(l => l[0]).join(', ')}. ${p.travel.length} journeys abroad are on record for the last six years, the most recent to ${p.travel[0].to}. ${verdict}`)}</p>`)}
    <div class="sign"><div>Electronically signed<b>${esc(p.officer)}</b><span class="mono">${dEU(signed)} ${d2(signed.getHours())}:${d2(signed.getMinutes())} CET · SHA-256 ${hex(p.seed + 'sig')}</span></div>
      <div>Reviewed<b>Head of section</b><span class="mono">${dEU(p.now)} · ref. ${hex(p.seed + 'rev', 12).toUpperCase()}</span></div></div>
    ${foot(p, 4)}</article>`;
}

// ───────── fingerprints: grown with the Vingerafdruk algorithm (Gabor filtering, SFinGe-style) ─────────
const VPAT = { UL: 'ulnair', RL: 'radiaal', W: 'krul', DL: 'dubbel', A: 'boog', TA: 'tentboog' };
const printCache = new Map();
let growCanvas = null;
async function scanPrints(p) {
  const V = window.Vinger;
  if (!V) return;
  growCanvas ||= document.createElement('canvas');
  for (let i = 0; i < 10; i++) {
    if (current !== p) return;
    const box = document.querySelector(`.scan[data-i="${i}"]`); if (!box) return;
    const f = p.fingers[i], key = `${f.seed}|${f.type}|${i}`;
    let hit = printCache.get(key);
    if (!hit) {
      box.firstElementChild.textContent = 'Scanning…';
      try {
        const res = await V.generate({ seed: f.seed % 2147483647 + 1, pattern: VPAT[f.type], hand: i < 5 ? 'rechts' : 'links', finger: V.FINGERS[i % 5], minutiae: 'normaal' }, growCanvas,
          (k, n) => { if (current === p) box.firstElementChild.textContent = `Scanning… ${Math.round(k / n * 100)}%`; });
        hit = { canvas: V.paint(res.plan, res.v, res.an, 'scanner', 1), minutiae: res.an.minutiae.length, pores: res.an.pores.length };
        printCache.set(key, hit);
        if (printCache.size > 60) printCache.delete(printCache.keys().next().value);
      } catch (e) { box.firstElementChild.textContent = 'Scan failed'; continue; }
    }
    if (current !== p) return;
    box.replaceChildren(hit.canvas.cloneNode ? copyCanvas(hit.canvas) : hit.canvas);
    const mn = document.querySelector(`[data-mn="${i}"]`); if (mn) mn.textContent = `${hit.minutiae} minutiae`;
    await new Promise(r => setTimeout(r, 0));
  }
  const total = p.fingers.map((f, i) => printCache.get(`${f.seed}|${f.type}|${i}`)?.minutiae || 0).reduce((a, b) => a + b, 0);
  const el = document.getElementById('mintotal'); if (el && current === p) el.textContent = `${total} minutiae over ten digits`;
}
function copyCanvas(c) { const d = document.createElement('canvas'); d.width = c.width; d.height = c.height; d.getContext('2d').drawImage(c, 0, 0); return d; }

// ───────── showing a file ─────────
let current = null;
function show(p, remember) {
  current = p;
  const where = `${p.home.city}, ${p.country.name}`;
  $('#desk').innerHTML = page1(p) + page2(p) + page3(p) + page4(p)
    + `<p class="fict">Dossier makes up every person, number and address at random. The ${AGENCY} does not exist; the photographs are AI-generated and show no real person.</p>`;
  loadPhotos(p);
  scanPrints(p);
  if (remember) {
    ST.hist = [{ seed: p.seed, opt: p.opt, name: p.name, fileNo: p.fileNo, where }, ...ST.hist.filter(h => !(h.seed === p.seed && JSON.stringify(h.opt) === JSON.stringify(p.opt)))].slice(0, 40); save();
    history.replaceState(null, '', '#' + [p.seed, p.opt.country, p.opt.eth, p.opt.sex].join('.'));
    scrollTo(0, 0);
  }
  document.title = `Dossier · ${p.name}`;
}
const m = /^#([0-9A-Z]{4,12})\.([A-Z]{0,2})\.([a-z]{0,2})\.([MF]?)$/.exec(location.hash);
if (m && (!m[2] || COUNTRIES[m[2]]) && (!m[3] || ETHNICITIES[m[3]])) show(generate({ seed: m[1], country: m[2], eth: m[3], sex: m[4] }), true);
else if (ST.hist[0]) show(generate({ seed: ST.hist[0].seed, ...ST.hist[0].opt }), false);
else show(generate({ ...ST.sel }), true);
window.__dossier = { generate, show, photoUrls, photoPrompt, get current() { return current; } };

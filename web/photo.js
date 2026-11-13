// Identification photographs from an AI image service. The prompt is built from the same facts that are written
// in the file (age, sex, descent, hair, eyes, glasses, build), and the seed comes from the file, so the same file
// always asks for the same picture.

const DESCENT = { eu: 'white European', af: 'Black', ea: 'East Asian', sa: 'South Asian', se: 'Southeast Asian', me: 'Middle Eastern', la: 'Latino' };

export function photoPrompt(p, view) {
  const f = p.face, man = p.sex === 'M';
  const who = `${p.age}-year-old ${DESCENT[p.eth]} ${man ? 'man' : 'woman'} of ${p.originDem} origin`;
  const hair = f.style === 'bald' ? 'bald head' : `${f.hairName} hair, ${f.hairDesc}`;
  const bits = [who, hair, `${f.eyeName} eyes`];
  if (man && f.beard !== 'none') bits.push(f.beardDesc);
  if (man && f.beard === 'none') bits.push('clean-shaven');
  if (f.glasses) bits.push(`${f.glassShape === 'round' ? 'round' : 'rectangular'} glasses`);
  bits.push(`${p.build} build`);
  bits.push({ tee: 'plain dark t-shirt', shirt: 'collared shirt', jacket: 'dark jacket over a white shirt' }[f.collar] || 'plain clothes');
  if (p.age > 55) bits.push('natural wrinkles');
  const pose = view === 'side'
    ? 'strict left side profile, head turned 90 degrees, face pointing to the left of the frame, ear visible'
    : 'facing the camera straight on, neutral expression, mouth closed, eyes open, both ears visible';
  return `Official identification photograph, head and shoulders, ${pose}. ${bits.join(', ')}. Plain light grey wall behind, even flat studio lighting, sharp focus, realistic skin texture, unretouched documentary photo, natural colours, no text, no watermark`;
}

// candidate image addresses, best first; the page tries them in turn
export function photoUrls(p, view, cfg) {
  const prompt = encodeURIComponent(photoPrompt(p, view));
  const seed = hash(p.seed + p.opt.country + p.opt.eth + p.opt.sex) % 1000000000;
  const size = 'width=640&height=800';
  const out = [];
  const model = cfg.model || 'flux';
  if (cfg.key) out.push(`https://gen.pollinations.ai/image/${prompt}?model=${model}&${size}&seed=${seed}&nologo=true&key=${encodeURIComponent(cfg.key)}`);
  out.push(`https://gen.pollinations.ai/image/${prompt}?model=${model}&${size}&seed=${seed}&nologo=true`);
  out.push(`https://image.pollinations.ai/prompt/${prompt}?model=${model}&${size}&seed=${seed}&nologo=true`);
  return out;
}

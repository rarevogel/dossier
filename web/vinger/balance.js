/* Vingerafdruk: from app.js — thins out some bifurcations so the minutiae mix looks natural, and the generate() pipeline. */
"use strict";

function balance(plan, v, an) {
  const r = rng(plan.seed ^ 0x2545f491), out = Float32Array.from(v), P = plan.P0;
  for (const m of an.minutiae) {
    if (m.type !== "splitsing" || r() > 0.55) continue;
    const s = r() < 0.5 ? 1 : -1, a = m.angle + s * 0.55;
    const cx = m.x + Math.cos(a) * P * 0.85, cy = m.y + Math.sin(a) * P * 0.85, rad = P * 0.36;
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
      if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d < rad) out[y * W + x] = Math.min(out[y * W + x], -0.6 * (1 - d / rad) - 0.2);
    }
  }
  return out;
}
async function generate(opts, growCanvas, onStep) {
  const plan = makePlan(opts);
  let v = await Gabor.grow(plan, growCanvas, onStep);
  let an = analyze(plan, v);
  v = balance(plan, v, an);
  an = analyze(plan, v);
  return { plan, v, an };
}

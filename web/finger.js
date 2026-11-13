// Shared helpers: a small seeded random generator, and the fingerprint pattern names used in the file.
// (The prints themselves are grown by the Vingerafdruk code in web/vinger/.)

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const PATTERNS = { UL: 'Ulnar loop', RL: 'Radial loop', W: 'Whorl', DL: 'Double loop', A: 'Arch', TA: 'Tented arch' };

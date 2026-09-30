// Paints the texture layers of the 3D mannequin on canvases: skin, makeup, freckles, tattoos, scars, hair strands and cloth weave.
// The layouts must match the UV maps written by scripts/blender/build_bartender.py (see its UV LAYOUT notes).
import faceParts from '../data/character/faceParts.json';
import { SKIN, type Look3dInput } from './character3d';

type Ctx = CanvasRenderingContext2D;
const canvas = (size: number, height = size) => { const element = document.createElement('canvas'); element.width = size; element.height = height; return element; };

// ---- HEAD atlas: front of the head is a planar x,z projection into u 0.005..0.745
const HEAD = { x0: .005, x1: .745, halfWidth: .13, centreZ: 1.605, halfHeight: .135 };
const headPoint = (x: number, z: number, size: number) => ({
  x: (HEAD.x0 + (x / HEAD.halfWidth * .5 + .5) * (HEAD.x1 - HEAD.x0)) * size,
  y: (1 - (z - HEAD.centreZ) / HEAD.halfHeight * .5 - .5) * size
});
const headScale = (metres: number, size: number) => metres / HEAD.halfWidth * .5 * (HEAD.x1 - HEAD.x0) * size;

const SEED = (text: string) => { let h = 2166136261; for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; return (h & 0xffff) / 0xffff; }; };

const BLUSH: Record<string, string> = { soft: '#c8797940', peach: '#dc8a6650', rose: '#c9567355', bronze: '#98634450', draped: '#b84d6b55' };
const SHADOW: Record<string, string> = { nude: '#a6786688', bronze: '#9b5b2fbb', rose: '#a65970bb', smoky: '#211b28dd', gold: '#d2a33bcc', plum: '#6c315acc', blue: '#345f94cc', emerald: '#2c735fcc', neon: '#ef3da9dd' };

function eyeCentre(look: Look3dInput, sign: number) {
  const p = (faceParts.eyes as Record<string, { spacing: number; tilt: number; size: number }>)[look.eyeShape ?? 'almond']!;
  return { x: (.043 + p.spacing * .006) * sign, z: 1.625, tilt: p.tilt, size: p.size };
}

export function paintHead(look: Look3dInput, target = canvas(512)) {
  const size = target.width;
  const g = target.getContext('2d')!;
  const tone = SKIN[look.skinTone ?? 'warm'] ?? SKIN.warm!;
  const tan = { none: 0, 'sun-kissed': .12, deep: .26 }[look.tanLevel ?? 'none'] ?? 0;
  g.fillStyle = tone; g.fillRect(0, 0, size, size);
  if (tan) { g.fillStyle = `rgba(60,25,10,${tan})`; g.fillRect(0, 0, size, size); }
  // soft shading so the skin is not flat: darker at the temples and under the chin
  const shade = g.createRadialGradient(headPoint(0, 1.6, size).x, headPoint(0, 1.6, size).y, headScale(.02, size), headPoint(0, 1.6, size).x, headPoint(0, 1.6, size).y, headScale(.13, size));
  shade.addColorStop(0, 'rgba(255,255,255,.06)'); shade.addColorStop(1, 'rgba(30,10,5,.16)');
  g.fillStyle = shade; g.fillRect(0, 0, size * .75, size);

  const blob = (x: number, z: number, rx: number, rz: number, color: string) => {
    const c = headPoint(x, z, size);
    const gradient = g.createRadialGradient(c.x, c.y, 0, c.x, c.y, headScale(rx, size));
    gradient.addColorStop(0, color); gradient.addColorStop(1, color.slice(0, 7) + '00');
    g.save(); g.translate(c.x, c.y); g.scale(1, rz / rx); g.translate(-c.x, -c.y); g.fillStyle = gradient;
    g.beginPath(); g.arc(c.x, c.y, headScale(rx, size), 0, Math.PI * 2); g.fill(); g.restore();
  };
  if (BLUSH[look.blush ?? 'none']) for (const sign of [1, -1]) blob(.062 * sign, 1.565, .038, .03, BLUSH[look.blush!]!);
  for (const sign of [1, -1]) {
    const eye = eyeCentre(look, sign);
    const shadow = SHADOW[look.eyeshadow ?? 'none'];
    if (shadow) blob(eye.x, eye.z + .012, .032, .017, shadow);
    liner(g, look.eyeliner ?? 'none', eye, sign, size);
  }
  if (look.skinDetail === 'freckles') {
    const random = SEED('freckles');
    g.fillStyle = 'rgba(110,60,35,.55)';
    for (let i = 0; i < 90; i++) {
      const angle = random() * Math.PI * 2, radius = Math.sqrt(random());
      for (const [cx, cz, rx, rz] of [[.05, 1.575, .05, .022], [-.05, 1.575, .05, .022], [0, 1.59, .03, .02]] as const) {
        if (random() > .5) continue;
        const c = headPoint(cx + Math.cos(angle) * rx * radius, cz + Math.sin(angle) * rz * radius, size);
        g.beginPath(); g.arc(c.x, c.y, headScale(.0014 + random() * .0016, size), 0, Math.PI * 2); g.fill();
      }
    }
  }
  if (look.skinDetail === 'scar-brow') scar(g, [[.05, 1.685], [.045, 1.665], [.04, 1.645]], size, -1);
  if (look.skinDetail === 'scar-cheek') scar(g, [[-.075, 1.575], [-.055, 1.555], [-.04, 1.535]], size, 1);
  return target;
}

function liner(g: Ctx, style: string, eye: { x: number; z: number; tilt: number; size: number }, sign: number, size: number) {
  if (style === 'none') return;
  const half = .019 * eye.size;
  const inner = headPoint(eye.x - sign * half, eye.z + .003 - eye.tilt * .0015, size), outer = headPoint(eye.x + sign * half, eye.z + .003 + eye.tilt * .004, size);
  const top = headPoint(eye.x, eye.z + .0125, size);
  g.lineCap = 'round';
  const stroke = (width: number, color: string, wing = 0, dz = 0) => {
    g.strokeStyle = color; g.lineWidth = headScale(width, size);
    g.beginPath(); g.moveTo(inner.x, inner.y + dz); g.quadraticCurveTo(top.x, top.y + dz, outer.x, outer.y + dz);
    if (wing) { const tip = headPoint(eye.x + sign * (half + wing), eye.z + .014, size); g.lineTo(tip.x, tip.y + dz); }
    g.stroke();
  };
  if (style === 'fine') stroke(.0012, '#1a1416cc');
  else if (style === 'winged') stroke(.002, '#120d10ee', .014);
  else if (style === 'smoky') { stroke(.007, '#211b2866'); stroke(.003, '#120d10dd'); }
  else if (style === 'graphic') stroke(.0035, '#0d0a0cff', .02);
  else if (style === 'double-wing') { stroke(.002, '#120d10ee', .014); stroke(.0016, '#120d10cc', .022, headScale(.004, size)); }
}

function scar(g: Ctx, points: [number, number][], size: number, dir: number) {
  const px = points.map(([x, z]) => headPoint(x, z, size));
  g.strokeStyle = 'rgba(190,120,110,.85)'; g.lineWidth = headScale(.0022, size); g.lineCap = 'round';
  g.beginPath(); g.moveTo(px[0]!.x, px[0]!.y); for (const p of px.slice(1)) g.lineTo(p.x, p.y); g.stroke();
  g.strokeStyle = 'rgba(90,40,40,.55)'; g.lineWidth = headScale(.0009, size); g.stroke();
  g.strokeStyle = 'rgba(230,200,190,.8)'; g.lineWidth = headScale(.0008, size);
  for (let i = 1; i < px.length; i++) { const p = px[i]!; g.beginPath(); g.moveTo(p.x - dir * headScale(.004, size), p.y - headScale(.003, size)); g.lineTo(p.x + dir * headScale(.004, size), p.y + headScale(.003, size)); g.stroke(); }
}

// ---- BODY atlas: per-limb cylindrical cells (u = angle around the limb, 0.5 = front; v = height)
export const BODY_CELLS = { torso: [0, .5, 1, 1], armL: [0, 0, .25, .5], armR: [.25, 0, .5, .5], legL: [.5, 0, .75, .5], legR: [.75, 0, 1, .5] } as const;
const CELL_Z: Record<keyof typeof BODY_CELLS, [number, number]> = { torso: [.9, 1.5], armL: [.75, 1.45], armR: [.75, 1.45], legL: [0, 1], legR: [0, 1] };
function cell(name: keyof typeof BODY_CELLS, size: number) {
  const [x0, y0, x1, y1] = BODY_CELLS[name];
  const [z0, z1] = CELL_Z[name];
  const w = (x1 - x0) * size, h = (y1 - y0) * size;
  // u: 0..1 around the limb, z: metres up the body
  return { at: (u: number, z: number) => ({ x: x0 * size + (.01 + u * .98) * w, y: (1 - y0 - (.01 + (z - z0) / (z1 - z0) * .98) * (y1 - y0)) * size }), w, h, span: (z1 - z0) };
}

export function paintBody(look: Look3dInput, target = canvas(1024)) {
  const size = target.width;
  const g = target.getContext('2d')!;
  const tone = SKIN[look.skinTone ?? 'warm'] ?? SKIN.warm!;
  const tan = { none: 0, 'sun-kissed': .12, deep: .26 }[look.tanLevel ?? 'none'] ?? 0;
  g.fillStyle = tone; g.fillRect(0, 0, size, size);
  if (tan) { g.fillStyle = `rgba(60,25,10,${tan})`; g.fillRect(0, 0, size, size); }
  const detail = look.skinDetail ?? 'clean';
  if (detail === 'freckles') {
    const random = SEED('body-freckles'); g.fillStyle = 'rgba(110,60,35,.45)';
    for (const name of ['armL', 'armR', 'torso'] as const) {
      const c = cell(name, size);
      for (let i = 0; i < 160; i++) { const p = c.at(random(), (name === 'torso' ? 1.3 : 1.1) + random() * .18); g.beginPath(); g.arc(p.x, p.y, size * .0012 + random() * size * .0012, 0, Math.PI * 2); g.fill(); }
    }
  }
  if (detail === 'tattoo-light' || detail === 'tattoo-bold') {
    const bold = detail === 'tattoo-bold';
    g.strokeStyle = bold ? 'rgba(20,24,30,.9)' : 'rgba(45,70,90,.55)'; g.fillStyle = g.strokeStyle; g.lineCap = 'round';
    // left arm: a serpent winding down the forearm, plus bands
    const arm = cell('armL', size);
    g.lineWidth = size * (bold ? .0045 : .0028);
    g.beginPath();
    for (let i = 0; i <= 40; i++) { const t = i / 40; const p = arm.at(.5 + Math.sin(t * Math.PI * 4) * .22, 1.36 - t * .5); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }
    g.stroke();
    for (const z of [1.38, .9]) { g.beginPath(); const a = arm.at(.25, z), b = arm.at(.75, z); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
    // chest: a compass on the torso front
    const chest = cell('torso', size);
    const c = chest.at(.5, 1.3);
    for (const r of [.03, .045]) { g.beginPath(); g.arc(c.x, c.y, size * r * .8, 0, Math.PI * 2); g.stroke(); }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x + Math.cos(a) * size * .05, c.y + Math.sin(a) * size * .05); g.stroke(); }
  }
  if (detail === 'scar-brow' || detail === 'scar-cheek') { /* face scars live on the head atlas */ }
  return target;
}

// ---- HAIR strands (grey scale, multiplied with the hair colour) and cloth weaves
export function paintHair(target = canvas(256)) {
  const g = target.getContext('2d')!; const size = target.width;
  g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, size, size);
  const random = SEED('hair');
  for (let i = 0; i < 520; i++) { const v = 150 + Math.floor(random() * 105); g.strokeStyle = `rgba(${v},${v},${v},.55)`; g.lineWidth = 1 + random() * 1.5; const x = random() * size; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (random() - .5) * 8, size); g.stroke(); }
  return target;
}
export function paintCloth(pattern: 'plain' | 'pinstripe' | 'check' = 'plain', target = canvas(128)) {
  const g = target.getContext('2d')!; const size = target.width;
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, size, size);
  g.fillStyle = 'rgba(0,0,0,.06)';
  for (let i = 0; i < size; i += 2) { g.fillRect(i, 0, 1, size); g.fillRect(0, i, size, 1); }   // fine weave
  if (pattern === 'pinstripe') { g.fillStyle = 'rgba(255,255,255,.55)'; for (let x = 6; x < size; x += 16) g.fillRect(x, 0, 2, size); }
  if (pattern === 'check') { g.fillStyle = 'rgba(0,0,0,.18)'; for (let x = 0; x < size; x += 32) g.fillRect(x, 0, 16, size); for (let y = 0; y < size; y += 32) g.fillRect(0, y, size, 16); }
  return target;
}

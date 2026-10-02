import manifestData from './paintedManifest';
import { DEFAULTS, RIGS, type Look, type ModelKind } from './rig';
import type { AssetLayer } from './art';

type Bitmap = { file: string; bounds: readonly number[] };
const manifest = manifestData as unknown as Record<ModelKind, { rig: string; assets: Record<string, Bitmap> }>;
const paintedPalette = (model: ModelKind) => model === 'woman'
  ? { skin: '#bf895d', hairColor: '#322017', iris: '#8b7242', lips: '#a85842', primary: '#682b31', secondary: '#412627', trim: '#dec18a' }
  : DEFAULTS.man;
export const paintedLook = (model: ModelKind): Look => ({ ...DEFAULTS[model], ...paintedPalette(model), makeup: 'none' });
const faceMatches = (look: Look, model: ModelKind) => (['eyes', 'brows', 'nose', 'mouth'] as const).every(k => look[k] === DEFAULTS[model][k]);
export function isPaintedLook(look: Look, model: ModelKind) {
  return faceMatches(look, model) && look.makeup === 'none' && look.hair === DEFAULTS[model].hair && look.outfit === DEFAULTS[model].outfit && (look.accessory === DEFAULTS[model].accessory || look.accessory === 'none');
}
const channels = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
export function paintedDefinitions(look: Look, model: ModelKind) {
  const palette = paintedPalette(model);
  const relative = (id: string, color: string, reference: string) => `<filter id="paint-${id}" color-interpolation-filters="sRGB"><feComponentTransfer>${channels(color).map((c, i) => `<feFunc${'RGB'[i]} type="linear" slope="${c / channels(reference)[i]}"/>`).join('')}</feComponentTransfer></filter>`;
  const tint = (id: string, color: string) => `<filter id="paint-${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer>${channels(color).map((c, i) => `<feFunc${'RGB'[i]} type="table" tableValues="${c * .06} ${c * .5} ${c} ${c + (1 - c) * .4} .97"/>`).join('')}</feComponentTransfer></filter>`;
  return `<defs>${relative('skin', look.skin, palette.skin)}${model === 'woman' ? relative('hair', look.hairColor, palette.hairColor) : tint('hair', look.hairColor)}${relative('iris', look.iris, palette.iris)}${relative('lips', look.lips, palette.lips)}${relative('primary', look.primary, palette.primary)}${relative('secondary', look.secondary, palette.secondary)}${relative('trim', look.trim, palette.trim)}</defs>`;
}
export function applyPaintedLayers(layers: AssetLayer[], look: Look, model: ModelKind, canonicalBody: string): AssetLayer[] {
  const library = manifest[model];
  if (library.rig !== RIGS[model].id) throw new Error('Painted asset rig mismatch');
  const a = library.assets;
  const image = (name: string, filter?: string, bounds?: readonly number[]) => {
    const asset = a[name]; if (!asset) throw new Error(`Missing painted component ${model}/${name}`);
    const [x, y, w, h] = bounds || asset.bounds;
    return `<image data-bitmap="${name}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="none" href="/assets/Character/Painted/${model}/${asset.file}"${filter ? ` filter="url(#paint-${filter})"` : ''}/>`;
  };
  const clippedBody = (id: string, content: string) => `<defs><mask id="paint-body-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="1000" style="mask-type:alpha">${canonicalBody}</mask></defs><g mask="url(#paint-body-${id})">${content}</g>`;
  const masked = (id: string, mask: string, content: string) => `<defs><mask id="paint-mask-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="600" height="1000" style="mask-type:alpha">${image(mask)}</mask></defs><g mask="url(#paint-mask-${id})">${content}</g>`;
  const face = faceMatches(look, model), outfit = look.outfit === DEFAULTS[model].outfit;
  const result = layers.map(asset => {
    let svg: string | undefined;
    if (asset.layer === 'body' && outfit) svg = clippedBody('base', image('skin', 'skin') + (model === 'man' ? image('handLeft', 'skin') + image('handRight', 'skin') : ''));
    if (look.hair === DEFAULTS[model].hair && asset.layer === 'hairBack') svg = image('hairBack', 'hair');
    if (look.hair === DEFAULTS[model].hair && asset.layer === 'hairFront') svg = image('hairFront', 'hair');
    if (face && asset.layer === 'eyes') {
      const iris = image('irisPaint', 'iris');
      svg = `<g class="eye-open" style="transform-origin:300px 151px">${masked('eyes', 'aperture', image('sclera') + `<g class="gaze">${iris}${image('catchlights')}</g>`)}${image('eyes', 'skin')}</g><g class="eye-shut">${image('blink', 'skin')}</g>`;
    }
    if (face && asset.layer === 'brows') svg = image('brows', 'skin');
    if (face && asset.layer === 'nose') svg = image('nose', 'skin');
    if (face && asset.layer === 'mouth') svg = image('mouth', 'skin') + masked('lips', 'lipMask', image('mouth', 'lips'));
    if (outfit && asset.layer === 'clothing') svg = image('outfit') + masked('primary', 'primaryMask', image('outfit', 'primary')) + masked('secondary', 'secondaryMask', image('outfit', 'secondary')) + (model === 'woman' ? masked('embroidery', 'trimMask', image('outfit', 'trim')) : '');
    if (outfit && asset.layer === 'clothingOverlay') svg = (model === 'man' ? image('collar', 'secondary') : '') + image('belt') + masked('belt', 'beltMask', image('belt', 'trim')) + image('shoes');
    if (asset.layer === 'accessories' && look.accessory === DEFAULTS[model].accessory) svg = image('accessory', 'trim');
    return svg === undefined ? asset : { ...asset, svg: `<g data-art="painted-raster">${svg}</g>` };
  });
  if (face) result.push({ id: 'Base/Face', layer: 'face', rig: RIGS[model].id, svg: `<g data-art="painted-raster">${clippedBody('face', image('face', 'skin'))}</g>` });
  return result.sort((x, y) => RIGS[model].layers.indexOf(x.layer) - RIGS[model].layers.indexOf(y.layer));
}

/** Keep the existing standalone SVG export format by embedding every painted PNG. */
export async function embedPaintedImages(svg: string): Promise<string> {
  const urls = [...new Set([...svg.matchAll(/href="(\/assets\/Character\/Painted\/[^"<>]+)"/g)].map(m => m[1]))];
  const entries = await Promise.all(urls.map(async url => {
    const response = await fetch(url); if (!response.ok) throw new Error(`Unable to export ${url}`);
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
    return [url, data] as const;
  }));
  for (const [url, data] of entries) svg = svg.replaceAll(`href="${url}"`, `href="${data}"`);
  return svg;
}

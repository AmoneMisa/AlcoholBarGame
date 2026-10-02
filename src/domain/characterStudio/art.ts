import { RIG, RIGS, type ModelKind, type Layer, type Look, validateLook } from './rig';
import { composeManLayers, MAN_BODY } from './manArt';
import { applyPaintedLayers, paintedDefinitions } from './painted';

// All paths live in the same full-size canvas. No variant may transform the rig.
const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
export const BODY = `<g stroke="#926c62" stroke-width="1.3" stroke-linejoin="round">
${path('M277 207 L276 232 Q265 244 240 249 Q222 252 215 279 L195 392 L177 527 Q173 547 179 565 Q183 573 187 563 L189 544 L192 569 Q197 577 199 566 L200 544 Q209 551 210 542 L208 522 L231 401 L246 310 Q252 346 258 371 Q268 400 257 432 Q236 472 244 535 L256 716 L255 914 Q239 931 243 943 Q261 953 283 940 L291 732 L300 559 L309 732 L317 940 Q339 953 357 943 Q361 931 345 914 L344 716 L356 535 Q364 472 343 432 Q332 400 342 371 Q348 346 354 310 L369 401 L392 522 L390 542 Q391 551 400 544 L401 566 Q403 577 408 569 L411 544 L413 563 Q417 573 421 565 Q427 547 423 527 L405 392 L385 279 Q378 252 360 249 Q335 244 324 232 L323 207 Z', 'url(#skin)')}
${path('M254 140 Q240 137 242 163 Q243 182 253 182 M346 140 Q360 137 358 163 Q357 182 347 182', 'url(#skin)')}
${path('M250 134 Q250 91 300 87 Q350 91 350 134 L346 175 Q340 204 300 220 Q260 204 254 175 Z', 'url(#skin)')}
</g><g fill="none" stroke="#b17d6e" stroke-width="1.2" opacity=".45"><path d="M277 235 Q286 252 300 258 Q314 252 323 235 M244 263 Q264 257 283 266 M317 266 Q336 257 356 263 M295 404 Q300 410 305 404 M260 712 Q270 721 280 712 M320 712 Q330 721 340 712"/></g>`;

function shade(hex: string, amount: number) {
  return '#' + [1, 3, 5].map(index => {
    const value = parseInt(hex.slice(index, index + 2), 16);
    return Math.round(amount > 0 ? value + (255 - value) * amount : value * (1 + amount)).toString(16).padStart(2, '0');
  }).join('');
}
function definitions(look: Look) {
  return `<defs>
  <linearGradient id="skin" x1="0" x2="1" y2=".3"><stop stop-color="${shade(look.skin, -.12)}"/><stop offset=".35" stop-color="${shade(look.skin, .2)}"/><stop offset=".65" stop-color="${look.skin}"/><stop offset="1" stop-color="${shade(look.skin, -.22)}"/></linearGradient>
  ${[['hair', look.hairColor], ['fabric', look.primary], ['secondary', look.secondary], ['metal', look.trim]].map(([id, color]) => `<linearGradient id="${id}" x1="0" x2="1" y2=".25"><stop stop-color="${shade(color, -.25)}"/><stop offset=".28" stop-color="${color}"/><stop offset=".4" stop-color="${shade(color, .2)}"/><stop offset=".52" stop-color="${color}"/><stop offset=".83" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -.4)}"/></linearGradient>`).join('')}
  <radialGradient id="rouge"><stop stop-color="#d98287" stop-opacity=".4"/><stop offset="1" stop-color="#d98287" stop-opacity="0"/></radialGradient>
  </defs>`;
}
const hairBack = {
  cascade: 'M245 113 Q236 72 300 70 Q364 72 355 113 Q377 193 367 266 Q357 316 379 367 Q354 359 346 327 Q348 397 323 422 L274 418 Q246 384 251 329 Q239 366 221 368 Q243 315 233 265 Q224 190 245 113 Z',
  bob: 'M246 104 Q259 73 300 75 Q354 76 362 137 L369 241 Q347 266 324 243 L276 243 Q248 266 231 241 L237 137 Z',
  updo: 'M259 107 Q226 76 250 54 Q267 41 286 53 Q314 28 340 56 Q368 77 341 109 L356 165 Q343 213 324 224 L276 224 Q257 208 244 165 Z',
};
const hairFront = {
  cascade: 'M250 147 Q234 108 261 89 Q293 69 324 87 Q363 94 350 157 Q341 126 303 104 Q289 128 250 147 Z M249 139 Q241 207 258 273 Q234 252 239 184 Z M348 141 Q359 202 341 288 Q365 268 361 193 Z',
  bob: 'M249 151 Q232 116 257 91 Q287 72 323 87 Q361 96 350 152 L337 126 L337 144 L310 127 L300 103 Q287 138 249 151 Z M248 145 L249 240 L237 232 Z M352 145 L363 231 L351 242 Z',
  updo: 'M249 153 Q233 106 267 88 Q307 71 336 91 Q363 105 350 155 Q339 115 300 103 Q285 127 249 153 Z M247 151 Q237 195 249 228 Q243 184 254 158 Z M348 148 Q363 183 349 234 Q355 185 342 159 Z',
};

export interface AssetLayer { id: string; layer: Layer; rig: string; svg: string; motion?: 'hair' | 'fabric' | 'accessory' }
export function composeLayers(look: Look, model: ModelKind = 'woman'): AssetLayer[] {
  if (!validateLook(look, model)) throw new Error('Invalid character selection or color for this mannequin');
  if (model === 'man') return composeManLayers(look);
  const result: AssetLayer[] = [];
  const add = (layer: Layer, id: string, svg: string, motion?: AssetLayer['motion']) => result.push({ layer, id, rig: RIG.id, svg, motion });
  const hair = look.hair as keyof typeof hairBack;
  add('hairBack', `Hair/Back/${hair}`, path(hairBack[hair], 'url(#hair)', 'stroke="#302731" stroke-width="1.5"'), 'hair');
  add('body', 'Base/Body', BODY);
  const eyes = { almond: 'M-16 0 Q0 -13 16 0 Q1 10 -16 0Z', round: 'M-16 0 Q0 -18 16 0 Q0 15 -16 0Z', soft: 'M-16 0 Q0 -8 16 0 Q0 10 -16 0Z' };
  add('eyes', `Face/Eyes/${look.eyes}`, [274, 326].map((x, i) => `<g transform="translate(${x} 151)"><defs><clipPath id="eye-${i}">${path(eyes[look.eyes], '#fff')}</clipPath></defs><g class="eye-open">${path(eyes[look.eyes], '#fff9f0')}<g clip-path="url(#eye-${i})"><g class="gaze"><ellipse cy="0" rx="7" ry="9" fill="${look.iris}"/><ellipse cy="1" rx="3.2" ry="6" fill="#25232f"/><circle cx="-2.5" cy="-4" r="2.2" fill="white"/><circle cx="3" cy="4" r="1" fill="white"/></g></g>${path(eyes[look.eyes], 'none', 'stroke="#47303b" stroke-width="1.5"')}<path d="M-16 0 l-3 -3 M16 0 l3 -3" stroke="#47303b" fill="none"/></g><path class="eye-shut" d="M-16 0 Q0 6 16 0" stroke="#47303b" stroke-width="1.7" fill="none"/></g>`).join(''));
  const brows = { arched: 'M-16 1 Q-2 -8 15 -1', straight: 'M-16 -1 Q0 -3 15 -1', gentle: 'M-16 2 Q0 -3 15 0' };
  add('brows', `Face/Eyebrows/${look.brows}`, [274, 326].map(x => `<g transform="translate(${x} 135)">${path(brows[look.brows], 'none', `stroke="${look.hairColor}" stroke-width="2.8" stroke-linecap="round"`)}</g>`).join(''));
  add('nose', `Face/Nose/${look.nose}`, path(look.nose === 'soft' ? 'M298 161 Q295 173 297 175 Q300 178 304 175' : 'M300 159 L296 174 Q300 179 306 174', 'none', 'stroke="#b17d6e" stroke-width="1.4"'));
  const mouths = { neutral: 'M288 192 Q295 187 300 190 Q305 187 312 192 Q300 200 288 192Z', smile: 'M287 191 Q300 198 313 191 Q300 207 287 191Z', full: 'M286 192 Q294 184 300 188 Q306 184 314 192 Q300 206 286 192Z' };
  add('mouth', `Face/Mouth/${look.mouth}`, `${path(mouths[look.mouth], look.lips)}<path d="M289 192 Q300 ${look.mouth === 'smile' ? 199 : 194} 311 192" stroke="#824d59" fill="none" stroke-width=".8"/><path d="M296 197 L303 197" stroke="#fff" opacity=".4"/>`);
  if (look.makeup !== 'none') add('makeup', `Face/Makeup/${look.makeup}`, look.makeup === 'blush' ? '<ellipse cx="272" cy="175" rx="18" ry="11" fill="url(#rouge)"/><ellipse cx="328" cy="175" rx="18" ry="11" fill="url(#rouge)"/>' : [268, 275, 281, 319, 325, 332].map((x, i) => `<circle cx="${x}" cy="${173 + i % 3 * 3}" r="1" fill="#a37362"/>`).join(''));
  const evening = look.outfit === 'evening';
  add('clothing', `Clothing/${evening ? 'Dresses/evening' : 'Tops/tailored'}`, evening
    ? `${path('M251 253 L263 251 L271 285 Q300 309 329 285 L337 251 L349 253 L338 336 Q329 370 335 405 L265 405 Q271 370 262 336 Z', 'url(#fabric)')}${path('M265 400 L335 400 Q350 445 351 484 L382 914 Q300 943 218 914 L249 484 Q250 445 265 400Z', 'url(#fabric)')}`
    : `${path('M259 405 L341 405 L351 495 L340 923 L309 923 L300 554 L291 923 L260 923 L249 495Z', 'url(#fabric)')}${path('M276 238 L300 260 L324 238 L358 254 L370 312 L350 323 L335 401 L265 401 L250 323 L230 312 L242 254Z', 'url(#secondary)')}${path('M265 246 L278 242 L299 333 L322 242 L335 246 L332 361 L346 442 L302 420 L254 442 L268 361Z', 'url(#fabric)')}`);
  add('clothingOverlay', `Clothing/Overlays/${look.outfit}`, `${path(evening ? 'M270 287 Q300 314 330 287 L327 313 Q300 338 273 313Z' : 'M278 243 L300 263 L292 287 L268 255Z M322 243 L300 263 L308 287 L332 255Z', 'url(#secondary)')}${path('M264 396 Q300 407 336 396 L338 409 Q300 420 262 409Z', 'url(#metal)')}<g fill="none" stroke="${look.trim}" stroke-width="1.3" opacity=".65">${evening ? '<path d="M268 432 Q277 655 242 903 M285 438 Q294 663 276 915 M315 438 Q306 663 324 915 M332 432 Q323 655 358 903 M222 904 Q300 933 378 904"/>' : '<path d="M273 450 L272 904 M327 450 L328 904 M278 250 L297 334 L276 387 M322 250 L303 334 L324 387"/>'}</g><g fill="url(#metal)"><circle cx="300" cy="405" r="7"/><circle cx="300" cy="${evening ? 316 : 348}" r="3"/></g>${path('M255 918 L283 919 L283 942 Q260 955 241 943Z M317 919 L345 918 L359 943 Q340 955 317 942Z', 'url(#secondary)')}`, 'fabric');
  add('hairFront', `Hair/Front/${look.hair}`, `${path(hairFront[hair], 'url(#hair)', 'stroke="#302731" stroke-width="1"')}<g fill="none" stroke="#fff3df" stroke-width="1" opacity=".17"><path d="M250 123 Q265 98 289 94 M255 129 Q277 116 291 100 M309 95 Q337 107 344 131 M314 94 Q343 107 349 129"/></g>`);
  if (look.accessory !== 'none') add('accessories', `Accessories/${look.accessory}`, look.accessory === 'pearls'
    ? `<path d="M272 237 Q300 277 328 237" stroke="${look.trim}" fill="none"/>${Array.from({ length: 9 }, (_, i) => `<circle cx="${276 + i * 6}" cy="${245 + Math.sin(i / 8 * Math.PI) * 14}" r="3.2" fill="#fff1da" stroke="${look.trim}" stroke-width=".7"/>`).join('')}`
    : [247, 353].map(x => `<circle cx="${x}" cy="178" r="2.5" fill="url(#metal)"/><path d="M${x} 181 v12" stroke="${look.trim}"/>${path(`M${x + 4} 193 A8 8 0 1 0 ${x + 4} 207 A7 7 0 0 1 ${x + 4} 193`, 'url(#metal)')}<circle cx="${x}" cy="210" r="2" fill="#f8e9c9"/>`).join(''), 'accessory');
  return result.sort((a, b) => RIG.layers.indexOf(a.layer) - RIG.layers.indexOf(b.layer));
}
export function composeRenderLayers(look: Look, model: ModelKind = 'woman'): AssetLayer[] {
  return applyPaintedLayers(composeLayers(look, model), look, model, model === 'woman' ? BODY : MAN_BODY);
}
export function renderSvg(look: Look, onlyLayer?: AssetLayer, anchors = false, model: ModelKind = 'woman'): string {
  if (!validateLook(look, model)) throw new Error('Incompatible look');
  const rig = RIGS[model];
  if (onlyLayer && onlyLayer.rig !== rig.id) throw new Error('Cross-mannequin asset mixing is forbidden');
  const layers = onlyLayer ? [onlyLayer] : composeRenderLayers(look, model);
  const pivots = Object.entries(rig.pivots).map(([name, [x, y]]) => `--pivot-${name}:${x}px ${y}px`).join(';');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="1000" viewBox="0 0 600 1000" data-rig="${rig.id}" style="${pivots}" role="img" aria-label="Modular ${model} character preview"><style>.eye-shut{display:none}</style>${definitions(look)}${paintedDefinitions(look, model)}<g class="rig">${layers.map(asset => `<g data-layer="${asset.layer}" data-asset="${asset.id}" class="${asset.motion || ''}">${asset.svg}</g>`).join('')}</g>${anchors ? Object.entries(rig.anchors).map(([name, [x, y]]) => `<g fill="#bbfcdd"><circle cx="${x}" cy="${y}" r="3"/><text x="${x + 5}" y="${y - 6}" font-size="9">${name}</text></g>`).join('') : ''}</svg>`;
}

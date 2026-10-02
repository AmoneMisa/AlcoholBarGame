import { MAN_RIG, type Look, type Layer } from './rig';
import type { AssetLayer } from './art';

const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
// A separately authored immutable male mannequin. Not a scaled or warped female body.
export const MAN_BODY = `<g stroke="#926c62" stroke-width="1.3" stroke-linejoin="round">
${path('M274 208 L274 232 Q256 242 223 249 Q204 252 197 281 L182 401 L162 539 Q157 556 162 577 Q166 587 170 576 L172 557 L175 582 Q180 591 184 578 L185 555 Q194 565 197 555 L194 536 L216 407 L237 320 Q246 360 253 387 L256 422 Q245 459 249 515 L257 707 L254 911 Q237 927 234 940 Q251 953 283 942 L294 711 L300 548 L306 711 L317 942 Q349 953 366 940 Q363 927 346 911 L343 707 L351 515 Q355 459 344 422 L347 387 Q354 360 363 320 L384 407 L406 536 L403 555 Q406 565 415 555 L416 578 Q420 591 425 582 L428 557 L430 576 Q434 587 438 577 Q443 556 438 539 L418 401 L403 281 Q396 252 377 249 Q344 242 326 232 L326 208Z', 'url(#skin)')}
${path('M251 141 Q237 135 239 161 Q241 182 253 181 M349 141 Q363 135 361 161 Q359 182 347 181', 'url(#skin)')}
${path('M248 133 Q246 94 274 86 Q300 79 326 86 Q354 94 352 133 L348 180 L337 202 L314 219 Q300 224 286 219 L263 202 L252 180Z', 'url(#skin)')}
</g><g fill="none" stroke="#ad7c6a" stroke-width="1.2" opacity=".45"><path d="M274 236 L285 261 M326 236 L315 261 M234 265 Q256 258 282 267 M318 267 Q344 258 366 265 M260 329 Q278 337 295 330 M305 330 Q322 337 340 329 M296 420 Q300 425 304 420 M265 703 Q273 710 283 703 M317 703 Q327 710 335 703"/></g>`;

const BACK = {
  swept: 'M250 116 Q233 80 278 72 Q333 61 352 97 L360 150 L352 196 L337 214 L334 158 L266 158 L263 214 L248 196 L240 150Z',
  cropped: 'M245 125 Q243 82 279 78 Q334 68 354 110 L357 166 L347 182 L343 132 L257 132 L253 182 L243 166Z',
  tied: 'M246 123 Q236 83 278 76 Q334 66 354 105 Q373 180 356 237 Q379 289 351 347 Q336 321 340 278 L326 231 L274 231 Q241 213 243 173Z',
};
const FRONT = {
  swept: 'M248 153 Q238 125 246 109 Q229 109 244 90 Q260 71 297 73 Q332 60 347 84 Q361 99 351 145 L343 164 L339 121 Q326 123 302 107 Q277 133 254 130 L254 159Z',
  cropped: 'M247 158 Q239 126 248 104 Q257 83 281 82 L289 76 L295 82 L310 74 L317 82 Q346 81 353 109 L352 156 L344 164 L340 116 Q300 128 261 117 L255 163Z',
  tied: 'M247 154 Q232 113 257 89 Q291 67 326 84 Q361 95 354 148 L346 172 L340 129 Q317 120 301 101 Q283 125 259 137 L254 171Z M251 142 Q238 182 251 226 Q244 187 259 158Z',
};

export function composeManLayers(look: Look): AssetLayer[] {
  const result: AssetLayer[] = [];
  const add = (layer: Layer, id: string, svg: string, motion?: AssetLayer['motion']) => result.push({ layer, id, svg, rig: MAN_RIG.id, motion });
  const hair = look.hair as keyof typeof BACK;
  if (!BACK[hair]) throw new Error('Hair does not belong to male mannequin');
  add('hairBack', `Hair/Back/${hair}`, path(BACK[hair], 'url(#hair)', 'stroke="#302731" stroke-width="1.1"'), 'hair');
  add('body', 'Base/Body', MAN_BODY);
  const eyes = { almond: 'M-16 0 Q-1 -9 16 -1 Q2 9 -16 0Z', round: 'M-16 0 Q0 -13 16 0 Q0 11 -16 0Z', soft: 'M-16 0 Q1 -6 16 1 Q0 8 -16 0Z' };
  const eyeAnchors = [MAN_RIG.anchors.eyeLeft, MAN_RIG.anchors.eyeRight];
  add('eyes', `Face/Eyes/${look.eyes}`, eyeAnchors.map(([x, y], i) => `<g transform="translate(${x} ${y})"><defs><clipPath id="eye-${i}">${path(eyes[look.eyes], '#fff')}</clipPath></defs><g class="eye-open">${path(eyes[look.eyes], '#fff7eb')}<g clip-path="url(#eye-${i})"><g class="gaze"><ellipse rx="6.5" ry="8" fill="${look.iris}"/><ellipse rx="3" ry="5" fill="#242633"/><path d="M-5 3 Q0 8 5 3" stroke="#fff3bb" opacity=".45" fill="none"/><circle cx="-2" cy="-3" r="1.8" fill="white"/><circle cx="3" cy="3" r=".9" fill="white"/></g></g>${path(eyes[look.eyes], 'none', 'stroke="#403039" stroke-width="1.3"')}<path d="M-14 -6 Q0 -12 14 -6" fill="none" stroke="#b4887b" stroke-width=".7"/></g><path class="eye-shut" d="M-16 0 Q0 5 16 0" fill="none" stroke="#403039" stroke-width="1.6"/></g>`).join(''));
  const brows = { arched: 'M-17 2 Q-3 -8 16 -1 L14 2 Q-2 -3 -17 4Z', straight: 'M-17 -2 L14 -3 L17 1 L-17 2Z', gentle: 'M-17 1 Q0 -4 16 1 L14 3 Q0 0 -16 4Z' };
  add('brows', `Face/Eyebrows/${look.brows}`, [MAN_RIG.anchors.browLeft, MAN_RIG.anchors.browRight].map(([x, y]) => `<g transform="translate(${x} ${y})">${path(brows[look.brows], look.hairColor)}</g>`).join(''));
  add('nose', `Face/Nose/${look.nose}`, `<g transform="translate(${MAN_RIG.anchors.nose.join(' ')})">${path(look.nose === 'soft' ? 'M-1 -18 Q-5 -4 -3 0 Q1 4 6 0' : 'M0 -21 L-5 -2 Q0 5 7 -1 M-7 1 L-4 2 M5 2 L8 1', 'none', 'stroke="#ab7767" stroke-width="1.3"')}<path d="M1 -15 L2 -5" stroke="#fff2d9" opacity=".35"/></g>`);
  const mouths = { neutral: 'M-15 0 Q-5 -4 0 -2 Q6 -4 15 0 Q0 7 -15 0Z', smile: 'M-15 -1 Q0 4 15 -1 Q0 12 -15 -1Z', full: 'M-16 0 Q-7 -6 0 -3 Q7 -6 16 0 Q0 11 -16 0Z' };
  add('mouth', `Face/Mouth/${look.mouth}`, `<g transform="translate(${MAN_RIG.anchors.mouth.join(' ')})">${path(mouths[look.mouth], look.lips)}<path d="M-13 0 Q0 ${look.mouth === 'smile' ? 6 : 2} 13 0" stroke="#81554f" fill="none" stroke-width=".8"/><path d="M-4 5 L4 5" stroke="#fff3df" opacity=".4"/></g>`);
  if (look.makeup !== 'none') add('makeup', `Face/Makeup/${look.makeup}`, look.makeup === 'blush'
    ? '<ellipse cx="270" cy="177" rx="17" ry="10" fill="url(#rouge)"/><ellipse cx="330" cy="177" rx="17" ry="10" fill="url(#rouge)"/>'
    : [263, 270, 278, 322, 330, 337].map((x, i) => `<circle cx="${x}" cy="${174 + i % 3 * 3}" r="1" fill="#a37362"/>`).join(''));
  const formal = look.outfit === 'formal';
  add('clothing', `Clothing/Outfits/${look.outfit}`, `${path('M252 421 L348 421 L354 498 L345 924 L312 924 L300 549 L288 924 L255 924 L246 498Z', 'url(#fabric)')}${path('M275 235 L300 258 L325 235 L377 252 Q394 256 402 283 L419 407 L436 536 L405 542 L382 409 L362 323 L347 422 L253 422 L238 323 L218 409 L195 542 L164 536 L181 407 L198 283 Q206 256 223 252Z', 'url(#secondary)')}${formal ? path('M259 242 L277 239 L299 345 L323 239 L341 242 L377 252 L387 285 L373 349 L352 425 L359 506 L307 487 L300 447 L293 487 L241 506 L248 425 L227 349 L213 285 L223 252Z', 'url(#fabric)') : path('M270 247 L282 258 L282 303 L300 318 L318 303 L318 258 L330 247 L329 349 L346 422 L254 422 L271 349Z', 'url(#fabric)')}`);
  add('clothingOverlay', `Clothing/Overlays/${look.outfit}`, `${path('M276 236 L300 258 L289 282 L263 249Z M324 236 L300 258 L311 282 L337 249Z', 'url(#secondary)')}${formal ? path('M256 246 L278 241 L299 343 L278 322 L266 291 L251 291Z M344 246 L322 241 L301 343 L322 322 L334 291 L349 291Z', 'url(#secondary)') : ''}${path('M253 415 L347 415 L348 427 L252 427Z', 'url(#metal)')}<g fill="none" stroke="${look.trim}" stroke-width="1.1" opacity=".65"><path d="M273 457 L273 902 M327 457 L327 902 M258 362 L282 367 M318 367 L342 362 M170 525 L193 530 M407 530 L430 525"/></g><g fill="url(#metal)"><rect x="294" y="415" width="12" height="12" rx="2"/><circle cx="300" cy="355" r="2.5"/><circle cx="300" cy="379" r="2.5"/></g>${path('M254 917 L284 918 L283 944 Q258 953 231 942 Q233 930 254 917Z M316 918 L346 917 Q367 930 369 942 Q342 953 317 944Z', 'url(#fabric)')}<path d="M239 940 Q260 946 280 940 M320 940 Q340 946 361 940" fill="none" stroke="${look.trim}" stroke-width="1"/>`, 'fabric');
  add('hairFront', `Hair/Front/${hair}`, `${path(FRONT[hair], 'url(#hair)', 'stroke="#302731" stroke-width="1"')}<g fill="none" stroke="#fff3df" stroke-width=".8" opacity=".22"><path d="M251 111 Q274 89 297 89 M251 117 Q278 105 298 92 M310 88 Q337 96 346 119 M315 86 Q342 94 350 116"/></g>`);
  if (look.accessory !== 'none') add('accessories', `Accessories/${look.accessory}`, look.accessory === 'chain'
    ? `<path d="M264 348 Q277 398 291 354 M264 348 Q277 388 291 354" fill="none" stroke="${look.trim}" stroke-width="1.8"/><circle cx="264" cy="348" r="3" fill="url(#metal)"/><circle cx="291" cy="354" r="3" fill="url(#metal)"/>`
    : `<g transform="translate(337 281)"><path d="M0 -11 L5 -4 L11 0 L5 4 L0 11 L-5 4 L-11 0 L-5 -4Z" fill="url(#metal)"/><ellipse rx="3.5" ry="5" fill="${look.iris}"/><circle cx="-1" cy="-2" r="1" fill="#fff"/></g>`, 'accessory');
  return result.sort((a, b) => MAN_RIG.layers.indexOf(a.layer) - MAN_RIG.layers.indexOf(b.layer));
}

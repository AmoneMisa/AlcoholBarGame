import { FRAME_SHEETS, MOBILE_ASSETS, THUMBNAIL_ASSETS } from '../data/cosmetics/optimizedArt';

/** Keep unrecognised/new assets on their original URL until resized copies have been built. */
export function thumbnailArtwork(url: string, size: 96 | 192 = 96, base = '/') {
  const relative = url.startsWith(base) ? url.slice(base.length) : url.replace(/^\//, '');
  return THUMBNAIL_ASSETS.has(relative) ? `${base}assets/optimized/${size}/${relative}` : url;
}

export function characterFrame(sheet: string, index: number, size: 128 | 512 = 512, base = '/') {
  if (!FRAME_SHEETS.has(sheet)) return undefined;
  const name = sheet.split('/').pop()!.replace(/\.webp$/, '');
  return `${base}assets/optimized/frames/${name}/${index}-${size}.webp`;
}

export function mobileArtwork(url: string, base = '/') {
  const relative = url.startsWith(base) ? url.slice(base.length) : url.replace(/^\//, '');
  return MOBILE_ASSETS.has(relative) ? `${base}assets/optimized/mobile/${relative}` : url;
}

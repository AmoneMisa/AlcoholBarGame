// Animated transparent WebP layers are shared across rooms; static art remains the base.
export interface MotionRegion { x: number; y: number; width: number; height: number }
export interface WindRegion extends MotionRegion { kind: 'curtain' | 'leaves' }
export function roomWind(interior: string): WindRegion[] {
  if (interior === 'parisian') return roomMotion(interior).curtains.map(region => ({...region,kind:'curtain'}));
  const leaves: MotionRegion[] = interior === 'garden' ? [
    {x:.37,y:0,width:.065,height:.11},{x:.65,y:0,width:.10,height:.12},{x:.88,y:.01,width:.075,height:.16}
  ] : interior === 'beach' ? [
    {x:.055,y:0,width:.11,height:.11},{x:.38,y:0,width:.057,height:.13},{x:.925,y:.07,width:.05,height:.22}
  ] : [];
  return leaves.map(region => ({...region,kind:'leaves'}));
}
// Actual WebP proportions are required: not every themed room has shelf geometry.
export const MOTION_PAINTINGS: Record<string,{width:number;height:number}> = {
  beach:{width:764,height:508},marina:{width:764,height:508},parisian:{width:764,height:508},
  winter:{width:623,height:623},garden:{width:1672,height:941},underwater:{width:1672,height:941}
};
export const MOTION_LAYERS = {
  warm: 'ambient-warm.webp', neon: 'ambient-neon.webp', water: 'water-shimmer.webp', curtain: 'curtain-shimmer.webp',
  caustics: 'water-caustics.webp', snow: 'window-snow.webp', fireflies: 'garden-fireflies.webp'
} as const;
const NEON_ROOMS = new Set(['cyberpunk','inferno-penthouse','mass-effect','nfs-carbon','nfs-underground','cyberpunk-2077','cs-2','gta','gta-5','gta-sa','gta-3','control','repo']);
// Coordinates refer to the original painting, not the viewport. Only reviewed regions get local effects.
export function roomMotion(interior: string) {
  return {
    light: NEON_ROOMS.has(interior) ? 'neon' as const : 'warm' as const,
    water: interior === 'beach' ? [{x:.105,y:.423,width:.28,height:.055}]
      : interior === 'marina' ? [{x:.01,y:.368,width:.32,height:.060},{x:.37,y:.389,width:.06,height:.034}] : [],
    curtains: interior === 'parisian' ? [
      {x:.187,y:.094,width:.032,height:.30},
      {x:.766,y:.11,width:.035,height:.28},
      {x:.908,y:.02,width:.045,height:.42}
    ] : [],
    caustics: interior === 'underwater' ? [{x:.402,y:.07,width:.195,height:.22},{x:.23,y:.632,width:.54,height:.048}] : [],
    snow: interior === 'winter' ? [{x:.37,y:.22,width:.26,height:.275}] : [],
    fireflies: interior === 'garden' ? [{x:.167,y:.10,width:.10,height:.40},{x:.003,y:.10,width:.07,height:.30}] : []
  };
}
// Match background-size: cover and background-position exactly, including on tall mobile screens.
export function motionPaintingBox(imageWidth: number, imageHeight: number, width: number, height: number, positionY = .5) {
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawnWidth = imageWidth * scale, drawnHeight = imageHeight * scale;
  return {width:drawnWidth,height:drawnHeight,left:(width-drawnWidth)/2,top:(height-drawnHeight)*positionY};
}

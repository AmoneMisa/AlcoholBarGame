// Scene geometry painted into each background, measured as fractions of the image (0 = top/left, 1 = bottom/right).
// The scene uses it so everything lives in the painting itself:
//   back   – back edge of the bar top: the bartender is cut here, so they stand behind the counter
//   seat   – top of the painted stool seats (null: no stools in view, guests stand at the bottom edge)
//   stools – x centres of the painted stools; guests take the free stool nearest the middle
//   shelf  – the painted back-bar where our bottles stand: its x range and the planks' y positions
//   bartender – optional x where the bartender stands, for rooms whose counter does not reach the side
export interface SceneGeometry {
  width: number; height: number;
  back: number;
  seat: number | null;
  stools: number[];
  shelf: { x0: number; x1: number; planks: number[] };
  bartender?: number;
}

const FIVE = [.12, .30, .49, .67, .85];
const square = (geometry: Omit<SceneGeometry, 'width' | 'height'>): SceneGeometry => ({ width: 1232, height: 1232, ...geometry });
const wide = (geometry: Omit<SceneGeometry, 'width' | 'height'>): SceneGeometry => ({ width: 1516, height: 1004, ...geometry });

export const SCENES: Record<string, SceneGeometry> = {
  velvet: { width: 1774, height: 887, back: .70, seat: .84, stools: [.10, .30, .50, .70, .90], shelf: { x0: .15, x1: .87, planks: [.285, .42, .555] } },
  garden: { width: 1672, height: 941, back: .705, seat: null, stools: [], shelf: { x0: .30, x1: .63, planks: [.265, .37, .48] } },
  skyline: { width: 1672, height: 941, back: .70, seat: null, stools: [], shelf: { x0: .74, x1: .99, planks: [.28, .37, .47] } },
  'inferno-penthouse': { width: 1536, height: 1024, back: .74, seat: .83, stools: [.07, .25, .49, .73, .93], shelf: { x0: .30, x1: .70, planks: [.38, .44, .50] } },
  speakeasy: square({ back: .54, seat: .64, stools: [.235, .39, .54, .70, .84], shelf: { x0: .24, x1: .83, planks: [.355, .43, .505] } }),
  'jazz-cellar': square({ back: .56, seat: .68, stools: [.14, .32, .50, .68, .86], shelf: { x0: .20, x1: .80, planks: [.40, .47, .545] } }),
  'art-deco': square({ back: .545, seat: .66, stools: [.13, .31, .49, .67, .85], shelf: { x0: .25, x1: .75, planks: [.245, .32, .39, .455] } }),
  library: square({ back: .59, seat: .66, stools: [.23, .36, .49, .62, .75], shelf: { x0: .35, x1: .64, planks: [.435, .49, .545] } }),
  palace: square({ back: .575, seat: .70, stools: FIVE, shelf: { x0: .15, x1: .85, planks: [.29, .36, .435] } }),
  tropical: square({ back: .565, seat: .72, stools: FIVE, shelf: { x0: .30, x1: .70, planks: [.36, .435, .51] } }),
  desert: square({ back: .55, seat: .70, stools: FIVE, shelf: { x0: .12, x1: .87, planks: [.36, .43, .50] } }),
  winter: square({ back: .555, seat: .70, stools: FIVE, shelf: { x0: .12, x1: .87, planks: [.31, .38, .45] } }),
  beach: wide({ back: .57, seat: .74, stools: [.31, .49, .69, .91], shelf: { x0: .51, x1: .93, planks: [.29, .40, .52] }, bartender: .3 }),
  rooftop: wide({ back: .61, seat: .80, stools: [.20, .43, .66, .90], shelf: { x0: .30, x1: .70, planks: [.30, .40, .50] } }),
  cyberpunk: wide({ back: .56, seat: .68, stools: [.13, .39, .63, .87], shelf: { x0: .14, x1: .87, planks: [.215, .355, .47] } }),
  izakaya: wide({ back: .585, seat: .75, stools: [.20, .40, .60, .84], shelf: { x0: .62, x1: .98, planks: [.27, .40, .53] } }),
  marina: wide({ back: .53, seat: .68, stools: [.24, .39, .55, .72, .92], shelf: { x0: .70, x1: .93, planks: [.23, .345, .47] }, bartender: .32 }),
  parisian: wide({ back: .51, seat: .60, stools: [.23, .38, .54, .69, .84], shelf: { x0: .39, x1: .67, planks: [.20, .335, .455] } }),
  loft: wide({ back: .505, seat: .63, stools: [.43, .57, .71, .86], shelf: { x0: .55, x1: .95, planks: [.185, .28, .37, .45] }, bartender: .46 }),
  riad: wide({ back: .525, seat: .665, stools: [.14, .27, .42, .58, .73, .87], shelf: { x0: .26, x1: .78, planks: [.30, .38, .46] } })
};

const GUEST_CARD_CLEARANCE = 142;

// Maps the painted geometry onto a scene drawn with `background-size: cover` at vertical position `positionY` (0–1).
export function sceneLayout(interior: string, sceneWidth: number, sceneHeight: number, positionY: number) {
  const scene = SCENES[interior] ?? SCENES.velvet!;
  const scale = Math.max(sceneWidth / scene.width, sceneHeight / scene.height);
  const drawnWidth = scene.width * scale;
  const drawnHeight = scene.height * scale;
  const offsetX = (sceneWidth - drawnWidth) / 2;
  const offsetY = (sceneHeight - drawnHeight) * positionY;
  const x = (fraction: number) => offsetX + fraction * drawnWidth;
  const y = (fraction: number) => offsetY + fraction * drawnHeight;
  const margin = 10;
  let left = Math.max(margin, x(scene.shelf.x0));
  let right = Math.min(sceneWidth - margin, x(scene.shelf.x1));
  // Keep the painted shelf's own width (rows scroll sideways); only when too little of it is in view
  // (narrow phones, shelves at the edge of the painting) widen it around its centre.
  const minimum = Math.min(sceneWidth - margin * 2, 300);
  if (right - left < minimum) {
    const centre = Math.min(sceneWidth - margin - minimum / 2, Math.max(margin + minimum / 2, (left + right) / 2));
    left = centre - minimum / 2;
    right = centre + minimum / 2;
  }
  return {
    drawnHeight,
    back: Math.round(y(scene.back)),
    bartenderX: scene.bartender === undefined ? undefined : Math.round(Math.min(sceneWidth - 60, Math.max(60, x(scene.bartender)))),
    // No stools in view: the guest sits just below the counter front, torso above the bar top.
    // The guest card (88px) and the tools row under it (Upgrades, Mix page, full screen) must stay inside the scene.
    seat: Math.min(sceneHeight - GUEST_CARD_CLEARANCE, Math.round(y(scene.seat ?? scene.back + .16))),
    stools: scene.stools.map(x).filter((value) => value > 40 && value < sceneWidth - 40),
    shelf: { left: Math.round(left), right: Math.round(right), planks: scene.shelf.planks.map((fraction) => Math.round(y(fraction))) }
  };
}

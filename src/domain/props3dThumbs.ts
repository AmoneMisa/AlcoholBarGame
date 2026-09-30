// Still pictures of the 3D props (glass types, whole orange, salt shaker) for lists and cards. One shared renderer draws them
// on demand and the images are cached, so a page with dozens of glasses needs a single WebGL context.
import * as THREE from 'three';
import { GlassRig, environmentFor, frameGlass, isGlassType, loadProps, type Garnish, type GlassState, type GlassType } from './props3d';

export interface ThumbRequest { kind: string; fill?: number; color?: string; ice?: number; garnish?: Garnish; bubbles?: boolean; size?: number }

let shared: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; env: THREE.Texture; canvas: HTMLCanvasElement } | undefined;
let queue: Promise<unknown> = Promise.resolve();
const cache = new Map<string, string>();

function context(size: number) {
  if (!shared) {
    const canvas = document.createElement('canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.localClippingEnabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#ffffff', '#4a3f52', 1.05));
    const key = new THREE.DirectionalLight('#fff1d6', 2.0); key.position.set(-1.6, 2.6, 2.6); scene.add(key);
    const rim = new THREE.DirectionalLight('#9dbcff', 1); rim.position.set(2, 1, -2); scene.add(rim);
    shared = { renderer, scene, camera: new THREE.PerspectiveCamera(28, 1, .1, 30), env: environmentFor(renderer), canvas };
  }
  shared.renderer.setPixelRatio(1);
  shared.renderer.setSize(size, size, false);
  return shared;
}

function frameObject(camera: THREE.PerspectiveCamera, object: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const extent = Math.max(size.y, size.x) * 1.15;
  const distance = extent / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(centre.x, centre.y + size.y * .12, centre.z + distance);
  camera.lookAt(centre);
}

async function draw(request: ThumbRequest): Promise<string> {
  const size = request.size ?? 256;
  const { renderer, scene, camera, env } = context(size);
  const model = await loadProps();
  scene.environment = env;
  const holder = new THREE.Group(); scene.add(holder);
  let rig: GlassRig | undefined;
  if (request.kind.startsWith('glass:') && isGlassType(request.kind.slice(6))) {
    const type = request.kind.slice(6) as GlassType;
    rig = new GlassRig(model, type, env);
    const state: Partial<GlassState> = { fill: request.fill ?? 65, color: request.color ?? '#e0a24a', ice: request.ice ?? 0, garnish: request.garnish ?? '', bubbles: false };
    rig.set(state); rig.snap();
    holder.add(rig.group);
    frameGlass(camera, type);
  } else {
    const names = request.kind === 'item:orange' ? ['item_orange', 'item_orange_leaf'] : request.kind === 'item:salt' ? ['item_salt', 'item_salt_fill', 'item_salt_cap'] : [];
    for (const name of names) {
      const mesh = model.getObjectByName(name)?.clone() as THREE.Mesh | undefined;
      if (!mesh) continue;
      const source = mesh.material as THREE.MeshStandardMaterial;
      const material = source.clone();
      if (name === 'item_salt') { material.transparent = true; material.opacity = .35; material.roughness = .05; material.envMap = env; material.depthWrite = false; mesh.renderOrder = 2; }
      mesh.material = material; holder.add(mesh);
    }
    frameObject(camera, holder);
  }
  renderer.setClearColor(0x000000, 0);
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(holder); rig?.dispose();
  return url;
}

/** Cached still image (data URL) of a 3D prop. Requests are drawn one after another on the shared renderer. */
export function propThumb(request: ThumbRequest): Promise<string> {
  const key = JSON.stringify(request);
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  const job = queue.then(() => draw(request)).then((url) => { cache.set(key, url); return url; });
  queue = job.catch(() => undefined);
  return job;
}

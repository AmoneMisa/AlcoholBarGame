// 3D bar props: glasses with a clipped liquid volume, ice, garnishes, the cocktail shaker and inventory items.
// The models come from scripts/blender/build_props.py; glass profiles are shared through src/data/props/glasses.json.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import glassData from '../data/props/glasses.json';

export type GlassType = 'highball' | 'collins' | 'rocks' | 'shot' | 'beer' | 'tiki' | 'coupe' | 'martini' | 'wine' | 'flute';
export type Garnish = '' | 'mint' | 'citrus' | 'lime' | 'orange' | 'pineapple';
interface Profile { outer: number[][]; inner: number[][]; innerBottom: number; rim: number }
const PROFILES = glassData as unknown as Record<GlassType, Profile>;

let modelPromise: Promise<THREE.Group> | undefined;
export const loadProps = () => (modelPromise ??= new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync('/assets/props3d/bar-props.glb').then((gltf) => gltf.scene));

// glTF is Y-up: the glass axis is Y. Inner radius of the glass at a height (linear between the profile points).
export function innerRadiusAt(type: GlassType, y: number) {
  const p = PROFILES[type];
  const points = [[p.inner[0]![0]!, p.innerBottom], ...p.inner] as number[][];
  for (let i = 1; i < points.length; i++) {
    const [r0, y0] = points[i - 1]!, [r1, y1] = points[i]!;
    if (y <= y1! || i === points.length - 1) { const t = y1 === y0 ? 1 : Math.max(0, Math.min(1, (y - y0!) / (y1! - y0!))); return r0! + (r1! - r0!) * t; }
  }
  return p.inner.at(-1)![0]!;
}
export const glassTypes = Object.keys(PROFILES) as GlassType[];
export const isGlassType = (value: string): value is GlassType => value in PROFILES;
export const glassHeight = (type: GlassType) => PROFILES[type].rim;

export function environmentFor(renderer: THREE.WebGLRenderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const map = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();
  return map;
}

const seeded = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const find = (root: THREE.Object3D, name: string) => root.getObjectByName(name) as THREE.Mesh | undefined;
const GARNISH_MESH: Record<string, string> = { mint: 'garnish_mint', citrus: 'garnish_lime', lime: 'garnish_lime', orange: 'garnish_orange', pineapple: 'garnish_pineapple' };

export interface GlassState { fill: number; color: string; ice: number; garnish: Garnish; bubbles: boolean; pouring?: string; shaking?: boolean }

// One glass on the bar: shell, liquid (clipped at the fill level), surface, ice, garnish, bubbles, pour stream and the shaker.
export class GlassRig {
  readonly group = new THREE.Group();      // the whole rig, origin at the centre of the glass base
  private readonly glass = new THREE.Group();
  private readonly shaker = new THREE.Group();
  private liquid!: THREE.Mesh;
  private surface: THREE.Mesh;
  private stream: THREE.Mesh;
  private splash: THREE.Mesh;
  private ice: THREE.Mesh[] = [];
  private garnishMesh?: THREE.Object3D;
  private bubbles: THREE.Points;
  private readonly clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  private level = 0;                        // eased fill, 0..1
  private state: GlassState = { fill: 0, color: '#d8a24a', ice: 0, garnish: '', bubbles: false };
  private readonly materials: Record<string, THREE.Material> = {};
  private shakeStart = 0;

  constructor(private readonly model: THREE.Group, readonly type: GlassType, envMap?: THREE.Texture) {
    const p = PROFILES[type];
    const glassMat = new THREE.MeshPhysicalMaterial({ color: '#e4f4ff', transparent: true, opacity: .18, roughness: .04, metalness: 0, side: THREE.DoubleSide, depthWrite: false, envMap, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: .02 });
    const liquidMat = new THREE.MeshStandardMaterial({ color: '#d8a24a', roughness: .15, transparent: true, opacity: .93, side: THREE.DoubleSide, clippingPlanes: [this.clip], envMap, envMapIntensity: .6 });
    const surfaceMat = new THREE.MeshStandardMaterial({ color: '#f0c46a', roughness: .1, transparent: true, opacity: .96, side: THREE.DoubleSide, envMap });
    const iceMat = new THREE.MeshPhysicalMaterial({ color: '#cfeaff', transparent: true, opacity: .85, roughness: .12, envMap, envMapIntensity: 1.2 });
    const metal = new THREE.MeshStandardMaterial({ color: '#c9ced6', metalness: 1, roughness: .28, envMap, envMapIntensity: 1.4 });
    this.materials.glass = glassMat; this.materials.liquid = liquidMat; this.materials.surface = surfaceMat; this.materials.ice = iceMat; this.materials.metal = metal;

    const shell = find(model, `glass_${type}`)!.clone();
    shell.material = glassMat; shell.renderOrder = 3;
    this.liquid = find(model, `liquid_${type}`)!.clone();
    this.liquid.material = liquidMat; this.liquid.renderOrder = 1;
    this.surface = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), surfaceMat);
    this.surface.renderOrder = 2;
    this.glass.add(this.liquid, this.surface, shell);
    const iceSource = find(model, 'ice')!;
    const random = seeded(7 + type.length);
    for (let i = 0; i < 6; i++) { const cube = iceSource.clone(); cube.material = iceMat; cube.renderOrder = 2; cube.userData = { a: random() * 6.28, r: random(), spin: random() - .5, phase: random() * 6.28 }; cube.visible = false; this.ice.push(cube); this.glass.add(cube); }

    const streamMat = new THREE.MeshStandardMaterial({ color: '#d8a24a', roughness: .1, transparent: true, opacity: .9, depthWrite: false });
    this.stream = new THREE.Mesh(new THREE.CylinderGeometry(.032, .026, 1, 12, 1, true), streamMat);
    this.stream.visible = false; this.stream.renderOrder = 4;
    this.splash = new THREE.Mesh(new THREE.TorusGeometry(.09, .012, 6, 20).rotateX(Math.PI / 2), streamMat);
    this.splash.visible = false; this.splash.renderOrder = 4;
    this.glass.add(this.stream, this.splash);

    const positions = new Float32Array(30 * 3);
    this.bubbles = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3)), new THREE.PointsMaterial({ color: '#ffffff', size: .035, transparent: true, opacity: .75, depthWrite: false }));
    this.bubbles.visible = false; this.bubbles.renderOrder = 4; this.bubbles.frustumCulled = false;
    this.glass.add(this.bubbles);

    for (const name of ['shaker_body', 'shaker_cap', 'shaker_lid']) { const part = find(model, name)!.clone(); part.material = metal; this.shaker.add(part); }
    this.shaker.visible = false; this.shaker.scale.setScalar(.62);
    this.group.add(this.glass, this.shaker);
    void p;
  }

  set(state: Partial<GlassState>) {
    const next = { ...this.state, ...state };
    if (next.shaking && !this.state.shaking) this.shakeStart = performance.now();
    this.state = next;
    (this.materials.liquid as THREE.MeshStandardMaterial).color.set(next.color);
    (this.materials.surface as THREE.MeshStandardMaterial).color.set(next.color).lerp(new THREE.Color('#ffffff'), .25);
    for (const key of ['stream'] as const) ((this[key].material) as THREE.MeshStandardMaterial).color.set(next.pouring ?? next.color);
    if (this.garnishMesh?.userData.kind !== next.garnish) this.placeGarnish(next.garnish);
    const count = Math.min(6, Math.ceil(next.ice / 1));
    this.ice.forEach((cube, i) => { cube.visible = i < count; });
  }

  private placeGarnish(kind: Garnish) {
    if (this.garnishMesh) { this.glass.remove(this.garnishMesh); this.garnishMesh = undefined; }
    const source = GARNISH_MESH[kind] && find(this.model, GARNISH_MESH[kind]!);
    if (!source) return;
    const holder = new THREE.Group(); holder.userData.kind = kind;
    const piece = source.clone();
    holder.add(piece);
    const p = PROFILES[this.type];
    // Sit on the rim: wheels notched on the edge, sprigs and wedges leaning out of the glass.
    const rimR = p.inner.at(-1)![0]!;
    if (kind === 'mint') { holder.position.set(rimR * .2, p.rim - .05, 0); holder.rotation.z = -.2; holder.scale.setScalar(1.6); }
    else { holder.position.set(rimR, p.rim - .04, 0); holder.rotation.set(0, 0, -.35); holder.scale.setScalar(kind === 'pineapple' ? 1.2 : 1); }
    this.garnishMesh = holder; this.glass.add(holder);
  }

  /** Advance the animation; call every frame. */
  tick(dt: number, time: number) {
    const p = PROFILES[this.type];
    const target = Math.max(0, Math.min(.96, this.state.fill / 100));
    this.level += (target - this.level) * Math.min(1, dt * 5);
    const top = p.innerBottom + this.level * (p.rim - p.innerBottom);
    const shaking = !!this.state.shaking;
    // Shaking: the glass is swapped for the shaker, which gets thrown around; afterwards the glass is back.
    this.shaker.visible = shaking; this.glass.visible = !shaking;
    if (shaking) {
      const t = (performance.now() - this.shakeStart) / 1000;
      this.shaker.position.set(Math.sin(t * 22) * .07, .55 + Math.abs(Math.sin(t * 11)) * .1, 0);
      this.shaker.rotation.set(0, 0, .5 + Math.sin(t * 22) * .22);
    }
    this.liquid.visible = this.level > .002;
    this.surface.visible = this.liquid.visible;
    const radius = innerRadiusAt(this.type, top) * .985;
    this.surface.position.y = top; this.surface.scale.setScalar(Math.max(.001, radius));
    this.surface.rotation.z = Math.sin(time * 2.2) * .012;
    // Level line stays horizontal in the world when the glass tilts.
    this.group.updateWorldMatrix(true, false);
    this.clip.constant = new THREE.Vector3(0, top, 0).applyMatrix4(this.glass.matrixWorld).y;
    this.ice.forEach((cube) => {
      if (!cube.visible) return;
      const { a, r, spin, phase } = cube.userData as { a: number; r: number; spin: number; phase: number };
      const y = Math.min(top - .04, p.innerBottom + .12 + r * .5 * (p.rim - p.innerBottom)) + Math.sin(time * 1.4 + phase) * .012 + (this.state.pouring ? Math.sin(time * 9 + phase) * .01 : 0);
      const spread = Math.max(0, innerRadiusAt(this.type, y) - .13) * (.3 + r * .7);
      cube.position.set(Math.cos(a) * spread, Math.max(p.innerBottom + .06, y), Math.sin(a) * spread);
      cube.rotation.set(time * spin * .4 + a, time * spin * .3, phase);
    });
    // Pour stream: from above the rim to the surface, with a small splash ring.
    const pouring = !!this.state.pouring && !shaking;
    this.stream.visible = pouring; this.splash.visible = pouring && this.liquid.visible;
    if (pouring) {
      const from = p.rim + .95, height = Math.max(.05, from - top);
      this.stream.scale.set(1 + Math.sin(time * 30) * .12, height, 1 + Math.cos(time * 27) * .12);
      this.stream.position.set(0, top + height / 2, 0);
      this.splash.position.set(0, top + .005, 0); this.splash.scale.setScalar(.7 + (Math.sin(time * 14) * .5 + .5) * .5);
    }
    // Bubbles rise inside the liquid.
    const show = this.state.bubbles && this.liquid.visible && !shaking;
    this.bubbles.visible = show;
    if (show) {
      const array = this.bubbles.geometry.attributes.position!.array as Float32Array;
      const height = Math.max(.05, top - p.innerBottom);
      for (let i = 0; i < 30; i++) {
        const phase = (time * (.25 + (i % 5) * .05) + i * .37) % 1;
        const y = p.innerBottom + phase * height;
        const spread = Math.max(0, innerRadiusAt(this.type, y) - .05);
        array[i * 3] = Math.cos(i * 2.4) * spread * ((i % 7) / 7); array[i * 3 + 1] = y; array[i * 3 + 2] = Math.sin(i * 2.4) * spread * ((i % 7) / 7);
      }
      this.bubbles.geometry.attributes.position!.needsUpdate = true;
    }
  }

  /** Jump straight to the target fill (used for still thumbnails). */
  snap() { this.level = Math.max(0, Math.min(.96, this.state.fill / 100)); this.tick(0, 0); }

  dispose() { for (const m of Object.values(this.materials)) m.dispose(); }
}

// A rig placed in a scene so the glass fills a frame of the given height.
export function frameGlass(camera: THREE.PerspectiveCamera, type: GlassType) {
  const height = glassHeight(type) + .55;      // room for the garnish and the pour stream
  const distance = height / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(0, height * .42, distance * 1.02);
  camera.lookAt(0, height * .4, 0);
}

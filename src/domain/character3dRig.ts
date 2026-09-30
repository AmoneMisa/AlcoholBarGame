// One customised 3D person: a clone of the male or female mannequin with its own colours, texture layers, morphs and animation.
// Used for the bartender, for every guest at the bar and for the conversation portraits.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { CLIP_FOR, EXPRESSION_MORPHS, SLOT_PREFIXES, modelUrl, rigFor, type Gender, type Look3dInput, type Rig3d } from './character3d';
import { paintBody, paintCloth, paintHair, paintHead } from './character3dTextures';
import type { CharacterExpression } from './dialogue/types';

type Model = THREE.Group & { animations: THREE.AnimationClip[] };
const models = new Map<Gender, Promise<Model>>();
export function loadCharacterModel(gender: Gender) {
  if (!models.has(gender)) models.set(gender, new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(modelUrl(gender)).then((gltf) => Object.assign(gltf.scene, { animations: gltf.animations })));
  return models.get(gender)!;
}

// Three soft steps of light: a stylised toon look, shared by everyone.
let ramp: THREE.DataTexture | undefined;
function toonRamp() {
  if (!ramp) {
    ramp = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
    ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
    ramp.needsUpdate = true;
  }
  return ramp;
}

// Standard studio lights for a scene that shows characters.
export function addCharacterLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight('#ffffff', '#3a3040', 1.6));
  const key = new THREE.DirectionalLight('#ffd9a0', 2.4); key.position.set(-1.5, 2.6, 2.4); scene.add(key);
  const rim = new THREE.DirectionalLight('#8fb4ff', .9); rim.position.set(2, 1.5, -2); scene.add(rim);
  return key;
}

export interface RigOptions { headTexture?: number; bodyTexture?: number }

export class CharacterRig {
  readonly root = new THREE.Group();
  readonly gender: Gender;
  data!: Rig3d;
  private readonly body: THREE.Object3D;
  private readonly meshes: THREE.SkinnedMesh[] = [];
  private readonly materials = new Map<string, THREE.MeshToonMaterial>();
  private readonly textures = new Map<string, THREE.CanvasTexture>();
  private readonly headCanvas = document.createElement('canvas');
  private readonly bodyCanvas = document.createElement('canvas');
  private readonly mixer: THREE.AnimationMixer;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private current?: THREE.AnimationAction;
  private look: Look3dInput = {};
  private expression: CharacterExpression = 'neutral';
  private staticTextures = false;
  private blinkAt = 1 + Math.random() * 3;
  private paintedKey = '';

  constructor(model: Model, gender: Gender, options: RigOptions = {}) {
    this.gender = gender;
    this.headCanvas.width = this.headCanvas.height = options.headTexture ?? 512;
    this.bodyCanvas.width = this.bodyCanvas.height = options.bodyTexture ?? 1024;
    this.body = cloneSkinned(model);
    this.root.add(this.body);
    this.body.traverse((object) => {
      const mesh = object as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      const original = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[];
      const toon = original.map((item) => {
        let material = this.materials.get(item.name);
        if (!material) { material = new THREE.MeshToonMaterial({ gradientMap: toonRamp() }); this.materials.set(item.name, material); }
        return material;
      });
      mesh.material = Array.isArray(mesh.material) ? toon : toon[0]!;
      mesh.frustumCulled = false;
      this.meshes.push(mesh);
    });
    this.mixer = new THREE.AnimationMixer(this.body);
    for (const clip of model.animations) this.actions.set(clip.name, this.mixer.clipAction(clip));
    this.setLook({});
    this.play('idle');
  }

  /** Apply an appearance: visible slot meshes, colours, painted texture layers and the shape morphs. */
  setLook(look: Look3dInput) {
    this.look = look;
    this.data = rigFor(look);
    const next = this.data;
    // Only the chosen mesh of each slot is shown. A part with several materials loads as a group (eyes_cat, eyes_cat_1): match the base name.
    this.body.traverse((object) => {
      if (SLOT_PREFIXES.some((prefix) => object.name.startsWith(prefix))) object.visible = next.visible.has(object.name.replace(/_\d+$/, ''));
    });
    for (const [role, color] of Object.entries(next.colors)) this.materials.get(role)?.color.set(color);
    this.materials.get('neon')?.emissive.set(next.colors.neon!);
    this.paint();
    this.body.scale.setScalar(next.scale);
  }

  private texture(role: string, canvas: HTMLCanvasElement) {
    let map = this.textures.get(role);
    if (!map) {
      map = new THREE.CanvasTexture(canvas); map.flipY = false; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4; this.textures.set(role, map);
      const material = this.materials.get(role); if (material) { material.map = map; material.needsUpdate = true; }
    } else map.needsUpdate = true;
  }
  private paint() {
    const key = JSON.stringify([this.look.skinTone, this.look.tanLevel, this.look.skinDetail, this.look.blush, this.look.eyeshadow, this.look.eyeliner, this.look.eyeShape]);
    if (key !== this.paintedKey) {
      this.paintedKey = key;
      paintHead(this.look, this.headCanvas); this.texture('skin_head', this.headCanvas);
      paintBody(this.look, this.bodyCanvas); this.texture('skin_body', this.bodyCanvas);
      this.materials.get('skin_head')?.color.set('#ffffff'); this.materials.get('skin_body')?.color.set('#ffffff');
    }
    if (!this.staticTextures) {
      this.staticTextures = true;
      this.texture('hair', paintHair()); this.texture('brow', paintHair());
      this.texture('shirt', paintCloth('plain')); this.texture('vest', paintCloth('pinstripe')); this.texture('apron', paintCloth('plain')); this.texture('pants', paintCloth('plain'));
    }
  }

  setExpression(expression: CharacterExpression) { this.expression = expression; }

  play(name: string) {
    const clip = this.actions.get(CLIP_FOR[name] ?? 'idle') ?? this.actions.get('idle');
    if (!clip || clip === this.current) return;
    clip.reset().fadeIn(.25).play();
    this.current?.fadeOut(.25);
    this.current = clip;
  }

  /** Advance the animation and set the face (base look + expression + blinking + talking mouth). */
  update(dt: number, time: number, talking = false) {
    this.mixer.update(dt);
    if (time > this.blinkAt + .3) this.blinkAt = time + 2.5 + Math.random() * 3;
    const weights: Record<string, number> = { ...this.data.morphs };
    for (const [name, value] of Object.entries(EXPRESSION_MORPHS[this.expression] ?? {})) weights[name] = (weights[name] ?? 0) + value;
    if (talking) weights.mouthOpen = (weights.mouthOpen ?? 0) + Math.abs(Math.sin(time * 11)) * .55;
    const blink = Math.max(0, 1 - Math.abs(time - this.blinkAt) * 14);
    if (blink) weights.blink = blink;
    for (const mesh of this.meshes) {
      const influences = mesh.morphTargetInfluences;
      if (!influences) continue;
      influences.fill(0);
      for (const [name, value] of Object.entries(weights)) { const index = mesh.morphTargetDictionary?.[name]; if (index !== undefined) influences[index] = value; }
    }
  }

  dispose() {
    this.mixer.stopAllAction();
    for (const material of this.materials.values()) material.dispose();
    for (const map of this.textures.values()) map.dispose();
  }
}

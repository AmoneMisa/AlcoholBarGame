<script setup lang="ts">
import { computed, useId } from 'vue';

// Vector art for ingredients that have no cell in the painted sprite sheets.
const props = defineProps<{ id: string }>();
const uid = useId();
const ref = (name: string) => `url(#${uid}-${name})`;

type BottleSpec = {
  top: number; neck: number; body: number; shoulder: [number, number]; bottom?: number; radius?: number;
  glass: [string, string]; cap: string; capHeight?: number; label: [number, number]; labelColor: string; labelEdge: string;
};

const bottles: Record<string, BottleSpec> = {
  'sparkling-wine': { top: 6, neck: 9, body: 30, shoulder: [34, 54], glass: ['#2c6a44', '#0b2415'], cap: '#d9ae4c', capHeight: 30, label: [62, 84], labelColor: '#f3e7c6', labelEdge: '#c79a3c' },
  'coffee-liqueur': { top: 14, neck: 11, body: 42, shoulder: [28, 42], radius: 7, glass: ['#6b3a22', '#23100a'], cap: '#9b2b25', capHeight: 10, label: [52, 82], labelColor: '#e9d4ad', labelEdge: '#8b5a2b' },
  'bitter-aperitif': { top: 8, neck: 10, body: 30, shoulder: [30, 48], glass: ['#ea4a4f', '#7c0f1c'], cap: '#1d1b20', capHeight: 12, label: [56, 82], labelColor: '#fbf2e2', labelEdge: '#b9232f' },
  'ginger-beer': { top: 12, neck: 13, body: 34, shoulder: [26, 44], radius: 6, glass: ['#f4ead0', '#c9b58a'], cap: '#6d7478', capHeight: 7, label: [58, 84], labelColor: '#27402f', labelEdge: '#d9b25a' },
  'grapefruit-soda': { top: 10, neck: 11, body: 30, shoulder: [30, 46], glass: ['#ffb3a2', '#d8544f'], cap: '#f2c537', capHeight: 7, label: [56, 80], labelColor: '#fff8ec', labelEdge: '#e36b5d' },
  'pineapple-juice': { top: 16, neck: 17, body: 34, shoulder: [26, 36], radius: 7, glass: ['#ffe07a', '#e3a21b'], cap: '#3f8a3a', capHeight: 9, label: [50, 80], labelColor: '#fff6dc', labelEdge: '#4d9a42' }
};

function bottlePath(spec: BottleSpec) {
  const cx = 50, bottom = spec.bottom ?? 96, r = spec.radius ?? 4;
  const n = spec.neck / 2, b = spec.body / 2;
  const [s1, s2] = spec.shoulder;
  const c1 = s1 + (s2 - s1) * .55, c2 = s1 + (s2 - s1) * .45;
  return `M${cx - n} ${spec.top} V${s1} C${cx - n} ${c1} ${cx - b} ${c2} ${cx - b} ${s2} V${bottom - r} Q${cx - b} ${bottom} ${cx - b + r} ${bottom} H${cx + b - r} Q${cx + b} ${bottom} ${cx + b} ${bottom - r} V${s2} C${cx + b} ${c2} ${cx + n} ${c1} ${cx + n} ${s1} V${spec.top} Z`;
}

const spec = computed(() => bottles[props.id]);
const colaPath = 'M45 8 V26 C45 34 40 36 40 46 C40 54 43 57 43 62 C43 67 39 70 39 80 V92 Q39 96 43 96 H57 Q61 96 61 92 V80 C61 70 57 67 57 62 C57 57 60 54 60 46 C60 36 55 34 55 26 V8 Z';
</script>

<template>
  <svg class="ingredient-art" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      <linearGradient :id="`${uid}-shade`" x1="0" x2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".28" /><stop offset=".22" stop-color="#fff" stop-opacity=".06" />
        <stop offset=".55" stop-color="#000" stop-opacity="0" /><stop offset="1" stop-color="#000" stop-opacity=".42" />
      </linearGradient>
      <linearGradient v-if="spec" :id="`${uid}-glass`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="spec.glass[0]" /><stop offset="1" :stop-color="spec.glass[1]" />
      </linearGradient>
      <radialGradient :id="`${uid}-orange`" cx=".38" cy=".34" r=".7">
        <stop offset="0" stop-color="#ffc25a" /><stop offset=".55" stop-color="#f38a1c" /><stop offset="1" stop-color="#b04d09" />
      </radialGradient>
      <linearGradient :id="`${uid}-cola`" x1="0" x2="1">
        <stop offset="0" stop-color="#7a3a22" /><stop offset=".4" stop-color="#4a2014" /><stop offset="1" stop-color="#1c0906" />
      </linearGradient>
      <linearGradient :id="`${uid}-dish`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f7f4ee" /><stop offset="1" stop-color="#a9b4bf" />
      </linearGradient>
    </defs>

    <g v-if="spec">
      <ellipse cx="50" cy="97" :rx="spec.body / 2 + 4" ry="2.5" fill="#000" opacity=".35" />
      <path :d="bottlePath(spec)" :fill="ref('glass')" stroke="#0007" stroke-width=".8" />
      <!-- stoneware two-tone: dark lower glaze -->
      <rect v-if="id === 'ginger-beer'" :x="50 - spec.body / 2" y="70" :width="spec.body" height="20" fill="#9d6330" />
      <path v-if="id === 'ginger-beer'" :d="`M${50 - spec.body / 2} 90 H${50 + spec.body / 2} V${96 - 6} Q${50 + spec.body / 2} 96 ${50 + spec.body / 2 - 6} 96 H${50 - spec.body / 2 + 6} Q${50 - spec.body / 2} 96 ${50 - spec.body / 2} 90 Z`" fill="#9d6330" />
      <!-- neck foil / cap -->
      <rect :x="50 - spec.neck / 2 - .6" :y="spec.top - 1.5" :width="spec.neck + 1.2" :height="spec.capHeight ?? 8" rx="1.5" :fill="spec.cap" stroke="#0006" stroke-width=".6" />
      <path v-if="id === 'sparkling-wine'" d="M45.5 36 C44 42 40 44 38 50 L50 47 L62 50 C60 44 56 42 54.5 36 Z" fill="#d9ae4c" stroke="#8a6420" stroke-width=".6" />
      <path v-if="id === 'ginger-beer'" d="M42 13 Q50 1 58 13" fill="none" stroke="#a8afb3" stroke-width="1.6" />
      <!-- label -->
      <rect :x="50 - spec.body / 2 + 3.5" :y="spec.label[0]" :width="spec.body - 7" :height="spec.label[1] - spec.label[0]" rx="2.5" :fill="spec.labelColor" :stroke="spec.labelEdge" stroke-width="1.4" />
      <g :transform="`translate(50 ${(spec.label[0] + spec.label[1]) / 2})`">
        <template v-if="id === 'sparkling-wine'">
          <path d="M0 -7 L2 -2 L7 -2 L3 1.5 L4.5 7 L0 3.8 L-4.5 7 L-3 1.5 L-7 -2 L-2 -2 Z" fill="#c79a3c" />
        </template>
        <template v-else-if="id === 'coffee-liqueur'">
          <ellipse rx="6.5" ry="9" fill="#5b2c17" transform="rotate(-22)" /><path d="M-1.8 -8 C2.5 -3 -2.5 3 1.8 8" stroke="#e9d4ad" stroke-width="1.3" fill="none" transform="rotate(-22)" />
        </template>
        <template v-else-if="id === 'bitter-aperitif'">
          <circle r="7.5" fill="#f28a2b" /><circle r="5.8" fill="#ffc46b" />
          <path v-for="a in 6" :key="a" :d="`M0 0 L${5.8 * Math.cos(a * Math.PI / 3)} ${5.8 * Math.sin(a * Math.PI / 3)}`" stroke="#f28a2b" stroke-width=".8" />
        </template>
        <template v-else-if="id === 'ginger-beer'">
          <path d="M-8 2 C-9 -3 -4 -5 -2 -2 C-1 -7 4 -7 4 -2 C8 -4 10 1 6 3 C3 6 -5 6 -8 2 Z" fill="#d8ad6a" stroke="#8c6531" stroke-width=".8" />
        </template>
        <template v-else-if="id === 'grapefruit-soda'">
          <circle r="7.5" fill="#f5c46c" /><circle r="6" fill="#ec5f62" />
          <path v-for="a in 8" :key="a" :d="`M0 0 L${6 * Math.cos(a * Math.PI / 4)} ${6 * Math.sin(a * Math.PI / 4)}`" stroke="#ffd3c4" stroke-width=".8" />
        </template>
        <template v-else-if="id === 'pineapple-juice'">
          <path d="M0 -6 L-3.5 -12 L0 -8.5 L3.5 -12 Z M0 -7 L-1.2 -13 L1.2 -13 Z" fill="#3f8a3a" />
          <ellipse cy="2" rx="6" ry="8" fill="#e8a62a" stroke="#9c6515" stroke-width=".7" />
          <path d="M-5 -2 L5 6 M-5 6 L5 -2 M-6 2 L6 2" stroke="#9c6515" stroke-width=".6" />
        </template>
      </g>
      <path :d="bottlePath(spec)" :fill="ref('shade')" />
      <path :d="`M${50 - spec.body / 2 + 3} ${spec.shoulder[1] + 2} V90`" stroke="#fff" stroke-opacity=".38" stroke-width="2" stroke-linecap="round" />
    </g>

    <g v-else-if="id === 'cola'">
      <ellipse cx="50" cy="97" rx="14" ry="2.5" fill="#000" opacity=".35" />
      <path :d="colaPath" :fill="ref('cola')" stroke="#0008" stroke-width=".8" />
      <rect x="43.5" y="3" width="13" height="7" rx="1.2" fill="#c8202a" stroke="#6d0c12" stroke-width=".6" />
      <path d="M40.6 56 H59.4 L59 69 H41 Z" fill="#c8202a" />
      <path d="M42 64 C47 58 53 66 58 60" stroke="#fff" stroke-width="1.6" fill="none" />
      <path :d="colaPath" :fill="ref('shade')" />
      <path d="M43 30 C42 38 42 44 42.5 50 M42 74 V90" stroke="#fff" stroke-opacity=".35" stroke-width="1.8" stroke-linecap="round" fill="none" />
    </g>

    <g v-else-if="id === 'orange'">
      <ellipse cx="50" cy="90" rx="36" ry="4" fill="#000" opacity=".3" />
      <circle cx="40" cy="52" r="30" :fill="ref('orange')" />
      <circle v-for="p in [[30,40],[46,34],[38,62],[54,56],[26,56],[48,46]]" :key="p.join()" :cx="p[0]" :cy="p[1]" r=".9" fill="#a8480a" opacity=".45" />
      <path d="M42 22 C44 16 50 14 56 15 C54 21 49 24 42 22 Z" fill="#3c8a36" stroke="#1f5a1d" stroke-width=".8" />
      <path d="M40 23 L41 18" stroke="#5a3a17" stroke-width="2" stroke-linecap="round" />
      <circle cx="68" cy="68" r="21" fill="#f7a23a" stroke="#c96a12" stroke-width="1.2" />
      <circle cx="68" cy="68" r="18" fill="#fff0cf" />
      <circle cx="68" cy="68" r="16" fill="#f7a534" />
      <path v-for="a in 10" :key="a" :d="`M68 68 L${68 + 16 * Math.cos(a * Math.PI / 5)} ${68 + 16 * Math.sin(a * Math.PI / 5)}`" stroke="#fff0cf" stroke-width="1.2" />
      <circle cx="68" cy="68" r="2.2" fill="#fff0cf" />
    </g>

    <g v-else-if="id === 'salt'">
      <ellipse cx="50" cy="88" rx="38" ry="5" fill="#000" opacity=".3" />
      <path d="M14 60 Q16 86 50 86 Q84 86 86 60 Z" :fill="ref('dish')" stroke="#6f7f8e" stroke-width="1" />
      <ellipse cx="50" cy="60" rx="36" ry="9" fill="#e9eef3" stroke="#2f5d8a" stroke-width="2" />
      <path d="M22 60 C28 38 42 30 50 30 C60 30 72 40 78 60 Z" fill="#fbfcfd" />
      <path d="M22 60 C28 38 42 30 50 30 C60 30 72 40 78 60 Z" fill="none" stroke="#d3dbe3" stroke-width=".8" />
      <rect v-for="c in [[34,48,15],[46,40,-20],[58,46,30],[52,54,8],[40,55,-12],[64,55,22],[28,57,40],[70,50,-8]]" :key="c.join()" :x="c[0]" :y="c[1]" width="3.2" height="3.2" :transform="`rotate(${c[2]} ${c[0] + 1.6} ${c[1] + 1.6})`" fill="#fff" stroke="#b9c6d3" stroke-width=".5" />
      <rect v-for="c in [[16,76,20],[84,78,-15],[78,84,35]]" :key="c.join()" :x="c[0]" :y="c[1]" width="2.6" height="2.6" :transform="`rotate(${c[2]} ${c[0] + 1.3} ${c[1] + 1.3})`" fill="#fff" stroke="#b9c6d3" stroke-width=".5" />
      <path d="M20 66 Q24 80 36 83" stroke="#fff" stroke-opacity=".7" stroke-width="2" fill="none" stroke-linecap="round" />
    </g>

    <g v-else>
      <rect x="38" y="20" width="24" height="76" rx="6" fill="#8aa0a8" /><rect x="44" y="6" width="12" height="16" fill="#6a7c84" />
    </g>
  </svg>
</template>

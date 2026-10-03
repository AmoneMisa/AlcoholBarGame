<script setup lang="ts">
import { computed } from 'vue';
import { standing, type Ladder } from '../../domain/relationship';

// The line of a relationship: one node for every grade, filled up to where the bond is now, with the name of the
// grade under each node and what is left to the next one.
const props = defineProps<{ ladder: Ladder; points: number; /** What each grade gives, shown as a tooltip and under the current grade. */ gives?: string[] }>();
const here = computed(() => standing(props.ladder, props.points));
const fill = computed(() => {
  const { index, nextAt } = here.value;
  const nodes = props.ladder.thresholds.length - 1;
  if (nextAt === undefined) return 100;
  const from = props.ladder.thresholds[index]!;
  return Math.round(((index + (props.points - from) / (nextAt - from)) / nodes) * 100);
});
</script>

<template>
  <div class="rel-line" :aria-label="`Relationship: ${here.name}`">
    <div class="rel-track" aria-hidden="true"><i :style="{ width: fill + '%' }"></i></div>
    <ol>
      <li v-for="(name, at) in ladder.names" :key="name" :class="{ done: at < here.index, now: at === here.index, later: at > here.index }" :title="gives?.[at] ?? ''">
        <span class="rel-node" aria-hidden="true"></span>
        <b>{{ name }}</b>
        <small>{{ ladder.thresholds[at] }}</small>
      </li>
    </ol>
    <p class="rel-next">
      <template v-if="here.nextAt !== undefined"><b>{{ here.name }}</b> · {{ here.points }} / {{ here.nextAt }} to <b>{{ here.nextName }}</b></template>
      <template v-else><b>{{ here.name }}</b> · the highest grade</template>
      <span v-if="gives?.[here.index]"> — {{ gives[here.index] }}</span>
    </p>
  </div>
</template>

<style>
.rel-line { position: relative; display: grid; gap: 4px; margin: 6px 0; }
.rel-track { position: absolute; top: 7px; left: 10%; right: 10%; height: 3px; border-radius: 2px; background: #2a3a52; }
.rel-track i { display: block; height: 100%; border-radius: 2px; background: linear-gradient(90deg, #c98e3c, #ffd98a); transition: width .3s ease; }
.rel-line ol { position: relative; display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; margin: 0; padding: 0; list-style: none; text-align: center; }
.rel-line li { display: grid; justify-items: center; gap: 1px; min-width: 0; color: #7d8ba1; }
.rel-node { width: 15px; height: 15px; border: 2px solid #4a5b75; border-radius: 50%; background: #121c2d; }
.rel-line li.done .rel-node { border-color: #c98e3c; background: #c98e3c; }
.rel-line li.now .rel-node { border-color: #ffd98a; background: #ffd98a; box-shadow: 0 0 0 3px #ffd98a33; }
.rel-line li b { font-size: 13px; line-height: 1.15; overflow-wrap: anywhere; }
.rel-line li small { font-size: 13px; opacity: .7; }
.rel-line li.done, .rel-line li.now { color: #f3e2bd; }
.rel-line li.now b { color: #ffd98a; }
.rel-next { margin: 2px 0 0; font-size: 13px; color: #aebbd0; }
.rel-next b { color: #ffe6a8; }
</style>

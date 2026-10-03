<script setup lang="ts">
import { computed, ref } from 'vue';
import { explainPairing } from '../domain/pairingExplain';
import { speak } from '../domain/english/speak';
import UiIcon from './ui/UiIcon.vue';

const props = defineProps<{ item: { why?: string; relationship?: string }; kind: 'food' | 'drink' | 'context' | 'cigar' }>();
const principles = computed(() => explainPairing(props.item, props.kind));
const open = ref<string>();
</script>

<template>
  <div class="pairing-principles">
    <small>THE PRINCIPLE</small>
    <div class="principle-chips">
      <button v-for="principle in principles" :key="principle.id" type="button" :aria-expanded="open === principle.id" @click="open = open === principle.id ? undefined : principle.id">{{ principle.title }} <UiIcon class="inline-icon" :name="open === principle.id ? 'chevron-up' : 'chevron-down'" /></button>
    </div>
    <template v-for="principle in principles" :key="principle.id">
      <div v-if="open === principle.id" class="principle-detail">
        <p class="principle-rule">{{ principle.rule }}</p>
        <p>{{ principle.explain }}</p>
        <p class="principle-example"><span>Example</span>{{ principle.example }}</p>
        <p class="principle-say"><span>Say it to the guest</span>“{{ principle.sayIt }}” <button type="button" class="inline-speak-button" aria-label="Listen" @click="speak(principle.sayIt)"><UiIcon name="speaker" /></button></p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pairing-principles { grid-column: 1 / -1; padding-top: 8px; border-top: 1px dashed #31435a; }
.pairing-principles > small { display: block; color: #e4b75b; font-size: 13px; font-weight: 900; letter-spacing: .12em; }
.principle-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
.principle-chips button { padding: 4px 9px; border: 1px solid #3c5a7a; border-radius: 999px; background: #132238; color: #a9d3ff; font-size: 13px; font-weight: 800; cursor: pointer; }
.principle-chips button[aria-expanded="true"] { border-color: #e4b75b; color: #ffd98a; }
.principle-detail { margin-top: 7px; padding: 9px 10px; border-radius: 8px; background: #0f1a2b; color: #c8d1dc; font-size: 13px; line-height: 1.5; }
.principle-detail p { margin: 0 0 6px; }
.principle-rule { color: #eef2f8; font-weight: 700; }
.principle-example span, .principle-say span { display: block; color: #e4b75b; font-size: 13px; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.principle-say { color: #9fe6b2; font-style: italic; }
.principle-say button { cursor: pointer; font-style: normal; }
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useDialogue } from '../../composables/useDialogue';
import type { DialogueScenario } from '../../domain/dialogue/types';
import { beverageProfile, topCigarPairings, topContextPairings } from '../../domain/pairingEngine';
import CharacterModel from '../characters/CharacterModel.vue';
import ComplaintDialog from './ComplaintDialog.vue';
import CustomerThought from './CustomerThought.vue';
import DialogueChoice from './DialogueChoice.vue';
import DialogueMessage from './DialogueMessage.vue';
import RecommendationCard from './RecommendationCard.vue';
import VocabularyHint from './VocabularyHint.vue';

const props = defineProps<{ scenario: DialogueScenario; portraitId?: string }>();
const emit = defineEmits<{ action: [action: 'recommend' | 'complete'] }>();
const { node, state, isComplete, choose, restart } = useDialogue(props.scenario);
const recommendation = computed(() => {
  if (!node.value.recommendationQuery) return undefined;
  if (state.cigarBody) {
    const match = topCigarPairings(state.cigarBody, state.cigarNotes ?? 'coffee', 8)
      .find((item) => state.alcoholPreference !== 'non-alcoholic' || !item.alcoholic);
    if (match) return { title: beverageProfile(match.beverage)?.name ?? match.beverage, detail: match.why, nonAlcoholic: !match.alcoholic };
  }
  const match = topContextPairings({
    mood: state.mood ?? 'neutral',
    activity: state.cigarBody ? 'cigar' : undefined,
    setting: state.cigarBody ? 'balcony' : undefined,
    time_of_day: state.cigarBody ? 'evening' : undefined
  }, 12).find((item) => state.alcoholPreference !== 'non-alcoholic' || item.isNonAlcoholic);
  if (!match) return undefined;
  return { title: beverageProfile(match.beverage)?.name ?? match.beverage, detail: match.why, nonAlcoholic: match.isNonAlcoholic };
});

function onChoice(choice: Parameters<typeof choose>[0]) {
  choose(choice);
}
</script>

<template>
  <section class="dialogue-window" aria-live="polite">
    <header>
      <div><small>LIVE CONVERSATION</small><h2>{{ scenario.title }}</h2></div>
      <button class="quiet-button" type="button" @click="restart">Restart</button>
    </header>
    <div class="dialogue-body">
      <div class="dialogue-portrait">
        <CharacterModel role="customer" :character-id="portraitId || 'marin'" :expression="node.expression" animation="talk" />
      </div>
      <div class="dialogue-copy">
        <DialogueMessage :speaker="node.speaker" :text="node.text" />
        <CustomerThought v-if="node.thought" :text="node.thought" />
        <div v-if="node.vocabulary?.length" class="vocabulary-row">
          <VocabularyHint v-for="entry in node.vocabulary" :key="entry.word" :entry="entry" />
        </div>
        <RecommendationCard v-if="recommendation" v-bind="recommendation" />
        <div v-if="node.choices?.length" class="dialogue-choices">
          <DialogueChoice v-for="(choice, index) in node.choices" :key="choice.id" :choice="choice" :index="index" @select="onChoice" />
        </div>
        <button v-else class="primary-button compact" type="button" @click="$emit('action', 'complete')">Continue service</button>
      </div>
    </div>
    <ComplaintDialog :patience="state.patience" :satisfaction="state.satisfaction" />
  </section>
</template>

import { computed, reactive, ref } from 'vue';
import { applyDialogueEffects, createDialogueState } from '../domain/dialogue/runtime';
import type { DialogueChoice, DialogueScenario } from '../domain/dialogue/types';

export function useDialogue(scenario: DialogueScenario) {
  const nodeId = ref(scenario.startNodeId);
  const state = reactive(createDialogueState(scenario));
  const history = ref<string[]>([]);
  const node = computed(() => scenario.nodes.find((item) => item.id === nodeId.value) ?? scenario.nodes[0]!);
  const isComplete = computed(() => !node.value.choices?.length);

  function choose(choice: DialogueChoice) {
    history.value.push(node.value.id);
    applyDialogueEffects(state, node.value.effects);
    applyDialogueEffects(state, choice.effects);
    if (choice.nextNodeId) nodeId.value = choice.nextNodeId;
  }

  function restart() {
    nodeId.value = scenario.startNodeId;
    history.value = [];
    Object.assign(state, createDialogueState(scenario));
  }

  return { node, state, history, isComplete, choose, restart };
}

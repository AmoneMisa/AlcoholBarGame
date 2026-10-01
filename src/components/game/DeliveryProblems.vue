<script setup lang="ts">
import { computed, ref } from 'vue';
import { INGREDIENTS } from '../../domain/catalog';
import { CLAIM_PHRASES } from '../../domain/situations/claimPhrases';
import { speak } from '../../domain/english/speak';
import { useGameStore } from '../../stores/game';
import { ISSUE_LABEL } from '../../sim/stockQuality';
import UiIcon from '../ui/UiIcon.vue';

// Problems with delivered goods: what went wrong, how to tell the supplier (in English), and what to do with goods
// that can not be used. Goods that are only damaged or close to their date stay on the shelf and are used first.
const game = useGameStore();
const text = ref<Record<string, string>>({});
const open = ref<string>();
const nameOf = (id?: string) => INGREDIENTS.find((item) => item.id === id)?.name ?? id ?? '';
const age = (at: number) => {
  const hours = Math.max(0, Math.round((game.nowMs - at) / 3_600_000));
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
};
const issues = computed(() => game.deliveryIssues.slice(0, 8));
const STATUS: Record<string, string> = { open: 'Open', refunded: 'Refunded', replaced: 'Replaced', rejected: 'Rejected', closed: 'Too late' };
function send(id: string) {
  const sentence = text.value[id]?.trim();
  if (!sentence) return;
  game.reportIssue(id, sentence);
  text.value[id] = '';
}
</script>

<template>
  <section v-if="issues.length || game.quarantine.length" class="delivery-problems">
    <header><small>DELIVERY PROBLEMS</small><b>Check what the suppliers sent</b></header>
    <article v-for="issue in issues" :key="issue.id" class="problem" :class="[issue.kind, issue.status]">
      <div class="problem-head">
        <span class="problem-kind">{{ ISSUE_LABEL[issue.kind] }}</span>
        <b>{{ nameOf(issue.ingredientId) }} <template v-if="issue.deliveredId">→ {{ nameOf(issue.deliveredId) }}</template> · {{ issue.amount }}</b>
        <small>{{ issue.supplier }} · {{ age(issue.at) }} · worth {{ issue.value.toFixed(2) }}</small>
        <em :class="issue.status">{{ STATUS[issue.status] }}</em>
      </div>
      <template v-if="issue.status === 'open'">
        <button type="button" class="link" @click="open = open === issue.id ? undefined : issue.id">{{ open === issue.id ? 'Close' : 'Tell the supplier' }}</button>
        <div v-if="open === issue.id" class="report">
          <div class="ideas">
            <button v-for="phrase in CLAIM_PHRASES[issue.kind]" :key="phrase" type="button" @click="text[issue.id] = phrase">{{ phrase }}</button>
          </div>
          <div class="row">
            <input v-model="text[issue.id]" type="text" maxlength="200" placeholder="Write it in English…" @keyup.enter="send(issue.id)" />
            <button type="button" class="speak" aria-label="Listen" :disabled="!text[issue.id]" @click="speak(text[issue.id]!)"><UiIcon name="speaker" /></button>
            <button type="button" class="send" :disabled="!text[issue.id]?.trim()" @click="send(issue.id)">Send</button>
          </div>
          <small>Be polite, say what is wrong, and mention a photo or the invoice: it helps. You have two tries and three days.</small>
        </div>
      </template>
    </article>
    <div v-if="game.quarantine.length" class="quarantine">
      <small>SET ASIDE — can not be used</small>
      <div v-for="item in game.quarantine" :key="item.id" class="q-item">
        <span>{{ nameOf(item.ingredientId) }} · {{ item.amount }} · {{ item.kind === 'counterfeit' ? 'not original' : 'past its date' }}</span>
        <button type="button" @click="game.discardStock(item.id)">Throw away</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.delivery-problems { margin:12px 0;padding:12px;border:1px solid #6a4a2c;border-radius:12px;background:#1f1a14; }
.delivery-problems > header { display:grid;gap:2px;margin-bottom:8px; }
.delivery-problems > header small { color:#d9b86d;font-size:10px;letter-spacing:.08em; }.delivery-problems > header b { color:#f4ead0;font:700 15px Georgia,serif; }
.problem { padding:8px 10px;margin-top:6px;border:1px solid #4a3d2a;border-radius:10px;background:#251f17; }
.problem.refunded,.problem.replaced { opacity:.65; }
.problem-head { display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;align-items:baseline; }
.problem-head small { grid-column:1 / 3;color:#a99a78;font-size:11px; }
.problem-kind { padding:1px 8px;border-radius:999px;background:#4a3d22;color:#ffe7b0;font-size:10px;font-weight:700; }
.problem.counterfeit .problem-kind,.problem.expired .problem-kind { background:#5a2326;color:#ffd0d0; }.problem.lost .problem-kind { background:#2b3350;color:#c9d6ff; }
.problem em { font-style:normal;font-size:11px;color:#c9b88a; }.problem em.refunded,.problem em.replaced { color:#8fe0a8; }.problem em.rejected,.problem em.closed { color:#e49a9a; }
.link { margin-top:6px;border:0;background:transparent;color:#8fc4ff;font-size:12px;cursor:pointer;text-decoration:underline; }
.report { display:grid;gap:6px;margin-top:6px; }
.ideas { display:grid;gap:4px; }.ideas button { padding:5px 8px;border:1px solid #4a3d2a;border-radius:8px;background:#1d1812;color:#e8dcc0;font-size:12px;text-align:left;cursor:pointer; }.ideas button:hover { border-color:#d9b86d; }
.row { display:flex;gap:6px; }.row input { flex:1;min-width:0;padding:7px 9px;border:1px solid #4a3d2a;border-radius:8px;background:#14110d;color:#f4ead0;font-size:13px; }
.row button { padding:6px 12px;border:1px solid #6a5a2c;border-radius:8px;background:#3a3016;color:#ffe6a8;cursor:pointer; }.row button:disabled { opacity:.45;cursor:not-allowed; }.row .speak { width:36px;padding:0; }
.report small { color:#a99a78;font-size:11px; }
.quarantine { margin-top:10px;padding-top:8px;border-top:1px dashed #4a3d2a; }.quarantine small { color:#d9b86d;font-size:10px;letter-spacing:.08em; }
.q-item { display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:5px;color:#e8dcc0;font-size:12px; }
.q-item button { padding:4px 10px;border:1px solid #7a3a3a;border-radius:8px;background:transparent;color:#ffc9c9;cursor:pointer; }
</style>

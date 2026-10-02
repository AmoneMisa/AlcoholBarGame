<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { HAIR_COLORS, OPTIONS, OPTIONS_BY_MODEL, RIGS, parseSavedLook, serializeLook, validateLook, type Look, type ModelKind } from '../../domain/characterStudio/rig';
import { composeRenderLayers, renderSvg } from '../../domain/characterStudio/art';
import { paintedLook, isPaintedLook, embedPaintedImages } from '../../domain/characterStudio/painted';

const model = ref<ModelKind>('woman');
const looks = reactive<Record<ModelKind, Look>>({ woman: paintedLook('woman'), man: paintedLook('man') });
const look = computed(() => looks[model.value]);
const rig = computed(() => RIGS[model.value]);
const options = computed(() => OPTIONS_BY_MODEL[model.value]);
const section = ref('Face');
const sections = ['Face', 'Hair', 'Wardrobe', 'Accessories'];
const idle = ref(true);
const showMannequin = ref(true);
const anchors = ref(false);
const blink = ref(false);
const gaze = ref('center');
const notice = ref('');
const preview = computed(() => renderSvg(look.value, undefined, anchors.value, model.value));
const layers = computed(() => composeRenderLayers(look.value, model.value));
const fields = computed(() => ({ Face: ['eyes', 'brows', 'nose', 'mouth', 'makeup'], Hair: ['hair'], Wardrobe: ['outfit'], Accessories: ['accessory'] }[section.value] ?? []) as (keyof typeof OPTIONS)[]);
const colors = computed(() => ({ Face: ['skin', 'iris', 'lips'], Hair: ['hairColor'], Wardrobe: ['primary', 'secondary', 'trim'], Accessories: ['trim'] }[section.value] ?? []) as (keyof Look)[]);
const labels: Record<string, string> = { eyes: 'Eye shape', brows: 'Eyebrows', nose: 'Nose', mouth: 'Lips & expression', makeup: 'Makeup', hair: 'Hairstyle', outfit: 'Complete outfit', accessory: 'Jewelry', skin: 'Skin tone', iris: 'Iris', lips: 'Lip color', hairColor: 'Hair color', primary: 'Primary fabric', secondary: 'Secondary fabric', trim: 'Metal & trim' };
function choose(key: keyof typeof OPTIONS, value: string) { Object.assign(look.value, { [key]: value }); }
function switchModel(next: ModelKind) { model.value = next; blink.value = false; notice.value = ''; }
function download(name: string, data: string, mime = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type: mime }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function save() {
  try {
    localStorage.setItem('atelier-looks-v2', JSON.stringify({ active: model.value, looks: (['woman', 'man'] as const).map(key => serializeLook(key, looks[key])) }));
    notice.value = 'Both character looks saved on this device.';
  }
  catch { notice.value = 'Device storage unavailable. Export your look to keep it.'; }
}
function exportLook() { download(`atelier-${model.value}-look.json`, JSON.stringify(serializeLook(model.value, look.value), null, 2)); }
async function importLook(event: Event) {
  const input = event.target as HTMLInputElement;
  try {
    const file = input.files?.[0]; if (!file) return;
    if (file.size > 20_000) throw new Error('File too large');
    const imported = parseSavedLook(JSON.parse(await file.text()));
    Object.assign(looks[imported.model], imported.look);
    switchModel(imported.model); notice.value = `Imported ${imported.model} look into its matching mannequin.`;
  } catch { notice.value = 'This file is not a compatible Atelier look.'; }
  input.value = '';
}
async function exportComposition() {
  try { download(`atelier-${model.value}-character.svg`, await embedPaintedImages(renderSvg(look.value, undefined, false, model.value)), 'image/svg+xml'); }
  catch { notice.value = 'Artwork could not be embedded. Please retry the export.'; }
}
async function exportLayer(event: Event) {
  const select = event.target as HTMLSelectElement;
  const asset = layers.value.find(item => item.id === select.value);
  try { if (asset) download(`${model.value}-${asset.id.replaceAll('/', '-')}.svg`, await embedPaintedImages(renderSvg(look.value, asset, false, model.value)), 'image/svg+xml'); }
  catch { notice.value = 'Layer could not be embedded. Please retry the export.'; }
  select.value = '';
}
let timer: ReturnType<typeof setTimeout>;
let endBlink: ReturnType<typeof setTimeout>;
function scheduleBlink() {
  timer = setTimeout(() => {
    if (idle.value) { blink.value = true; endBlink = setTimeout(() => { blink.value = false; }, 150); }
    scheduleBlink();
  }, 2800 + Math.random() * 3900);
}
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem('atelier-looks-v2') || 'null');
    if (saved && Array.isArray(saved.looks)) {
      for (const item of saved.looks) {
        try { const parsed = parseSavedLook(item); Object.assign(looks[parsed.model], parsed.look); } catch { /* Keep this mannequin's default. */ }
      }
      if (saved.active === 'woman' || saved.active === 'man') model.value = saved.active;
    } else {
      const legacy = JSON.parse(localStorage.getItem('atelier-look-v1') || 'null');
      if (validateLook(legacy, 'woman')) Object.assign(looks.woman, parseSavedLook({ rig: RIGS.woman.id, revision: 1, look: legacy }).look);
    }
  } catch { /* Fresh session or unavailable storage. */ }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) idle.value = false;
  scheduleBlink();
});
onUnmounted(() => { clearTimeout(timer); clearTimeout(endBlink); });
</script>

<template>
  <main class="atelier">
    <header class="atelier-header">
      <a href="?" class="atelier-brand"><span class="brand-symbol">✧</span><span>ATELIER<small>CHARACTER STUDIO</small></span></a>
      <span class="edition">THE VELVET COLLECTION <i> / </i> TWO MUSES</span>
      <span v-if="showMannequin" class="edition">GEOMETRY REVIEW</span><button v-else class="save-look" @click="save">Save look <span>↗</span></button>
    </header>
    <div class="atelier-layout">
      <aside class="atelier-index"><span class="overline">THE COLLECTION</span><h1>A character.<br>Your signature.</h1><p>Small details. Endless expressions.<br>Compose a look that feels like you.</p>
        <div class="model-picker" role="group" aria-label="Character mannequin"><button :aria-pressed="model === 'woman'" @click="switchModel('woman')">Woman</button><button :aria-pressed="model === 'man'" @click="switchModel('man')">Man</button></div>
        <button v-if="showMannequin" class="painted-preset" @click="showMannequin = false">View legacy character ↗</button><template v-else><button class="painted-preset" @click="Object.assign(look, paintedLook(model))">Load painted look</button><nav aria-label="Customization categories"><button v-for="(name, index) in sections" :key="name" :class="{ selected: section === name }" @click="section = name"><span>0{{ index + 1 }}</span>{{ name }}<b>↗</b></button></nav></template>
        <div class="study-note"><span class="study-star">✧</span><p>TWO MUSES, MANY STORIES</p><small>Each mannequin has its own wardrobe.<br>Your selections stay with your character.</small></div>
        <a href="?" class="back-game">← Return to the bar</a>
      </aside>
      <section class="atelier-stage" aria-label="Character preview">
        <div class="stage-label"><span class="overline">{{ showMannequin ? 'ANATOMY CANDIDATE · NOT LOCKED' : isPaintedLook(look, model) ? 'LEGACY PAINTED PROTOTYPE' : 'MIXED / DEVELOPMENT LOOK' }}</span><span v-if="!showMannequin" class="live-dot">{{ idle ? 'Gently alive' : 'Still study' }}</span></div>
        <div class="stage-arch"></div><div class="stage-orbit"></div><span class="stage-flower">✧</span>
        <div v-if="showMannequin" class="character-render mannequin-render"><img :src="`/assets/Character/MannequinCandidates/${model}-base.png`" :alt="`Featureless ${model} mannequin anatomy candidate`" /></div>
        <div v-else class="character-render" :class="[{ animated: idle, blinking: blink && idle }, `gaze-${gaze}`]" v-html="preview"></div>
        <div class="stage-caption"><span>{{ model === 'woman' ? '01' : '02' }}</span><div><h2>{{ showMannequin ? 'Neutral mannequin study' : model === 'woman' ? 'The evening muse' : 'The midnight muse' }}</h2><p>{{ showMannequin ? 'No face · no clothing · proportions under review' : `${look.hair} · ${look.outfit} · ${look.accessory === 'none' ? 'unadorned' : look.accessory}` }}</p></div></div>
        <div class="stage-tools"><button :aria-pressed="showMannequin" @click="showMannequin = !showMannequin">{{ showMannequin ? 'View legacy look' : 'View mannequin study' }}</button><template v-if="!showMannequin"><button :aria-pressed="idle" @click="idle = !idle">{{ idle ? 'Ⅱ Pause motion' : '▷ Play motion' }}</button><button :aria-pressed="anchors" @click="anchors = !anchors">⌖ Anchors</button></template></div>
      </section>
      <aside class="atelier-controls"><div v-if="showMannequin" class="mannequin-note"><span class="overline">ANATOMY REVIEW</span><h2>Base only</h2><p>This is a proposed neutral body silhouette. It contains no facial features, hair, clothing, or accessories. The previous modular look remains available for comparison. New face and wardrobe assets will be fitted to this body only after its geometry passes review.</p></div><template v-else><div class="controls-heading"><span class="overline">MAKE IT YOURS</span><h2>{{ section }}<span>0{{ sections.indexOf(section) + 1 }}</span></h2><p>Considered details, a personal expression.</p></div>
        <fieldset v-for="field in fields" :key="field"><legend>{{ labels[field] }}</legend><div class="choice-grid"><button v-for="option in options[field]" :key="option" :aria-pressed="look[field] === option" @click="choose(field, option)"><span class="choice-mark">{{ field === 'hair' ? '〰' : field === 'outfit' ? '♧' : field === 'accessory' ? '◇' : '―' }}</span>{{ option }}<small v-if="look[field] === option">✓</small></button></div></fieldset>
        <div class="color-region" v-for="color in colors" :key="color"><label :for="`color-${color}`">{{ labels[color] }}</label><div><code>{{ look[color] }}</code><input :id="`color-${color}`" type="color" :value="look[color]" @input="Object.assign(look, { [color]: ($event.target as HTMLInputElement).value })" /></div></div>
        <div v-if="section === 'Hair'" class="hair-palettes"><button v-for="(color, index) in HAIR_COLORS" :key="color" :style="{ background: color }" :aria-label="['Rosewood hair', 'Chestnut hair', 'Silver hair'][index]" :aria-pressed="look.hairColor === color" @click="look.hairColor = color"></button><span>One style. Three moods.</span></div>
        <label v-if="section === 'Face'" class="gaze-control">Gaze <select v-model="gaze"><option>center</option><option>left</option><option>right</option><option>up</option><option>down</option><option>half-blink</option><option>closed</option></select></label>
        <div class="composition-note"><span>◇</span><p>Made to belong together<small>Independent layers. A single, consistent muse.</small></p></div>
        <details class="pipeline"><summary>Studio files & prototype details</summary><p>{{ rig.id }} · 600 × 1000 · orthographic · soft upper-left light. Legacy rig retained for existing looks; anatomy candidate is not locked.</p><button @click="exportLook">Export look JSON</button><label class="import-look">Import look<input type="file" accept="application/json,.json" @change="importLook" /></label><button @click="exportComposition">Export transparent composition</button><select aria-label="Export transparent layer" @change="exportLayer"><option value="">Export individual SVG layer…</option><option v-for="layer in layers" :key="layer.id" :value="layer.id">{{ layer.id }}</option></select><button @click="download(`${model}-rig.json`, JSON.stringify(rig, null, 2))">Export anchor manifest</button><button @click="Object.assign(look, paintedLook(model))">Reset this look</button></details>
        <p class="studio-notice" role="status">{{ notice }}</p>
        </template>
      </aside>
    </div><footer class="atelier-footer"><span>ATELIER / ORIGINAL CHARACTER SYSTEM</span><span>PROTOTYPE 01 <i>✧</i> A STUDY IN POSSIBILITY</span></footer>
  </main>
</template>

<style>
.mannequin-render img{height:100%;width:100%;max-width:600px;object-fit:contain}.mannequin-note h2{font:32px Georgia,serif;font-weight:400;margin:20px 0}.mannequin-note p{color:#a49a92;font-size:12px;line-height:1.9;max-width:28ch}
.model-picker{display:flex;gap:8px;margin-top:24px}.model-picker button{flex:1;padding:10px}.model-picker button[aria-pressed=true]{background:#c8ad8220;border-color:#c8ad82;color:#dcc7a5}
body:has(.atelier){margin:0;min-width:320px;background:#191b1b}.atelier{max-width:none;padding:0;margin:0}
.atelier{--ink:#e8ddd0;--muted:#a49a92;--line:#ffffff13;--gold:#c8ad82;background:#191b1b;color:var(--ink);min-height:100vh;font:14px/1.5 'Segoe UI',sans-serif;letter-spacing:.02em}.atelier *{box-sizing:border-box}.atelier button,.atelier select{font:inherit;color:inherit;cursor:pointer}.atelier button{border:1px solid var(--line);background:transparent}.atelier button:focus-visible,.atelier a:focus-visible,.atelier input:focus-visible,.atelier select:focus-visible{outline:2px solid var(--gold);outline-offset:4px}.atelier-header{height:100px;padding:0 4%;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between}.atelier-brand{display:flex;gap:15px;align-items:center;color:var(--ink);text-decoration:none;font:24px Georgia,serif;letter-spacing:.2em}.brand-symbol{font-size:40px;color:var(--gold)}.atelier-brand small{display:block;font:8px 'Segoe UI',sans-serif;letter-spacing:.28em;margin-top:7px}.edition,.overline{font-size:9px;letter-spacing:.23em;color:var(--muted)}.edition i{margin:0 18px;color:var(--gold)}.atelier .save-look{padding:12px 22px;background:#ceba99;color:#292823;min-width:135px}.save-look span{margin-left:25px}.atelier-layout{display:grid;grid-template-columns:260px minmax(340px,1fr) 345px;max-width:1600px;margin:auto;min-height:800px}.atelier-index{padding:45px 28px;border-right:1px solid var(--line)}.atelier h1{font:34px/1.2 Georgia,serif;font-weight:400;letter-spacing:-.025em;margin:20px 0}.atelier-index>p{font-size:11px;color:var(--muted);line-height:1.9}.atelier-index nav{display:grid;margin-top:46px;gap:6px}.atelier-index nav button{text-align:left;padding:18px 12px;border:0;border-bottom:1px solid var(--line);display:flex;gap:20px;align-items:center}.atelier-index nav button span{font-size:9px;color:var(--muted)}.atelier-index nav button b{font-weight:400;margin-left:auto;opacity:0}.atelier-index nav button.selected{background:#c8ad8210;color:var(--gold);border-bottom-color:#c8ad8260}.atelier-index nav button.selected b{opacity:1}.study-note{margin-top:90px}.study-star{font-size:35px;color:var(--gold)}.study-note p{font-size:8px;letter-spacing:.17em}.study-note small{font-size:10px;color:var(--muted);line-height:1.9}.back-game{display:block;margin-top:35px;font-size:10px;color:var(--muted);text-decoration:none}.atelier-stage{position:relative;overflow:hidden;min-height:800px;background:radial-gradient(ellipse at 45% 45%,#4c4c412e,transparent 67%),#222626}.stage-label{position:absolute;top:27px;left:27px;right:27px;display:flex;justify-content:space-between;z-index:2}.live-dot{font-size:9px;color:#afa994}.live-dot:before{content:'';display:inline-block;border-radius:50%;width:5px;height:5px;background:#adb998;margin-right:7px}.stage-arch{position:absolute;inset:100px 12% 100px;border:1px solid #c9b38c28;border-radius:260px 260px 0 0;background:linear-gradient(145deg,#c9b38c09,transparent 70%)}.stage-orbit{position:absolute;bottom:80px;left:15%;right:15%;height:50px;border-radius:50%;background:#1116;filter:blur(12px)}.stage-flower{position:absolute;right:14%;top:120px;color:#c9b38c44;font-size:50px}.character-render{position:absolute;inset:40px 0 65px;display:flex;justify-content:center}.character-render svg{height:100%;width:100%;max-width:600px;overflow:visible}.stage-caption{position:absolute;bottom:85px;left:25px;display:flex;align-items:center;gap:12px;pointer-events:none;text-shadow:0 2px 10px #000}.stage-caption>span{font:37px Georgia,serif;color:#c8ad8277}.stage-caption h2{font:21px Georgia,serif;margin:0}.stage-caption p{font-size:9px;color:var(--muted);text-transform:capitalize;margin:6px 0}.stage-tools{position:absolute;bottom:23px;left:25px;right:25px;display:flex;justify-content:space-between}.stage-tools button{border:0;font-size:10px;padding:8px;color:var(--muted)}.stage-tools button[aria-pressed=true]{color:var(--gold)}.atelier-controls{padding:36px 27px;border-left:1px solid var(--line)}.controls-heading h2{font:30px Georgia,serif;margin:10px 0}.controls-heading h2 span{float:right;font:12px 'Segoe UI',sans-serif;color:var(--muted);margin-top:10px}.controls-heading>p{font-size:10px;color:var(--muted);margin-bottom:26px}.atelier fieldset{border:0;padding:0;margin:0 0 20px}.atelier legend{font-size:11px;margin-bottom:10px}.choice-grid{display:flex;gap:7px}.choice-grid button{position:relative;flex:1;padding:9px 3px;font-size:10px;text-transform:capitalize;border-radius:3px;min-width:0}.choice-grid button[aria-pressed=true]{border-color:#c8ad8290;background:#c8ad8210}.choice-grid small{position:absolute;top:4px;right:5px;color:var(--gold);font-size:8px}.choice-mark{display:block;font:23px Georgia,serif;color:var(--gold);height:31px}.color-region{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding:12px 0;font-size:11px}.color-region>div{display:flex;align-items:center;gap:10px}.color-region code{font-size:9px;color:var(--muted)}.color-region input{height:27px;width:27px;padding:0;border:0;background:transparent;cursor:pointer}.hair-palettes{display:flex;align-items:center;gap:10px;margin:18px 0}.hair-palettes button{width:25px;height:25px;border-radius:50%}.hair-palettes button[aria-pressed=true]{outline:1px solid var(--gold);outline-offset:3px}.hair-palettes span{font-size:10px;color:var(--muted)}.gaze-control{display:flex;justify-content:space-between;align-items:center;font-size:11px;margin:10px 0}.atelier select{background:#272b2b;border:1px solid var(--line);padding:6px;max-width:100%;font-size:11px}.composition-note{border-top:1px solid var(--line);padding-top:20px;margin-top:25px;display:flex;gap:10px;align-items:center;color:var(--gold)}.composition-note>span{font-size:24px}.composition-note p{font-size:10px;margin:0}.composition-note small{display:block;color:var(--muted);font-size:8px;margin-top:4px}.pipeline{margin-top:22px;color:var(--muted);font-size:10px}.pipeline summary{cursor:pointer}.pipeline button,.pipeline select,.import-look{display:block;margin-top:8px;width:100%;padding:8px;text-align:left}.import-look{border:1px solid var(--line);cursor:pointer}.import-look input{display:block;width:100%;margin-top:6px;font-size:10px}.studio-notice{font-size:11px;color:var(--gold)}.atelier-footer{border-top:1px solid var(--line);display:flex;justify-content:space-between;padding:19px 4%;font-size:8px;letter-spacing:.17em;color:var(--muted)}.atelier-footer i{margin:0 15px;color:var(--gold)}
/* Common parent motion preserves the attachment of every layer. Local motion is reserved for loose details. */
.animated .rig{animation:atelier-breathe 6s ease-in-out infinite;transform-origin:300px 943px}.animated .hair{animation:atelier-hair 6s ease-in-out infinite;transform-origin:var(--pivot-hair)}.animated .fabric{animation:atelier-fabric 6s ease-in-out infinite;transform-origin:var(--pivot-fabric)}.animated .accessory{animation:atelier-jewel 6s ease-in-out infinite;transform-origin:var(--pivot-accessory)}.blinking .eye-open,.gaze-closed .eye-open{display:none}.blinking .eye-shut,.gaze-closed .eye-shut{display:inline}.gaze-left .gaze{transform:translateX(-2px)}.gaze-right .gaze{transform:translateX(2px)}.gaze-up .gaze{transform:translateY(-2px)}.gaze-down .gaze{transform:translateY(2px)}.gaze-half-blink .eye-open{transform:scaleY(.5)}
@keyframes atelier-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.002)}}@keyframes atelier-hair{0%,100%{transform:rotate(-.12deg)}50%{transform:rotate(.12deg)}}@keyframes atelier-fabric{0%,100%{transform:scaleX(1)}50%{transform:scaleX(1.001)}}@keyframes atelier-jewel{0%,100%{transform:rotate(-.15deg)}50%{transform:rotate(.15deg)}}
@media(prefers-reduced-motion:reduce){.atelier .animated .rig,.atelier .animated .hair,.atelier .animated .fabric,.atelier .animated .accessory{animation:none}}
@media(min-width:1500px){.atelier-layout{min-height:900px}.atelier-stage{min-height:900px}}
@media(max-width:1050px){.atelier-layout{grid-template-columns:190px minmax(300px,1fr) 290px}.atelier-index{padding:35px 18px}.atelier h1{font-size:28px}.atelier-controls{padding:30px 18px}.edition{display:none}}
@media(max-width:790px){.atelier-header{height:78px}.atelier-layout{grid-template-columns:1fr 290px}.atelier-index{grid-column:1/-1;padding:16px 20px;border-right:0;border-bottom:1px solid var(--line)}.atelier-index>.overline,.atelier-index h1,.atelier-index>p,.study-note,.back-game{display:none}.atelier-index nav{display:flex;margin:0;gap:10px}.atelier-index nav button{flex:1;padding:10px;gap:8px;font-size:11px}.atelier-index nav button b{display:none}.atelier-stage{min-height:760px}.atelier-footer{font-size:7px;gap:20px}}
@media(max-width:560px){.atelier-layout{display:flex;flex-direction:column}.atelier-stage{min-height:650px}.atelier-controls{border-left:0;border-top:1px solid var(--line);padding:26px}.atelier-brand{font-size:19px}.atelier .save-look{min-width:110px;padding:10px}.atelier-footer span:last-child{display:none}.character-render{inset:40px 0 65px}.stage-caption{bottom:65px}.atelier-index nav button span{display:none}}
/* Never let a taller controls tab resize the character's viewport. */
.atelier-stage{height:800px;align-self:start}
@media(min-width:1500px){.atelier-stage{height:900px}}
@media(max-width:790px){.atelier-stage{height:760px}.model-picker{margin-top:0;margin-bottom:14px}}
@media(max-width:560px){.atelier-stage{height:650px;align-self:stretch;flex:none}}
</style>

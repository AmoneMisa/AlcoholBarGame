<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import UiButton from '../ui/UiButton.vue';
import UiInput from '../ui/UiInput.vue';
import UiIcon from '../ui/UiIcon.vue';
import ModalDialog from '../ui/ModalDialog.vue';
import ConfirmDialog from '../ui/ConfirmDialog.vue';
import PanelHeading from '../ui/PanelHeading.vue';
import InventoryPanel from '../workshop/InventoryPanel.vue';
import { INVENTORY_CATEGORIES, type InventoryCategory } from '../../domain/inventoryCategories';
import OptionSelect from './OptionSelect.vue';
import DeliveryProblems from './DeliveryProblems.vue';
import BottleModel from '../cocktails/BottleModel.vue';
import GlassModel from '../cocktails/GlassModel.vue';
import BrandBottle from '../knowledge/BrandBottle.vue';
import { INGREDIENTS, RECIPES, REGIONS } from '../../domain/catalog';
import { ALCOHOL_PRODUCTS, ALCOHOL_TYPE_LABELS } from '../../domain/bottleCatalog';
import { guideIdForProduct } from '../../data/knowledge/alcohol';
import { capacityFor, isPerishable } from '../../domain/warehouse';
import type { Ingredient, RegionId } from '../../domain/types';
import { useGameStore } from '../../stores/game';
const game = useGameStore();
const stockCategory = ref<'all' | 'spirit' | 'mixer' | 'fresh' | 'food' | Exclude<InventoryCategory, 'all'> | 'cards'>('all');
const recipeCardInventory = computed(() => RECIPES.map(recipe => ({ recipe, quantity: game.recipeCopies[recipe.id] ?? 0 })).filter(item => item.quantity > 0));
const stockTabs = computed(() => {
  const tabs: { id: typeof stockCategory.value; label: string }[] = [{ id:'all',label:'All' },{ id:'spirit',label:'Spirits' },{ id:'mixer',label:'Mixers' },{ id:'fresh',label:'Fresh' },{ id:'food',label:'Food' }];
  tabs.push(...INVENTORY_CATEGORIES.filter(tab=>tab.id!=='all'));
  if (recipeCardInventory.value.length) tabs.push({id:'cards',label:'Cards'});
  return tabs;
});
const collectionCategory=computed(()=>INVENTORY_CATEGORIES.some(tab=>tab.id===stockCategory.value && tab.id!=='all') ? stockCategory.value as InventoryCategory : undefined);
const isStockKind = computed(() => ['all','spirit','mixer','fresh','food'].includes(stockCategory.value));
const isPagedStock = computed(() => isStockKind.value || stockCategory.value === 'cards');
const search = ref('');
const query = computed(() => search.value.trim().toLowerCase());
const ingredientById = (id: string) => INGREDIENTS.find(item=>item.id===id)!;
const bottleById = (id: string) => ALCOHOL_PRODUCTS.find(item=>item.id===id)!;
const uiCategory = (ingredient: Ingredient) => ingredient.category === 'food' ? 'food' : ingredient.category === 'spirit' ? 'spirit' : ingredient.category === 'mixer' && !['sugar-syrup','coconut-cream','milk','coconut-milk'].includes(ingredient.id) ? 'mixer' : 'fresh';
const stockedIngredients = computed(() => game.inventory.filter(stock=>stock.amount>0));
const stockedBottles = computed(() => game.bottleInventory.filter(stock=>stock.quantity>0));
const matchingStock = computed(() => stockedIngredients.value.filter(stock => {
  const ingredient=ingredientById(stock.ingredientId);
  return (stockCategory.value==='all' || uiCategory(ingredient)===stockCategory.value) && (!query.value || ingredient.name.toLowerCase().includes(query.value));
}));
const matchingBottles = computed(() => stockedBottles.value.filter(stock => {
  const product=bottleById(stock.productId);
  return !query.value || `${product.name} ${product.brand} ${ALCOHOL_TYPE_LABELS[product.type]}`.toLowerCase().includes(query.value);
}));
const stockPage=ref(1);
const STOCK_PER_PAGE=8;
const matchingEntries=computed(()=>[
  ...matchingStock.value.map(stock=>`ingredient:${stock.ingredientId}`),
  ...(['all','spirit'].includes(stockCategory.value) ? matchingBottles.value.map(stock=>`bottle:${stock.productId}`) : []),
  ...(['all','cards'].includes(stockCategory.value) ? recipeCardInventory.value.filter(item=>!query.value || item.recipe.name.toLowerCase().includes(query.value)).map(item=>`recipe:${item.recipe.id}`) : [])
]);
const stockPages=computed(()=>Math.max(1,Math.ceil(matchingEntries.value.length/STOCK_PER_PAGE)));
const currentStockPage=computed(()=>Math.min(stockPage.value,stockPages.value));
const pageEntries=computed(()=>new Set(matchingEntries.value.slice((currentStockPage.value-1)*STOCK_PER_PAGE,currentStockPage.value*STOCK_PER_PAGE)));
const visibleStock=computed(()=>matchingStock.value.filter(stock=>pageEntries.value.has(`ingredient:${stock.ingredientId}`)));
const visibleBottles=computed(()=>matchingBottles.value.filter(stock=>pageEntries.value.has(`bottle:${stock.productId}`)));
const visibleRecipeCards=computed(()=>recipeCardInventory.value.filter(item=>pageEntries.value.has(`recipe:${item.recipe.id}`)));
watch(stockPages,pages=>{stockPage.value=Math.min(stockPage.value,pages);});
const ownedBars=computed(()=>REGIONS.filter(region=>game.isBarOwned(region.id)));
const targetRegions=computed(()=>ownedBars.value.filter(region=>region.id!==game.regionId));
const barUnits=(id:RegionId)=>game.inventories[id].reduce((sum,stock)=>sum+stock.amount,0);
const barBottles=(id:RegionId)=>game.bottleInventories[id].reduce((sum,stock)=>sum+stock.quantity,0);
const capacityOf=(id:string)=>capacityFor(ingredientById(id),game.loot.equipment[game.regionId]?.fridge?.level??0);
const selection=ref<{kind:'ingredient'|'bottle';id:string}>();
const quantity=ref('1');
const targetId=ref('');
const busy=ref(false);
const confirmingDiscard=ref(false);
const selected=computed(()=>{
  if(!selection.value)return undefined;
  const {kind,id}=selection.value;
  if(kind==='ingredient') {
    const item=ingredientById(id),stock=game.inventory.find(stock=>stock.ingredientId===id);
    if(!stock?.amount)return undefined;
    const reserved=game.currentMix.find(part=>part.ingredientId===id)?.amount??0;
    return {kind,id,name:item.name,amount:stock.amount,available:Math.max(0,stock.amount-reserved),unit:item.unit,reserved};
  }
  const item=bottleById(id),stock=game.bottleInventory.find(stock=>stock.productId===id);
  return stock?.quantity ? {kind,id,name:item.name,amount:stock.quantity,available:stock.quantity,unit:'bottles',reserved:0} : undefined;
});
const validQuantity=computed(()=>!!selected.value && Number.isSafeInteger(Number(quantity.value)) && Number(quantity.value)>0 && Number(quantity.value)<=selected.value.available);
function inspect(kind:'ingredient'|'bottle',id:string){selection.value={kind,id};quantity.value='1';targetId.value=targetRegions.value[0]?.id??'';confirmingDiscard.value=false;}
async function manage(operation:'transfer'|'discard'){
  if(!selected.value || !validQuantity.value || busy.value)return;
  busy.value=true;
  try {
    const ok=await game.manageStock({type:'manageStock',kind:selected.value.kind,id:selected.value.id,quantity:Number(quantity.value),operation,...(operation==='transfer'?{targetId:targetId.value as RegionId}:{})});
    if(ok){selection.value=undefined;confirmingDiscard.value=false;}
  } finally {busy.value=false;}
}
watch([search,()=>game.regionId,stockCategory],()=>{stockPage.value=1;selection.value=undefined;confirmingDiscard.value=false;});
</script>
<template>
  <article class="game-panel inventory-deck">
    <PanelHeading :eyebrow="`STOCK ROOM · ${game.region.name}`" title="Current stock" :aside="`${stockedIngredients.length} ingredients · ${stockedBottles.length} sealed brands`" />
    <div v-if="ownedBars.length>1" class="bar-switcher" aria-label="Choose a bar inventory">
      <button v-for="region in ownedBars" :key="region.id" :class="{active:region.id===game.regionId}" type="button" @click="game.switchBar(region.id)"><b>{{region.name}}</b><small>{{barUnits(region.id).toLocaleString()}} units · {{barBottles(region.id)}} bottles</small></button>
    </div>
    <div class="category-tabs inventory-filter"><button v-for="tab in stockTabs" :key="tab.id" type="button" :class="{active:stockCategory===tab.id}" @click="stockCategory=tab.id">{{tab.label}}</button></div>
    <div v-if="isPagedStock" class="stock-tools"><UiInput v-model="search" label="Find stock" type="search" placeholder="Search ingredients, brands or cards" /><small v-if="isStockKind">Tap an item to transfer or discard it.</small></div>
    <InventoryPanel v-if="collectionCategory" :category="collectionCategory" />
    <section v-if="isStockKind && visibleStock.length" class="stock-section" aria-label="Ingredient stock">
      <h3>Ingredients <span>{{matchingStock.length}}</span></h3>
      <div class="stock-list">
        <button v-for="stock in visibleStock" :key="stock.ingredientId" type="button" class="stock-row" :aria-label="`Manage ${ingredientById(stock.ingredientId).name}`" @click="inspect('ingredient',stock.ingredientId)">
          <span class="stock-picture"><BottleModel :ingredient="ingredientById(stock.ingredientId)" /></span>
          <span class="stock-copy"><b>{{ingredientById(stock.ingredientId).name}}</b><small>{{uiCategory(ingredientById(stock.ingredientId))}}<template v-if="isPerishable(ingredientById(stock.ingredientId))"> · perishable</template><template v-if="game.lowGrade[stock.ingredientId]?.damaged"> · {{game.lowGrade[stock.ingredientId]!.damaged}} damaged</template><template v-if="game.lowGrade[stock.ingredientId]?.expiring"> · {{game.lowGrade[stock.ingredientId]!.expiring}} old</template></small></span>
          <span class="stock-quantity"><b>{{stock.amount}} {{ingredientById(stock.ingredientId).unit}}</b><small>of {{capacityOf(stock.ingredientId)}}</small></span><UiIcon name="chevron-right" />
        </button>
      </div>
    </section>
    <section v-if="isStockKind && visibleBottles.length" class="stock-section" aria-label="Sealed bottle stock">
      <h3>Sealed bottles <span>{{matchingBottles.length}} brands</span></h3>
      <div class="stock-list">
        <button v-for="stock in visibleBottles" :key="stock.productId" type="button" class="stock-row" :aria-label="`Manage ${bottleById(stock.productId).name}`" @click="inspect('bottle',stock.productId)">
          <span class="stock-picture"><BrandBottle :brand="bottleById(stock.productId).brand" :category="guideIdForProduct(bottleById(stock.productId))" :color="bottleById(stock.productId).color" /></span>
          <span class="stock-copy"><b>{{bottleById(stock.productId).name}}</b><small>{{ALCOHOL_TYPE_LABELS[bottleById(stock.productId).type]}} · {{bottleById(stock.productId).volumeMl}} ml</small></span>
          <span class="stock-quantity"><b>×{{stock.quantity}}</b></span><UiIcon name="chevron-right" />
        </button>
      </div>
    </section>
    <p v-if="isPagedStock && !matchingEntries.length" class="stock-empty">No stock matches this filter.</p>
    <DeliveryProblems />
    <section v-if="isPagedStock && visibleRecipeCards.length" class="stock-section">
      <h3>Recipe cards</h3><div class="stock-list"><div v-for="item in visibleRecipeCards" :key="item.recipe.id" class="stock-row recipe-stock-row"><span class="stock-picture"><GlassModel :art-index="RECIPES.indexOf(item.recipe)" :recipe-id="item.recipe.id" type="coupe"/></span><span class="stock-copy"><b>{{item.recipe.name}}</b><small>Duplicates for mastery upgrades</small></span><span class="stock-quantity"><b>×{{item.quantity}}</b></span></div></div>
    </section>
    <nav v-if="isPagedStock && matchingEntries.length" class="stock-pagination" aria-label="Inventory pages"><UiButton size="sm" icon="arrow-left" aria-label="Previous inventory page" :disabled="currentStockPage===1" @click="stockPage=currentStockPage-1"/><span role="status">{{currentStockPage}} / {{stockPages}} · {{matchingEntries.length}} items</span><UiButton size="sm" icon="arrow-right" aria-label="Next inventory page" :disabled="currentStockPage===stockPages" @click="stockPage=currentStockPage+1"/></nav>
    <ModalDialog v-if="selected" :title="selected.name" close-label="Close stock item" @close="selection=undefined;confirmingDiscard=false">
      <div class="stock-manage">
        <p>{{selected.available}} {{selected.unit}} available<small v-if="selected.reserved">{{selected.reserved}} {{selected.unit}} reserved in your current glass.</small></p>
        <UiInput v-model="quantity" :label="`Quantity (${selected.unit})`" type="number" min="1" :max="selected.available" step="1" />
        <UiButton size="sm" variant="ghost" :disabled="busy||!selected.available" @click="quantity=String(selected.available)">All available</UiButton>
        <template v-if="targetRegions.length"><OptionSelect label="Move to bar" v-model="targetId" :options="targetRegions.map(region=>({value:region.id,label:region.name}))"/><UiButton block icon="arrow-right" :disabled="busy||!validQuantity||!targetId" @click="manage('transfer')">Transfer</UiButton></template>
        <small v-else>Transfer becomes available when you own another bar.</small>
        <UiButton block variant="danger" icon="trash" :disabled="busy||!validQuantity" @click="confirmingDiscard=true">Discard</UiButton>
      </div>
    </ModalDialog>
    <ConfirmDialog v-if="confirmingDiscard&&selected" title="Discard stock?" confirm-label="Discard stock" danger :disabled="busy||!validQuantity" @cancel="confirmingDiscard=false" @confirm="manage('discard')"><p>Discard {{quantity}} {{selected.unit}} of {{selected.name}} to free storage space. These goods will be lost.</p></ConfirmDialog>
  </article>
</template>
<style scoped>
.inventory-deck .stock-copy,.inventory-deck .stock-copy b,.inventory-deck .stock-copy small{text-align:left}
.inventory-filter{padding:8px 12px;border-bottom:1px solid #2b3c52;gap:5px}
.stock-tools{display:grid;gap:6px;padding:10px 12px}.stock-tools>small{color:#9eafc2;font-size:12px}
.stock-section{padding:6px 12px 12px}.stock-section h3{display:flex;justify-content:space-between;gap:8px;margin:4px 0 8px;color:#f4dbad;font-size:14px}.stock-section h3 span{color:#9eafc2;font-size:12px;font-weight:400}
.stock-list{border:1px solid #304158;border-radius:10px;overflow:hidden;background:#0d1928}.stock-row{display:grid;grid-template-columns:36px minmax(0,1fr) auto 14px;align-items:center;gap:8px;width:100%;min-height:62px;padding:7px 9px;border:0;border-bottom:1px solid #293a50;border-radius:0;background:transparent;color:#e7edf4;text-align:left;cursor:pointer}.stock-row:last-child{border-bottom:0}.stock-row:hover,.stock-row:focus-visible{background:#1a2c41}.stock-row>.ui-icon{width:14px;height:14px;color:#bda473}
.stock-picture{display:block;width:36px;height:44px;overflow:hidden}.stock-picture :deep(.bottle-visual),.stock-picture :deep(.glass-model){width:36px!important;height:44px!important;min-width:0!important;margin:0!important;transform:none!important}.stock-copy{min-width:0}.stock-copy b{display:block;font-size:13px;line-height:17px;font-weight:600;overflow-wrap:anywhere}.stock-copy small,.stock-quantity small{display:block;color:#9cabbe;font-size:11px;line-height:15px}.stock-copy small{margin-top:2px;text-transform:capitalize}.stock-quantity{text-align:right;white-space:nowrap}.stock-quantity b{font-size:12px;color:#f1d8a8}.stock-empty{margin:8px 0;padding:0 12px 12px;color:#9eafc2;font-size:13px}.stock-pagination{display:flex;align-items:center;justify-content:center;gap:12px;padding:12px 12px 16px;font-size:12px;color:#aab9ca}.stock-manage{display:grid;gap:12px}.stock-manage p{margin:0;font-size:14px}.stock-manage small{display:block;color:#aab9ca;font-size:12px;line-height:1.4}.recipe-stock-row{grid-template-columns:36px minmax(0,1fr) auto;cursor:default}
</style>

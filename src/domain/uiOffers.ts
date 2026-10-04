import { ref } from 'vue';

export const currencyOffer = ref<'crystals' | 'coins'>();
export const requestedDrawPool=ref<string>();
export const acquisitionOffer = ref<{kind:'style'|'background'|'companion';id:string;label:string}>();
export function offerCurrency(currency:'crystals'|'coins') { currencyOffer.value=currency; }
export function handleCurrencyError(message:string):boolean {
  if (!/not enough|need|insufficient|cannot afford|can not afford/i.test(message)) return false;
  const currency=/crystal/i.test(message)?'crystals':/coins?|money|funds/i.test(message)?'coins':undefined;
  if (!currency) return false;
  offerCurrency(currency); return true;
}
export function navigateTo(view:string,section?:string) {
  if(view==='theme-draw') requestedDrawPool.value=section;
  acquisitionOffer.value=undefined; currencyOffer.value=undefined;
  window.dispatchEvent(new CustomEvent('barlingo:navigate',{detail:{view,section}}));
}

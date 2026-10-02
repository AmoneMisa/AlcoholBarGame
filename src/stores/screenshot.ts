import { reactive, watch } from 'vue';
import { defineStore } from 'pinia';
export const SCREENSHOT_OPTIONS = [
  {id:'bartender',label:'Bartender',default:true},
  {id:'customers',label:'Customers',default:true},
  {id:'tipJar',label:'Tip jar',default:true},
  {id:'emptySeats',label:'Empty seat silhouettes',default:false},
  {id:'guestCards',label:'Guest cards',default:false},
  {id:'arrivalTimers',label:'Arrival timers',default:false}
] as const;
export type ScreenshotPreferences = Record<typeof SCREENSHOT_OPTIONS[number]['id'],boolean>;
const KEY='barlingo.screenshot';
export const useScreenshotStore=defineStore('screenshot',()=>{
  let saved:Partial<ScreenshotPreferences>={};
  try {saved=JSON.parse(localStorage.getItem(KEY)??'{}')??{};} catch { /* Keep defaults if storage is unavailable. */ }
  const prefs=reactive(Object.fromEntries(SCREENSHOT_OPTIONS.map(option=>[option.id,typeof saved[option.id]==='boolean'?saved[option.id]:option.default])) as ScreenshotPreferences);
  watch(prefs,()=>{try{localStorage.setItem(KEY,JSON.stringify(prefs));}catch{/* Private browsing. */}},{deep:true});
  return {prefs};
});

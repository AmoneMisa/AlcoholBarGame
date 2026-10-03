import { defineAsyncComponent, type Component } from 'vue';
import LoadError from '../components/ui/LoadError.vue';
import { loadPageStyles, type PageStyles } from './pageStyles';

// A page that is fetched when the player first opens it. If it cannot be fetched, the player sees a message with a
// reload button instead of an empty screen.
export const lazyPage = (loader: () => Promise<Component | { default: Component }>, styles: PageStyles[] = []) => defineAsyncComponent({
  loader: async () => {
    const [component] = await Promise.all([loader(), ...styles.map(loadPageStyles)]);
    return component as Component;
  },
  errorComponent: LoadError,
  timeout: 20_000,
  delay: 0
});

import { defineAsyncComponent, type Component } from 'vue';
import LoadError from '../components/ui/LoadError.vue';

// A page that is fetched when the player first opens it. If it cannot be fetched, the player sees a message with a
// reload button instead of an empty screen.
export const lazyPage = (loader: () => Promise<Component | { default: Component }>) => defineAsyncComponent({
  loader: loader as () => Promise<Component>,
  errorComponent: LoadError,
  timeout: 20_000,
  delay: 0
});

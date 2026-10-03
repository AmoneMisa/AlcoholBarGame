import learning from '../learning.css?url';
import management from '../management.css?url';
import knowledge from '../knowledge.css?url';
import conversation from '../conversation.css?url';

const files = { learning, management, knowledge, conversation };
export type PageStyles = keyof typeof files;
const order: PageStyles[] = ['conversation', 'management', 'learning', 'knowledge'];
const requests = new Map<PageStyles, Promise<void>>();

// Called by the async component's mount loader, never by speculative code warmup.
export function loadPageStyles(name: PageStyles) {
  const existing = requests.get(name);
  if (existing) return existing;
  const request = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = files[name];
    link.dataset.pageStyles = name;
    link.onload = () => resolve();
    link.onerror = () => { link.remove(); requests.delete(name); reject(new Error(`Could not load ${name} styles`)); };
    // Preserve the original cascade: page rules precede UI kit and final polish.
    const following = [...document.querySelectorAll<HTMLLinkElement>('link[data-page-styles]')]
      .find(existing => order.indexOf(existing.dataset.pageStyles as PageStyles) > order.indexOf(name));
    document.head.insertBefore(link, following ?? document.querySelector('meta[name="page-styles-anchor"]'));
  });
  requests.set(name, request);
  return request;
}

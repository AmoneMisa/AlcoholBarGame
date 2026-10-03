import { RECIPES } from './catalog';
import { ALCOHOL_PRODUCTS } from './bottleCatalog';
import { foodById } from './foods';
import type { Customer } from './types';

export function foodRequestLine(guest: Customer) {
  const request = guest.social?.foodRequest;
  if (!request) return 'Could I have something to eat with my drink, please?';
  const product = ALCOHOL_PRODUCTS.find(item => item.id === (guest.serveRequest?.productId ?? guest.bottleRequest?.productId ?? guest.social?.lastDrink?.productId));
  const drink = product?.name ?? RECIPES.find(item => item.id === (guest.social?.lastDrink?.recipeId ?? guest.orderRecipeId))?.name ?? 'my drink';
  if (request.kind === 'specific') return `Could I have ${foodById(request.itemId ?? '')?.name.toLowerCase() ?? 'a snack'} with ${drink}, please?`;
  if (request.kind === 'recommend') return `What food would you recommend to go with ${drink}?`;
  return `I would like something to eat with ${drink}. You choose — something that pairs well, please.`;
}

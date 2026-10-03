import { LootError } from './lootCore';
import { TradeError } from './tradeActions';
// Loaded by the client only when crafting, opening loot or trading is requested.
import { upgradeEquipment, promoteEquipment, openBox, pickChoice, buyBox, buyConsumable, useFragmentChoice, useConsumable, discardLoot, drawStyle, claimSpark, craftSkin, craftStyle, designSignature, claimLeaderboardReward, claimQuest, claimAchievement } from './lootActions';
import { acceptDeal, haggle, makeOffer, startNegotiation } from './tradeActions';
import { DELIVERY_DAY_MS, type PlayerState } from './state';
import { RuleError, type GameAction, type RuleContext } from './rulesCore';
const cleanText = (text: unknown, max: number) => typeof text === 'string' ? text.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) : '';
export function applyRareAction(state: PlayerState, action: GameAction, context: RuleContext) {
const now = context.now; const random = context.random ?? Math.random;
switch (action.type) {
    case 'startNegotiation':
    case 'haggle':
    case 'makeOffer':
    case 'acceptDeal':
    case 'leaveNegotiation': {
      try {
        if (action.type === 'startNegotiation') startNegotiation(state, action.supplierId, action.cart, now);
        else if (action.type === 'haggle') {
          const text = cleanText(action.text, 240);
          if (text.length < 3) throw new RuleError('Write a sentence first.');
          haggle(state, text, { checkEnglish: context.checkEnglish, random, now });
        } else if (action.type === 'makeOffer') makeOffer(state, action.price, { random, now });
        else if (action.type === 'acceptDeal') acceptDeal(state, now, DELIVERY_DAY_MS);
        else state.negotiation = undefined;
      } catch (error) {
        if (error instanceof TradeError) throw new RuleError(error.message);
        throw error;
      }
      break;
    }

    case 'upgradeEquipment':
    case 'promoteEquipment':
    case 'openBox':
    case 'pickReward':
    case 'buyBox':
    case 'buyConsumable':
    case 'useFragmentChoice':
    case 'useConsumable':
    case 'discardLoot':
    case 'drawStyle':
    case 'claimSpark':
    case 'craftSkin':
    case 'craftStyle':
    case 'designSignature':
    case 'claimLeaderboardReward':
    case 'claimQuest':
    case 'claimAchievement': {
      try {
        switch (action.type) {
          case 'upgradeEquipment': upgradeEquipment(state, action.item, now, action.regionId); break;
          case 'promoteEquipment': promoteEquipment(state, action.item, action.regionId); break;
          case 'openBox': openBox(state, action.box, random, now); break;
          case 'pickReward': pickChoice(state, action.index, random); break;
          case 'buyBox': buyBox(state, action.box, action.quantity); break;
          case 'buyConsumable': buyConsumable(state, action.id, action.quantity); break;
          case 'useFragmentChoice': useFragmentChoice(state, action.id, action.targetId); break;
          case 'useConsumable': useConsumable(state, action.id, action.recipeId, now); break;
          case 'discardLoot': discardLoot(state, action.kind, action.id, action.amount); break;
          case 'drawStyle': drawStyle(state, action.count, action.banner, now, random); break;
          case 'claimSpark': claimSpark(state, action.cosmeticId, now); break;
          case 'craftSkin': craftSkin(state, action.cosmeticId); break;
          case 'craftStyle': craftStyle(state, action.cosmeticId); break;
          case 'designSignature': designSignature(state, { name: action.name, items: action.items, needsShake: action.needsShake }); break;
          case 'claimLeaderboardReward': claimLeaderboardReward(state, context.leaderboard, now); break;
          case 'claimQuest': claimQuest(state, action.questId, now); break;
          case 'claimAchievement': claimAchievement(state, action.id); break;
        }
      } catch (error) {
        if (error instanceof LootError) throw new RuleError(error.message);
        throw error;
      }
      break;
    }

default: throw new RuleError('Unknown action.');
}
}

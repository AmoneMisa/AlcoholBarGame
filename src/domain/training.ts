import type { Customer } from './types';

export const TRAINING_HELP = 'How can I help you?';
export const TRAINING_CONFIRM = 'Would you like a Gin & Tonic?';
export const TRAINING_PAYMENT = 'Would you like to pay by card or in cash?';

// Construct the guest explicitly: no random customer's hidden order or social traits can leak in.
export function trainingGuest(): Customer {
  return {
    id:'practice-guest',name:'Mia',characterId:'marin',seatId:0,mood:'calm',
    orderKind:'cocktail',orderRecipeId:'gin-tonic',orderRevealed:false,
    patience:86400,patienceRemaining:86400,budget:100,priceFactor:1,paymentMethod:'cash',smoker:false,
    request:'A Gin & Tonic, please.',wish:'A crisp, refreshing drink with gin and tonic.',
    greeting:'Hi! I am your practice guest. I would like a Gin & Tonic, please.',
    social:{emotion:'happy',rapport:80,drunk:0,chatty:false,topic:'work',gender:'f',phase:'ordering',nextOrderAt:Number.MAX_SAFE_INTEGER,rounds:0,staysFor:0,chatted:[],hungry:false}
  };
}
export function trainingQuestions(guest:Customer,turns:number) {
  if(guest.pendingPayment) return [{text:TRAINING_PAYMENT}];
  return turns===0 ? [{text:TRAINING_HELP},{text:TRAINING_CONFIRM}] : [{text:TRAINING_CONFIRM}];
}

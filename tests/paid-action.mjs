import { applyAction } from '../src/sim/rules.ts';

// Economy and guest-lifecycle tests complete both parts of service: hand over the
// order, then accept its bill through the same dialogue action players use.
export function completeAction(state, action, context) {
  const result = applyAction(state, action, context);
  if (['serve', 'autoServe', 'sellBottle', 'serveFood', 'pitchAsk'].includes(action.type)) {
    const guest = state.customers.find(item => item.pendingPayment);
    if (guest && !guest.social?.event) {
      applyAction(state, { type: 'openConversation', customerId: guest.id }, context);
      applyAction(state, { type: 'say', text: 'Would you like to pay by card or in cash?' }, { ...context, checkEnglish: text => ({ ok: true, corrected: text }) });
    }
  }
  return result;
}

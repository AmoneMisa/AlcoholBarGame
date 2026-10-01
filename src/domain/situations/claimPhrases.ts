import type { IssueKind } from '../../sim/stockQuality';

// Sentences a player can use to tell a supplier about a delivery problem. Polite, clear and with proof works best.
export const CLAIM_PHRASES: Record<IssueKind, string[]> = {
  lost: ['Two boxes are missing from the delivery. Could you check, please?', 'The delivery did not arrive. Could you send me the tracking number, please?'],
  damaged: ['One box is damaged. Can I send you a photo?', 'Part of the order arrived damaged. Could you send a replacement, please?'],
  wrong: ['This is not what I ordered. Could you send the right product, please?', 'You sent the wrong product. I have the invoice.'],
  counterfeit: ['I think these bottles are fake. Could you refund them, please?', 'This product is not original. I can send you a photo.'],
  expiring: ['These goods are almost past their date. Could you replace them, please?', 'The date on the box is very close. Could you check this, please?'],
  expired: ['These goods are past their date. Could you refund them, please? I have the invoice.', 'The products are expired. I can send you a photo.']
};

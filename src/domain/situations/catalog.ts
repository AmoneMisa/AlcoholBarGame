import { BREAKAGE_SITUATIONS } from './breakage';
import { COMPLAINT_SITUATIONS } from './complaints';
import { EMERGENCY_SITUATIONS } from './emergencies';
import { FLIRT_SITUATIONS } from './flirt';
import { ADVICE_SITUATIONS } from './advice';
import { GOOD_SITUATIONS } from './good';
import { MEDICAL_SITUATIONS } from './medical';
import { PAYMENT_SITUATIONS } from './payments';
import { RULE_SITUATIONS } from './ruleSituations';
import { THREAT_SITUATIONS } from './threats';
import type { SituationDef } from './types';

// Every situation the game can run. Categories live in their own files; add a file and list it here.
export const SITUATIONS: SituationDef[] = [
  ...PAYMENT_SITUATIONS, ...RULE_SITUATIONS, ...BREAKAGE_SITUATIONS, ...THREAT_SITUATIONS, ...EMERGENCY_SITUATIONS,
  ...MEDICAL_SITUATIONS, ...FLIRT_SITUATIONS, ...GOOD_SITUATIONS, ...ADVICE_SITUATIONS, ...COMPLAINT_SITUATIONS
];

const INDEX = new Map(SITUATIONS.map((situation) => [situation.id, situation]));
export const situationById = (id: string) => INDEX.get(id);


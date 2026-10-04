import { ACHIEVEMENTS, type StatId } from './quests';

export const ACHIEVEMENT_CATEGORIES = [
  { id:'all', label:'All', stats:[] as StatId[] },
  { id:'service', label:'Service', stats:['serves','vips','bottles','signatures','tasted'] as StatId[] },
  { id:'english', label:'English', stats:['perfectTalks','lessons'] as StatId[] },
  { id:'collection', label:'Collection', stats:['boxes','draws','backgrounds','skins'] as StatId[] },
  { id:'management', label:'Management', stats:['upgrades','coinsSpent','crystalsSpent','bars','barUpgrades','staffHired','staffLevels'] as StatId[] },
  { id:'social', label:'Friends', stats:['visitedBy','visitedFriends','giftsSent','giftsGot','companions','bonds'] as StatId[] },
  { id:'progress', label:'Progress', stats:['level','loginDays'] as StatId[] },
  { id:'completed', label:'Completed', stats:[] as StatId[] }
];
export function currentAchievements(claimed: readonly string[]) {
  return [...new Set(ACHIEVEMENTS.map(item => item.series))].map(series => {
    const tiers = ACHIEVEMENTS.filter(item => item.series === series);
    const next = tiers.find(item => !claimed.includes(item.id));
    return { goal: next ?? tiers[tiers.length - 1]!, finished: !next };
  });
}

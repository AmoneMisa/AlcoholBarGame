# Workshop: equipment, boxes, consumables, style draw, prestige

All rules live in `src/domain/loot.ts` (tables) and `src/sim/loot.ts` (server-side rules, called from `applyAction`).
State is `PlayerState.loot` (`src/domain/lootState.ts`), validated in `normalizePlayerState`.

- **Equipment** (per bar): shaker, ice machine, fridge, speakers, register, cellar. Levels 1-10, upgrade = coins + parts. Tier caps: common 5, rare 8, legendary 10; item shards raise the tier; prestige "cap" perk adds levels.
- **Boxes**: bronze / silver / gold (random, sold for crystals) and choice (pick 1 of 3, earned). Level-ups grant boxes (bronze; silver every 5th; choice every 10th), VIP/special guests, a 7-day login streak and prestige.
- **Consumables**: Happy Hour, XP / Coin / Tip boosters (timed, one active per kind), VIP Magnet, Golden Ice, Supplier Voucher, Second Chance (armed charges), Express Courier, Recipe Scroll.
- **Style draw**: 60 crystals or 540 for ten. Odds 70 / 27 / 3 %, Rare guaranteed per 10, Legendary pity at 50, weekly featured Legendary (50 % of Legendary wins). Duplicates become skin shards; shards craft a chosen skin (20 / 40 / 100).
- **Prestige** (level 50): resets money, XP, stock, equipment; keeps recipes, styles, crystals, parts, boxes. Stars = 2 + floor(sqrt(run earnings / 400)); spend them on pay, supplier prices, equipment cap and starting coins.

Random actions (`openBox`, `pickReward`, `drawStyle`, `prestige`) are server-only in the client store. Crystal changes reach the existing crystal ledger automatically.

## Quests, achievements, tasting log
`src/domain/quests.ts`. Server rules count serves, coins, VIPs, bottles, boxes, draws, upgrades and tasted recipes (`track` in `sim/loot.ts`).
- **Weekly quests**: three per week, rotating from the server clock; progress resets each week; reward crystals plus a box.
- **Achievements**: lifetime counters (kept through prestige); larger ones give a choice box.
- **Tasting log**: the first successful serve of each recipe gives 2 parts and 3 skin shards; each newly poured brand gives 1 skin shard.

## Balance notes
`scripts/sim-loot.mjs` (run with `node --import ./tests/register.mjs scripts/sim-loot.mjs`) plays ~400 perfect serves with the real rules and opens every box earned. Findings that shaped the numbers:
- The XP curve now needs ~700 served orders for the level 50 cap (steps of 60, 130, 200… XP; level 25 ≈ 170 serves). A run earns ~15-19k coins, ~600 parts and ~900 crystals; one fully upgraded bar (all six items at level 8 ≈ 18k coins / 400 parts) roughly matches a run's income. Equipment costs were cut from 90·n^1.7 to 35·n^1.5 coins (level 5 ≈ 1k coins / 29 parts, level 10 ≈ 5k / 95 parts per item).
- Box coins were worth more than serving itself (13k vs ~8k per run); coin rewards and their level scaling (1 + level/25) were cut so boxes are ~25 % of run income.
- Bronze boxes come every second level (was every level), silver from special guests 40 % of the time.
- Equipment effects: shaker 2 %/level, register 1.5 %/level; prestige pay 1.5 %/rank; tier promotion 8 / 20 shards; draw 50 / 450 crystals.

## Hardening, English rewards, regulars, storeroom
- **Loot ledger** (`database/migrations/005_loot_ledger.sql`): every box/draw/pick/shop/claim/prestige is logged with its message and detail (draw results, pity). The server rolls with `crypto.getRandomValues`.
- **Onboarding**: new accounts get one bronze box; the first box a player opens always holds 8 parts. The Workshop shows a "Getting started" checklist. Notifications: box received, booster ended.
- **English rewards**: a perfect conversation pays parts equal to its difficulty; every third one (or any difficulty 4+) drops a box. Finishing the 3 daily lessons drops a bronze box (silver on a 7-day learning streak). Matching weekly quests / achievements.
- **Regulars** (`domain/regulars.ts`): each guest portrait earns loyalty (+1 per serve, +1 VIP, +1 favourite drink); levels at 3/8/15/25 pay boxes, parts, shards and crystals; regulars pay +10% for their favourite starter recipe.
- **Storeroom** (`domain/warehouse.ts`): capacity 5000 ml / 120 pieces per ingredient per bar (+10% per fridge level); orders beyond it are refused, late deliveries clamp. From level 3, fruit, herbs and milks spoil 12% of stock per day (whole units only, so tiny reserves survive), minus 1.2 points per fridge level (none at level 10).

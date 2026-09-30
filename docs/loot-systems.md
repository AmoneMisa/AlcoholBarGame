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

## Friend gifts
Consumables (one per gift) and skin shards (5 / 10 / 20) can be sent to friends you are visiting. Items move, they are never created; a sender may send 5 Workshop gifts per day (`LOOT_GIFTS_PER_DAY`).

## Signature cocktail
`domain/signature.ts`, `sim/loot.ts`. Unlocks at level 15; one per bar; costs 300 coins to develop or replace (replacing restarts fame).
- **Design:** 2-5 ingredients of your known recipes, at least one spirit, 60-250 ml of liquid, amounts in pour steps, optional shaking. Price is computed by the server from the ingredients (base 7 + spirit strength + variety + balanced sour/sweet, long drink and garnish bonuses, "too strong" penalty; range 6-15) and shown live in the designer.
- **Guests:** about 15 % of arriving guests come for it. They only say they heard about the house special; the bartender must bring it up in the English conversation (by name or "the house special") before the order is confirmed and the drink can be served. The snapshot (`Customer.signature`, `orderRecipeId = 'signature'`) is hidden from the client until then, judged by `requiredRecipe`, and cannot be swapped. The invented name is masked for the spell checker, and a signature talk counts as difficulty 3 for the perfect-English reward.
- **Fame:** serves at 10 / 30 / 60 raise price by 5 % per level and pay a bronze / silver / choice box. Achievement: serve it 50 times.
- Saved signatures are re-validated when loaded; the price is always recomputed.

## Weekly leaderboard
`domain/leaderboard.ts`, `sim/loot.ts`, `server/gameService.mjs`, `database/migrations/006_weekly_scores.sql`.
- **Score** = XP earned in the current UTC week (`loot.weekly`, measured as the XP change of each action, so it follows every XP source, and ignores prestige resets). A drink pays the same XP at any level, so newcomers compete with veterans.
- **Storage:** one `weekly_scores` row per player per week, upserted by the server after an action that changed the score (it only ever goes up). The public label is the **bar name**, never the account name. Ties are won by whoever reached the score first.
- **API:** `POST /api/leaderboard` returns the top 20, the player's rank, and last week's standing with a `claimable` reward.
- **Rewards** (claim once, for the previous week only, needs 300 XP): Champion #1 choice + gold box + 60 crystals; Podium #2-3 choice + silver + 30; Top 10 gold + 15; Top 25 silver; everyone else with 300 XP a bronze box. The rank is looked up by the server (`RuleContext.leaderboard`) and is never read from the client's action; offline practice has no leaderboard.

## Seasonal banners
`domain/seasons.ts`, `drawStyle` / `claimSpark` in `sim/loot.ts`. One season per UTC month (themed name), computed from the server clock.
- **Banner:** the Style draw tab has a Season banner and a Standard banner (same costs, same odds and pity). On the season banner two featured legendary styles win 75 % of Legendary pulls (the standard banner's weekly featured style wins 50 %). The twelve legendaries rotate so each is featured once a year; nothing is ever locked to a season, and every style can also be crafted from skin shards.
- **Progress** (`loot.season`, resets each month): season draws pay a silver box at 10, a gold box at 30 and a choice box at 60 (paid once, also inside a ten-draw). After 80 draws the player may pick one featured style for free (Spark, once per season; refused if already owned).
- A "New season" notification is shown once per season. Draws are audited with their banner and season progress.

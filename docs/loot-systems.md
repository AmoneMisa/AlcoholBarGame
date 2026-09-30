# Workshop: equipment, boxes, consumables, style draw, prestige

All rules live in `src/domain/loot.ts` (tables) and `src/sim/loot.ts` (server-side rules, called from `applyAction`).
State is `PlayerState.loot` (`src/domain/lootState.ts`), validated in `normalizePlayerState`.

- **Equipment** (per bar): shaker, ice machine, fridge, speakers, register, cellar. Levels 1-10, upgrade = coins + parts. Tier caps: common 5, rare 8, legendary 10; item shards raise the tier; prestige "cap" perk adds levels.
- **Boxes**: bronze / silver / gold (random, sold for crystals) and choice (pick 1 of 3, earned). Level-ups grant boxes (bronze; silver every 5th; choice every 10th), VIP/special guests, a 7-day login streak and prestige.
- **Consumables**: Happy Hour, XP / Coin / Tip boosters (timed, one active per kind), VIP Magnet, Golden Ice, Supplier Voucher, Second Chance (armed charges), Express Courier, Recipe Scroll.
- **Style draw**: 60 crystals or 540 for ten. Odds 70 / 27 / 3 %, Rare guaranteed per 10, Legendary pity at 50, weekly featured Legendary (50 % of Legendary wins). Duplicates become skin shards; shards craft a chosen skin (20 / 40 / 100).
- **Prestige** (level 50): resets money, XP, stock, equipment; keeps recipes, styles, crystals, parts, boxes. Stars = 2 + floor(sqrt(run earnings / 400)); spend them on pay, supplier prices, equipment cap and starting coins.

Random actions (`openBox`, `pickReward`, `drawStyle`, `prestige`) are server-only in the client store. Crystal changes reach the existing crystal ledger automatically.

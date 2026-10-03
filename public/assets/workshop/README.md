# Workshop, Circle and achievement art

One WebP per thing, in a folder named after what it is. The game shows it instead of the emoji; if a file is missing the emoji is used.

| folder          | file names (the id used in the game data)                                                                 |
|-----------------|-------------------------------------------------------------------------------------------------------------|
| `boxes`         | `bronze`, `silver`, `gold`, `choice`                                                                        |
| `items`         | `happy-hour`, `xp-boost`, `coin-boost`, `tip-boost`, `vip-magnet`, `golden-ice`, `voucher`, `second-chance`, `calm-charm`, `whisper`, `steady-hand`, `courier`, `scroll` |
| `equipment`     | `shaker`, `ice-machine`, `fridge`, `speakers`, `register`, `cellar`                                         |
| `shards`        | `skin`, `style`, `parts`, `circle` (item shards use the equipment picture)                                 |
| `resources`     | `crystals`, `coins`, `xp` (used on the daily wheel)                                                         |
| `keepsakes`     | `book`, `flowers`, `vinyl`, `sweets`, `watch`                                                               |
| `companions`    | the person's id, for example `mirelle` (a round face crop for the Circle)                                   |
| `achievements`  | the series name, for example `serves`, `bonds`, `companions`                                                |

Square, transparent or flat background, 256 x 256 px, under about 40 KB. Full-figure portraits of the Circle live in `public/assets/characters/companions/`.

Player reward art now uses transparent painted items instead of the old flat framed placeholders. Resources (coins, crystals, XP), parts, all four chests, and Battle Pass boosters use versioned `-painted-v1.webp` files selected by `src/domain/itemArtwork.ts`. Prestige and supplies have separate painted resource images. The painted fragment puzzle lives in `public/assets/ui/fragment-puzzle-painted-v1.webp`; the specific item's thumbnail is overlaid by RewardArt. Install selected generations with `node scripts/install-reward-art.mjs`, using `scripts/painted-reward-art.json` for source provenance.

All six bar equipment images and all thirteen consumable illustrations now use versioned painted WebP assets. The four additional choice puzzles are independent consumable items; each exchanges for ONE item-specific fragment. Every achievement series has four baked WebP medal stages named <series>-tier-1..4.webp; profiles and Events use the same images. Popup backgrounds are painted raster textures with a dark readability overlay.

Keepsakes now use five transparent painted illustrations (book, flowers, sweets, vinyl, watch). The daily wheel is a painted enamel wheel with exactly twelve 30-degree sectors and a gold rim. Its server-selected stop and animation are unchanged. Install generated sources with `node scripts/install-keepsake-art.mjs`, using `scripts/painted-keepsake-art.json`.

The compatibility filenames now contain painted artwork too. `scripts/build-workshop-art.py` only copies painted assets; it no longer generates emoji placeholders. Legacy achievement pictures use their bronze stage, and legacy fragment symbols use the painted puzzle. Simple black vacant-guest silhouettes and small button glyphs retain their intentional shapes.

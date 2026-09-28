# BarLingo game update

## Implemented

- Coins are the only gameplay currency. No gems or energy limits.
- Supplier-specific regional prices, changing each game shift, with rotating 15% product deals.
- Multi-product purchase baskets, quantity controls, 5% off at five packs and 10% off at ten packs. Delivery fees and free-delivery minimums apply after discounts.
- Scheduled deliveries return to the bar that placed the order, even when the player manages another location.
- Multi-product selling pays immediately. Ingredients reserved in the glass cannot be sold or transferred.
- Each of the six locations has its own saved inventory, name, room, wall mood, counter, lighting, and bartender outfit.
- Real-calendar daily gifts: 150 / 250 / 400 / 550 / 700 / 850 / 1,000 coins; day 7 onward stays at 1,000. A missed day resets the streak. In-game shifts cannot farm gifts. A recipe is an additional 12% chance reward.
- Fifteen customer appearances: five existing plus ten newly illustrated models. Concurrent customers have distinct appearances.
- Ten starter recipes; additional recipes unlock through the shop, special requests, or a daily gift. Lessons include history, ingredients, method, and occasion tags. Recommendation Academy explains what, why, and who.
- All generated question templates are accepted by the English checker and can be constructed from their word banks. Corrected phrases insert all required tiles, including repeated words. Shared article handling fixes “an Old Fashioned.” Longest-name matching distinguishes Espresso Martini from Martini.
- Mobile ingredient filters and horizontal scrolling; +5 ml liquid / +1 item measurements. Pointer cancellation does not accidentally add an ingredient.

## Architecture and components

`src/domain/economy.ts` owns pricing quotes, discount tiers, dates, and streak rewards. `src/stores/game.ts` owns atomic transactions, delivery routes, location profiles, and validated local saves. `src/data/cosmetics/bars.ts` owns room options and city coordinates. Business rules are tested outside Vue components.

New UI components: `MarketPanel`, `WorldMap`, and `UiIcon`. Updated art/model components: `CharacterModel`, `BottleModel`, `IngredientArt`, `GlassModel`, `BarScene`, and `CocktailWorkspace`.

Dialogue components: `ConversationPopup`, word selection, typed sentence entry, grammar feedback, customer replies, taste clues, candidate drinks, and order confirmation. Supporting modules live in `src/domain/conversation` and `src/domain/english`.

Animations: customer idle/listen/reaction transforms; bottle tilt and glug; a neck-to-liquid stream, splash and surface ripple; falling garnish; shaker motion; serving motion. The pour is measured against the rendered glass bowl instead of unrelated fixed coordinates. Character expressions use existing illustrated faces and restrained motion; no artificial mouth overlay.

## Generated artwork

Generated using the built-in image generation tool, not Blender or the API/CLI fallback. Transparent sprite alpha is retained. All four final assets are checked into the project:

| File | Purpose |
| --- | --- |
| `public/assets/characters/customers/extended-cast.png` | Ten original customers in a five-column, two-row sprite atlas |
| `public/assets/characters/bartender/noa-wardrobe.png` | Three illustrated outfits for the same bartender |
| `public/assets/bar/backgrounds/botanical-room.png` | Botanical room interior |
| `public/assets/bar/backgrounds/skyline-lounge.png` | Skyline lounge interior |

Production prompt specifications:

1. **Customer atlas:** Original polished, painterly 2D cocktail-bar game character artwork. Exactly ten distinct adult guests, arranged on a transparent five-column, two-row atlas. Consistent equal-size cells and scale; upper-body, front-facing relaxed poses with clean silhouettes. Diverse faces, ages, hairstyles and evening outfits; no props across neighboring cells, text, cell borders, fake mouth shapes, or background. Designed for independent CSS sprite cropping.
2. **Bartender wardrobe:** Original polished, painterly 2D cocktail-bar game artwork. The same adult female bartender, consistent face, curly dark hair, natural pose and proportions, repeated in three equal transparent cells. One burgundy waistcoat over a white shirt, one rolled-sleeve white shirt, one dark apron. Upper-body to hips, complete head and hands, no text, background, borders, or overlapping cells. Outfit changes must be painted clothing, not flat color overlays.
3. **Botanical room:** Wide original premium 2D game bar interior, warm evening light, green botanical walls and trailing plants, rich wood, brass lamps and detailed bottle shelves. Frontal bar-counter composition with a clear foreground surface for gameplay and no guests, UI, text or logos. Painterly illustration with coherent perspective and textured materials.
4. **Skyline lounge:** Wide original premium 2D game bar interior, midnight blue and purple lounge, sunset city skyline through tall windows, dark marble counter, brass lamps, elegant sofas and detailed illuminated bottle shelves. Frontal counter view with clear foreground surface for gameplay. No people, UI, text or logos. Match the illustrated visual polish of the other interiors.

The coastlines are **not** generated art: `public/assets/bar/world-land.geojson` is Natural Earth's public-domain 1:110m land dataset, sourced from the Natural Earth vector repository. `scripts/build-world-map.mjs` deterministically projects it into `public/assets/bar/world-land.svg`. Buttons use actual city longitude/latitude.

Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson

## Verification and limitations

- Vue/TypeScript validation passes.
- Production Vite build passes.
- Nine automated tests pass, covering grammar/tile reachability, discounts, regional prices, gift streaks and persistence, atomic deliveries, reserved stock, transfers, names/styles and customer model coverage.
- Browser checks at desktop and 390 × 844 mobile: market filters, bulk quote/free-delivery threshold, location naming, artwork, map, and five-customer scene.

This is a local game economy, not a server-authoritative economy: saves and daily claims use local storage and the device calendar. Clearing storage or changing the device clock can affect progression. Cross-device syncing and anti-cheat require a backend.

The English checker is an explainable short-conversation rule checker with a spelling dictionary, not a general-purpose language model. Customer replies are generated from recipe/taste rules. Portraits use sprite motion rather than frame-by-frame facial animation. Some ingredient art remains hand-authored SVG and the playable glass remains CSS geometry; these are intentionally code-native assets, not a 3D fluid simulation. The HUD clock is a static evening-shift indicator.

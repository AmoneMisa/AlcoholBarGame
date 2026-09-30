# BarLingo game update

## Implemented

- Coins are the only gameplay currency. No gems or energy limits.
- Supplier-specific regional prices, changing each game shift, with rotating 15% product deals.
- Multi-product purchase baskets, quantity controls, 5% off at five packs and 10% off at ten packs. Delivery fees and free-delivery minimums apply after discounts.
- Scheduled deliveries return to the bar that placed the order, even when the player manages another location.
- Multi-product selling pays immediately. Ingredients reserved in the glass cannot be sold or transferred.
- Each of the six locations has its own saved inventory, name, room, wall mood, counter, lighting, bartender model, custom bartender nickname, and bartender outfit.
- Real-calendar daily gifts: 150 / 250 / 400 / 550 / 700 / 850 / 1,000 coins; day 7 onward stays at 1,000. A missed day resets the streak. In-game shifts cannot farm gifts. A recipe is an additional 12% chance reward.
- Twenty-five customer appearances: five original models plus two ten-character illustrated atlases. Concurrent customers have distinct appearances.
- Full-bottle retail alongside cocktail service. Customers may ask for one to three sealed bottles; the English dialogue reveals total budget, alcohol type, taste, occasion and optional favourite brand. The recommendation panel scores stocked products by coverage, flags over-budget choices, confirms quantity and total, then deducts per-bar bottle stock and records the sale.
- Seventy popular branded products across whiskey, bourbon, liqueur, vodka, gin, rum, tequila, aperitif, vermouth, port wine, cognac, brandy, beer, alcohol-free beer, soju, sake, cider, fruit wine, herbal and specialty liqueurs, sambuca, sangria, infused spirits (настойки), Champagne and sparkling wine. Examples include Jack Daniel’s, Jägermeister, Hennessy, Guinness, Heineken 0.0, CHOYA, MauiWine, Molinari, Don Simón, Nemiroff, Żubrówka, Bols Blue Curaçao, Midori, Moët & Chandon and Veuve Clicquot. Every product includes bottle size, ABV, retail price, origin, taste profile and occasion tags.
- Sixty-four cocktail recipes: ten starters and fifty-four locked lessons, all visible in the full catalog with a “Need to learn first” state. Additional lessons unlock through the shop, special requests, or a daily gift. Every card and lesson shows calculated serving ABV and strength; lessons include history, ingredients, method, and occasion tags. Recommendation Academy explains what, why, and who.
- All generated question templates are accepted by the English checker and can be constructed from their word banks. Corrected phrases insert all required tiles, including repeated words. Shared article handling fixes “an Old Fashioned.” Longest-name matching distinguishes Espresso Martini from Martini.
- Mobile ingredient filters and horizontal scrolling; +5 ml liquid / +1 item measurements. Pointer cancellation does not accidentally add an ingredient.

## Architecture and components

`src/domain/economy.ts` owns pricing quotes, discount tiers, dates, and streak rewards. `src/stores/game.ts` owns atomic transactions, delivery routes, location profiles, and validated local saves. `src/data/cosmetics/bars.ts` owns room options and city coordinates. Business rules are tested outside Vue components.

New UI components: `MarketPanel`, `WorldMap`, and `UiIcon`. Updated art/model components: `CharacterModel`, `BottleModel`, `IngredientArt`, `GlassModel`, `BarScene`, and `CocktailWorkspace`.

Dialogue components: `ConversationPopup`, word selection, typed sentence entry, grammar feedback, customer replies, taste clues, candidate drinks, and order confirmation. Supporting modules live in `src/domain/conversation` and `src/domain/english`.

Animations: customer idle/listen/reaction transforms; bottle tilt and glug; a neck-to-liquid stream, splash and surface ripple; falling garnish; shaker motion; serving motion. The pour is measured against the rendered glass bowl instead of unrelated fixed coordinates. Character expressions use existing illustrated faces and restrained motion; no artificial mouth overlay.

## Generated artwork

Generated using the built-in image generation tool, not Blender or the API/CLI fallback. Transparent sprite alpha is retained. All six final assets are checked into the project:

| File | Purpose |
| --- | --- |
| `public/assets/characters/customers/extended-cast.png` | Ten original customers in a five-column, two-row sprite atlas |
| `public/assets/characters/customers/extended-cast-2.png` | Ten additional diverse customers in a five-column, two-row sprite atlas |
| `public/assets/characters/bartender/noa-wardrobe.png` | Three glamorous illustrated outfits for Noa |
| `public/assets/characters/bartender/leo-wardrobe.png` | Three illustrated outfits for muscular, tattooed Leo |
| `public/assets/bar/backgrounds/botanical-room.png` | Botanical room interior |
| `public/assets/bar/backgrounds/skyline-lounge.png` | Skyline lounge interior |

Production prompt specifications:

1. **Customer atlas:** Original polished, painterly 2D cocktail-bar game character artwork. Exactly ten distinct adult guests, arranged on a transparent five-column, two-row atlas. Consistent equal-size cells and scale; upper-body, front-facing relaxed poses with clean silhouettes. Diverse faces, ages, hairstyles and evening outfits; no props across neighboring cells, text, cell borders, fake mouth shapes, or background. Designed for independent CSS sprite cropping.
2. **Additional customer atlas:** Match the first atlas's premium painterly rendering, warm rim light, waist-up framing and precise five-column, two-row transparent layout while creating ten entirely new adults. Vary age, presentation, skin tone, body build, hair and upscale evening clothing; keep every head, hand and elbow inside its cell; no repeated identities, props crossing cells, text, borders, scenery or watermarks.
3. **Noa wardrobe:** Preserve Noa's adult identity and premium painterly style in three centered transparent cells. Fashion-forward, elegant and sensual but non-explicit: burgundy corset-waistcoat with off-shoulder ivory blouse; black bustier-inspired top with cropped ivory tailored jacket; fitted black blouse with emerald waist-cinching apron. Consistent pose, face, scale and anchor; no text, props, scenery or overlapping cells.
4. **Leo wardrobe:** Original adult male bartender in three centered transparent cells. Clearly muscular V-shaped body with broad shoulders, developed chest and thick arms; consistent geometric forearm, botanical-serpent arm and compass chest tattoos. Burgundy velvet vest; open white shirt with suspenders; fitted black sleeveless shirt with emerald apron. Warm, premium painterly mobile-game rendering; no text, scenery or overlapping cells.
5. **Botanical room:** Wide original premium 2D game bar interior, warm evening light, green botanical walls and trailing plants, rich wood, brass lamps and detailed bottle shelves. Frontal bar-counter composition with a clear foreground surface for gameplay and no guests, UI, text or logos. Painterly illustration with coherent perspective and textured materials.
6. **Skyline lounge:** Wide original premium 2D game bar interior, midnight blue and purple lounge, sunset city skyline through tall windows, dark marble counter, brass lamps, elegant sofas and detailed illuminated bottle shelves. Frontal counter view with clear foreground surface for gameplay. No people, UI, text or logos. Match the illustrated visual polish of the other interiors.

The coastlines are **not** generated art: `public/assets/bar/world-land.geojson` is Natural Earth's public-domain 1:110m land dataset, sourced from the Natural Earth vector repository. `scripts/build-world-map.mjs` deterministically projects it into `public/assets/bar/world-land.svg`. Buttons use actual city longitude/latitude.

Source: https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_land.geojson

## Verification and limitations

- Vue/TypeScript validation passes.
- Production Vite build passes.
- Automated tests cover the complete 64-recipe catalog and ABV estimates, branded-bottle matching and sales, all bottle names in English dialogue, grammar/tile reachability, discounts, regional prices, gift streaks and persistence, atomic deliveries, reserved stock, transfers, names/styles and customer model coverage.
- Browser checks at desktop and 390 × 844 mobile: market filters, bulk quote/free-delivery threshold, location naming, artwork, map, and five-customer scene.

This is a local game economy, not a server-authoritative economy: saves and daily claims use local storage and the device calendar. Clearing storage or changing the device clock can affect progression. Cross-device syncing and anti-cheat require a backend.

The English checker is an explainable short-conversation rule checker with a spelling dictionary, not a general-purpose language model. Customer replies are generated from recipe/taste rules. Portraits use sprite motion rather than frame-by-frame facial animation. Some ingredient art remains hand-authored SVG and the playable glass remains CSS geometry; these are intentionally code-native assets, not a 3D fluid simulation. The HUD clock is a static evening-shift indicator.

## 3D bartender (prototype)

The bartender is a rigged 3D "mannequin" rendered with three.js (`src/components/characters/Person3D.vue`); the painted 2D character remains only as a fallback for devices without WebGL.

- **Two mannequins, one skeleton:** `bartender-female.glb` and `bartender-male.glb` (built by `python scripts/blender/build_bartender.py --gender both`, needs `pip install bpy==4.2.0`). Both share identical joints, so all 13 animation clips fit both; they differ in body volumes and default face.
- **Everything is a separate, named mesh with its own material and UVs:** `body`, `head`, `ears`, and swappable slots `eyes_<shape>`, `brows_<shape>`, `nose_<shape>`, `mouth_<shape>`, `cheeks_<shape>`, `hair_<style>`, `beard_<style>`, `cloth_<part>`. Only the chosen mesh of each slot is shown. Face part shapes are defined in `src/data/character/faceParts.json`, shared by Blender and the game.
- **Colours and textures:** materials are named by role (`skin_body`, `skin_head`, `hair`, `brow`, `lip`, `iris`, `shirt`, `vest`, ...). `src/domain/character3dTextures.ts` paints skin layers on canvases at runtime: skin tone (14 tones) and tan, blush, eyeshadow, eyeliner, freckles, scars, tattoos, plus hair-strand and cloth-weave textures. The UV layout is documented at the top of the Blender script.
- **Customisation:** `src/domain/character3d.ts` maps the saved bar profile to morph weights, colours and visible meshes. `tests/character3d.test.mjs` checks every option against both real GLB files.
- **Special outfits** are real accessory meshes (`acc_*`): gala bow tie and pocket square, cyberpunk visor and shoulder pads, steampunk top hat, goggles and belt, post-apocalypse bandana, shoulder plate and bandolier, historical jabot and tricorn, fantasy cloak and circlet, masquerade mask and feather. Colours come from the outfit table in `character3d.ts`.
- **Size:** each model is ~1.7 MB after meshopt compression (the build script runs `gltf-transform` if it is installed: `npm i -g @gltf-transform/cli`; the game loads it with three's `MeshoptDecoder`).
- **Guests are 3D too (prototype, look under review):** `customerLook.ts` builds every guest from their id (same guest = same look; named regulars keep gender and skin tone), `CustomerStage3D.vue` draws all guests on one canvas, `Person3D.vue` draws the conversation portraits. The procedural mannequins do not match the painted 2D art style yet.

## 3D bar props

The glass, the pour stream, the shaker and the orange / salt icons are 3D now (no more CSS glass or SVG art):

- `scripts/blender/build_props.py` builds `public/assets/props3d/bar-props.glb` (~100 KB): 10 glass types (profiles in `src/data/props/glasses.json`), a liquid volume per glass, ice, garnishes (lime, orange, mint, pineapple, cherry), the cobbler shaker, an orange and a salt shaker.
- `Glass3D.vue` is the live glass on the bar: liquid clipped at the fill level (stays level when the glass tilts), ice, bubbles, garnish, a 3D pour stream while a bottle is over the glass, and the shaker taking over while shaking.
- `PropThumb.vue` shows cached still renders of any prop (one shared WebGL context), used by `GlassModel` and `BottleModel`.
- Bottles and cocktail pictures stay painted 2D art; `IngredientArt.vue` (SVG) is gone.

## Small screens and clean-up

- On phones, guests wait along a track that a horizontal swipe over the guest band scrolls (`guest-scroller` in `BarScene.vue`); a tap on the band still opens the guest under the finger.
- Removed dead code: the unused dialogue subsystem (10 files), unused exports/imports, ~550 unused CSS rules and 17 unused keyframes (checked by comparing computed styles of ~54,000 elements on every screen before and after), and ~12 MB of unused images.

## Deploy to the server

`.github/workflows/docker-master.yml` now has a `deploy` job that runs after tests, build and image publish on every push to `master`. It uses the GitHub environment **Production**:

- secret `DEPLOY_SSH_KEY` (private key; the public key must be in `~/.ssh/authorized_keys` of the server user)
- variables `DEPLOY_HOST`, `DEPLOY_USER`, and optionally `DEPLOY_PATH` (default `/opt/alcoholbargame`) and `DEPLOY_PORT` (default `22`)

One-time server setup: install Docker with the compose plugin, create the deploy folder and put a `.env` in it (copy `.env.example`; `POSTGRES_PASSWORD` and `TELEGRAM_BOT_TOKEN` are required). The job then uploads `compose.yaml`, logs the server in to GHCR with the workflow token, pulls the exact image built for that commit (`master-<sha>`), starts it with `docker compose up -d`, waits for `/api/health` and fails with the container logs if the app does not come up.

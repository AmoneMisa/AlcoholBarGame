# Seventeen game-inspired bar and costume pairs

Woody's raised left hand was corrected with the built-in imagegen editor: the thumb rests on the notepad cover, four fingers grip behind its edge, and the wrist connects naturally to the forearm. The face, hairstyle, outfit and other arm are retained. The correction manifest records the exact edit prompt, input and replaced generation. The game uses `leo-themed-atlas-v8.webp`, cell 5. [Corrected hand preview](woody-hand-corrected-preview.webp). The nine asset and avatar tests pass after replacement.

This expansion adds 17 independently generated painted bar backgrounds and 34 single-pose costumes, one for Noa and one for Leo for each theme. These are new entries, preserving the earlier Citadel lounge and all existing wardrobe IDs.

| Game | Noa | Leo |
| --- | --- | --- |
| Witcher 3 | Ciri | Geralt |
| Heroes of Might and Magic III | Catherine Ironfist | Gelu |
| Elden Ring | Ranni | Blaidd |
| Minecraft | Alex | Steve |
| Skyrim | Dragonborn shieldmaiden | Dragonborn warrior |
| Cyberpunk 2077 | V • female | V • male |
| Counter-Strike 2 | Agent Ava | Counter-terrorist operator |
| Assassin’s Creed | Evie Frye | Ezio Auditore |
| Watch Dogs | Sitara | Aiden Pearce |
| Sleeping Dogs | Hong Kong detective | Wei Shen |
| Detroit: Become Human | Kara | Connor |
| Neighbours from Hell | Prankster hostess | Woody |
| Grand Theft Auto | Vice City hostess | Tommy Vercetti |
| Stellar Blade | EVE | Adam |
| R.E.P.O. | Salvage robot • female | Salvage robot • male |
| Among Us | Crewmate • red | Crewmate • cyan |
| Borderlands | Lilith | Mordecai |

Sleeping Dogs uses a Hong Kong detective adaptation for Noa; Neighbours from Hell uses a prank-show hostess adaptation; GTA uses a Vice City hostess paired with Tommy Vercetti. Both Skyrim costumes are Dragonborn interpretations. R.E.P.O. and Among Us use recognizable full robot/astronaut costume helmets. Human costumes retain the established bartender facial identity with costume-specific hair, makeup and accessories. Signature fantasy character wigs are used where recognizable, otherwise hair remains naturally colored.

Every costume uses one pose, selected to suit its outfit. The expansion appends frames to themed atlases v7–v9 for each bartender. The final v9 atlas contains five costumes; the unused cell stays transparent. Figures are resized with aspect-preserving containment, never horizontal stretching. All 17 backgrounds have matching outfit recommendations for both bartenders and theme-appropriate automatic shelf finishes. Primary Noa styles come with their background; matching Leo styles use the established boxes and style crafting system.

The built-in image_gen tool generates all 51 illustrations. [Exact prompts and face/composition references](../scripts/game-theme-expansion.json), [generated source image paths](../scripts/game-theme-expansion-results.json), and [selected generation corrections](../scripts/game-theme-expansion-corrections.json) are recorded. Runtime files are saved in `public/assets/bar/backgrounds/interior-<theme>.webp`, `public/assets/characters/bartender/noa-themed-atlas-v7.webp` through `v9.webp`, and the corresponding Leo atlases. [The combined delivery catalog](themed-bar-delivery.json) records installed files and cells.

The face references are reproducible 215 × 230 pixel crops at left 55, top 0 of each committed `noa-natural-atlas-v2.webp` / `leo-natural-atlas-v2.webp`. The crop provides identity without imposing the original full-body stance. Geralt's selected revision uses the complete Leo natural atlas as a facial/style reference; its exact final prompt is recorded in the correction manifest and combined generation catalog.

Previews: [all 17 matching scenes](game-theme-expansion-preview.webp), [Noa's new looks](noa-game-theme-expansion-preview.webp), [Leo's new looks](leo-game-theme-expansion-preview.webp), [compact overview](game-theme-expansion-overview.webp).

Reference research: [The Witcher 3](https://www.thewitcher.com/gr/en/witcher3), [Heroes III official manual](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/297000/manuals/Heroes_of_Might_and_Magic_III_HDEdition_OnlineManual_EN.pdf?t=1699009789), [Minecraft character skins](https://www.minecraft.net/en-us/article/what-is-minecraft-skin), [Elden Ring](https://www.bandainamcoent.com/games/elden-ring), [Stellar Blade characters](https://www.playstation.com/en-us/games/stellar-blade/), [Detroit character imagery](https://www.quanticdream.com/en/media-view-all/detroit-become-human-screenshots-b0ec77ac34ef6), [Ezio](https://www.ubisoft.com/en-ca/game/assassins-creed/the-ezio-collection), [R.E.P.O.](https://store.steampowered.com/app/3241660/REPO/).

Validation: 51/51 expansion illustrations are installed as 17 unique backgrounds and six additional transparent costume atlases containing 34 outfits. All 17 matching scene previews and costume cutouts were visually inspected. The complete catalog now has 50 unique backgrounds, 104 Noa costumes and 98 Leo costumes. The 23 targeted asset, matching-style and ownership tests pass. Type checking and client/server production builds pass. Full suite: 220/221 tests pass; the existing CharacterStudio raw form-control test remains the sole unrelated failure. New bar prices stay between 2,800 and 3,440 crystals, within the established ceiling.


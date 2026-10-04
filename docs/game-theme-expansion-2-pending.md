# Second game expansion — installed, one costume pending

Generated and connected **24 unique bar backgrounds and 51 single-pose costumes** on master on 3 October 2026 using the built-in image_gen tool. The only missing costume is **Leo as Batman**: four attempts were rejected by the image service with HTTP 400 `moderation_blocked`. Gotham is live with Noa's Catwoman and Leo's existing Max Payne dark-coat recommendation. No Batman image or empty atlas cell is advertised as a completed costume. [Status record](../scripts/game-theme-expansion-2-status.json).

The requested scope is **24 backgrounds and 52 costumes**. Installed: 26 new costumes for Noa and 25 for Leo, with all six Resident Evil looks included. The live catalog now has **74 backgrounds, 130 Noa costumes and 123 Leo costumes**. The themed subset contains **54 backgrounds and 157 costumes**, packed into 27 shared atlases. Existing Citadel, car-hood and Woody-hand corrections are retained.

| Game | Noa | Leo |
| --- | --- | --- |
| Harry Potter | Hermione • adult wizard | Harry • adult wizard |
| GTA V | Amanda De Santa | Franklin Clinton |
| GTA San Andreas | Catalina | Carl Johnson • CJ |
| GTA III | Asuka Kasen | Claude |
| Control | Jesse Faden | Zachariah Trench |
| Alan Wake | Saga Anderson | Alan Wake |
| Quantum Break | Beth Wilder | Jack Joyce |
| Max Payne | Mona Sax | Max Payne |
| Resident Evil | Jill Valentine • classic | Leon Kennedy • RE4 |
| Silent Hill | Heather Mason • adult cosplay | James Sunderland |
| Batman | Catwoman | Batman |
| Baldur’s Gate 3 | Shadowheart | Astarion |
| Divinity: Original Sin II | Lohse | Ifan ben-Mezd |
| Diablo IV | Sorceress | Necromancer |
| Black Desert | Dark Knight | Warrior |
| Darksiders III | Fury • Flame Hollow | Vulgrim merchant |
| Death Stranding | Fragile | Sam Porter Bridges |
| Devil May Cry | Lady | Dante |
| Palworld | Pal trainer • female | Pal trainer • male |
| Shadow of the Tomb Raider | Lara Croft | Jonah Maiava |
| The Wolf Among Us | Snow White | Bigby Wolf |
| The Walking Dead: Season 3 | Kate Garcia | Javier Garcia |
| Tropico 6 | El Presidente • female | El Presidente • male |
| Worms | Worm mascot • female | Worm mascot • male |

Resident Evil additionally includes **Claire Redfield and Ada Wong for Noa**, and **Chris Redfield and Albert Wesker for Leo**. All human looks are adult bartender cosplay that preserves Noa/Leo facial identity. Hair, makeup and stance vary by character; masks and mascots are costume adaptations. Hand anatomy and a believable grip are explicit constraints in every costume prompt.

[Exact 76-image prompt queue and references](../scripts/game-theme-expansion-2.json), [75 selected results](../scripts/game-theme-expansion-2-results.json), [Snow's office-outfit correction](../scripts/game-theme-expansion-2-corrections.json), and [live catalog data](../src/data/cosmetics/gameThemeExpansion2.ts) are saved. Prices are distinct and within the established 3,500-crystal ceiling. Every installed sprite preserves alpha and aspect ratio. Costume images are packed six per atlas with one pose per costume.

To resume the one missing job, generate `theme-batman-leo` with the built-in image_gen tool and a transparent background. Inspect its face, hands and alpha. Append the selected result to this batch, append the corresponding costume entry **at the end of NEXT_GAME_COSTUMES.leo**, and restore Gotham's Leo recommendation to `theme-batman-leo`. Appending preserves every currently installed atlas cell. Do not apply the historical activation patch again; the catalog is already active.

After the missing job succeeds, run `scripts/merge-game-theme-expansion.mjs --second --finalize`, followed by `scripts/install-themed-bar-assets.mjs`. The merge appends only generated jobs; Batman will occupy Leo atlas v14 cell 0. Refresh galleries with `scripts/preview-game-theme-expansion.mjs --second` and `scripts/preview-themed-bars.mjs`. Restore the Leo totals in the existing avatar/themed tests to 124 costumes, 79 themed costumes and 14 atlases.

Validate asset paths, alpha cutouts, distinct background hashes, per-bartender exclusivity and matching recommendations, then run type checking and production builds. [All new costumes and complete pairs](game-theme-expansion-2-preview.webp), [Noa wardrobe](noa-game-theme-expansion-2-preview.webp), [Leo wardrobe](leo-game-theme-expansion-2-preview.webp), and [all installed themed bars including Gotham's fallback](themed-bars-preview.webp) are available for review.

The 24 new bars have distinct original procedural music presets. Optimized background thumbnails, mobile backgrounds and 128/512-pixel costume frames are connected through the existing asset catalog. These are resized copies of the same single pose.

Validation on 4 October 2026: all 24 artwork/music/performance tests passed, along with type checking, client build and server build. The full shared-workspace suite had 336 passing tests and one failing daily-lesson choices assertion in `tests/economy.test.mjs`, outside this artwork change.

The skill permits a CLI/API alternative requiring a configured `OPENAI_API_KEY` only when the user explicitly requests that fallback. No fallback was used and no recurring automation was created.

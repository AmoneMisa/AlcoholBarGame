# Next game expansion — prepared, awaiting image quota

No images from this batch have been generated or installed. The built-in image_gen tool returned HTTP 429 `usage_limit_reached`; its reported reset is **3 October 2026, 11:17:13 Europe/Moscow** (08:17:13 UTC). [Status record](../scripts/game-theme-expansion-2-status.json).

The prepared scope is **24 unique bar backgrounds and 52 single-pose costumes**, 26 per bartender. Resident Evil has six character looks; every other theme has one matching costume for each bartender. The existing live game remains at 50 backgrounds, 104 Noa costumes and 98 Leo costumes, including the corrected Woody hand.

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

[Exact 76-image prompt queue and references](../scripts/game-theme-expansion-2.json), [results](../scripts/game-theme-expansion-2-results.json), [corrections](../scripts/game-theme-expansion-2-corrections.json), and [prepared catalog data](../src/data/cosmetics/gameThemeExpansion2.ts) are saved. The prepared data module is deliberately not imported by the live catalog until artwork exists. Prices are distinct and within the established 3,500-crystal ceiling.

To resume, use the built-in image_gen tool once per missing job with its saved prompt/reference and `transparent_background` true for costumes. Skip completed keys recorded in the results file. Stop immediately if the same usage-limit error returns; do not repeatedly submit remaining jobs to a depleted quota. Inspect hands, facial proportions, hairstyles, full framing and transparency; record chosen corrections with their exact prompt and replacement provenance.

Only after all 76 image jobs are complete: merge this queue with `scripts/merge-game-theme-expansion.mjs --second --finalize`, install using `scripts/install-themed-bar-assets.mjs`, and apply [the prepared catalog activation patch](../scripts/activate-game-theme-expansion-2.patch). Refresh this batch's galleries with `scripts/preview-game-theme-expansion.mjs --second` and the complete collection with `scripts/preview-themed-bars.mjs`. The existing installer preserves old atlas cells: the first new look fills cell 5 in themed atlas v9, followed by v10–v14 for each bartender. Resident Evil's additional variants append at the end of this batch.

After activation, expected catalog totals are 74 backgrounds, 130 Noa costumes and 124 Leo costumes. The themed subset is 54 backgrounds and 158 outfits, using 28 shared transparent atlases. Validate all asset paths, alpha cutouts, distinct background hashes, per-bartender exclusivity and matching recommendations, then run type checking and production builds. The current unrelated CharacterStudio raw form-control failure should be reported separately if it remains.

The skill permits a CLI/API alternative requiring a configured `OPENAI_API_KEY` only when the user explicitly requests that fallback. No fallback was used and no recurring automation was created.


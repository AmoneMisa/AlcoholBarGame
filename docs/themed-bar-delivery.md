# Themed bars and bartender wardrobe

Thirteen individually generated 2D painted bar scenes, with seventy-two new costumes: thirty-six for Noa and thirty-six for Leo. Every original and new background offers matching outfit recommendations for both bartenders. The underwater scene uses the existing male and female shark costumes.

Each costume has one pose. Human looks retain the bartender's identity; named fantasy and alien looks include character-specific wigs, makeup and prosthetics. Costumes are packed into twelve transparent WebP atlases, six per bartender, with at most six outfits per atlas. The installer fits each figure without changing its proportions.

| Bar | Matching costumes |
| --- | --- |
| Underwater | Shark costumes for Noa and Leo |
| Underground | Cave keeper for both |
| Fairy grove | Woodland fairy host for both |
| Fairytale castle | Royal storybook host for both |
| Lineage II | Human, Elf, Dark Elf, Orc, Dwarf, Kamael, Ertheia; both sexes, plus a Dark Elf mage pair |
| Perfect World | Human, Winged Elf, Untamed, Tideborn, Earthguard, Nightshade; both sexes |
| Warcraft III | Noa: Sylvanas, Maiev, Jaina, Tyrande. Leo: Illidan, Malfurion, Arthas, Thrall |
| Allods Online | Kanian, Elf, Gibberling, Xadaganian, Orc, Arisen, Priden, Aoidos; both sexes |
| Lost Ark | Noa: Bard in a bikini. Leo: Berserker in jeans and a black T-shirt |
| Mass Effect | Shepard for both; Leo: Garrus and Thane. Noa: Miranda and Liara |
| NFS Most Wanted | Mia-inspired and Razor-inspired street-racing outfits |
| NFS Carbon | Nikki-inspired and Darius-inspired racing outfits |
| NFS Underground | Samantha-inspired and Eddie-inspired tuner outfits |

The race sets follow the user's confirmed PC-game selection. Ertheia's male outfit is an adaptation for Leo. Race collections use human bartender faces with themed clothing and accessories. The sixteen named Warcraft, Lost Ark and Mass Effect costumes have been [revised with recognizable character details and individual poses](iconic-costume-delivery.md), including alien costume masks and makeup.

The Mass Effect lounge was revised to show the Citadel through its panoramic windows, removing the planetary horizon while preserving the bar interior.
The Most Wanted scene was corrected to remove the erroneous wing from the car's front hood; the coupe and garage bar remain in place.

Race research: [Lineage II Ertheia classes](https://www.lineage2.com/en-us/news/autumn-red-libra), [Perfect World race list](https://forum.arcgames.com/pwi/discussion/1208435/new-expansion-flyers-and-mounts), [Allods races](https://allods.my.games/en/game), [Aoidos](https://allods.my.games/forum/index.php?page=Thread&postID=102634).

The built-in `image_gen` tool produced every illustration. Exact prompts, identity and composition references, and the requested race sets are saved in [the generation manifest](../scripts/themed-bar-generations.json). [Generation results](../scripts/themed-bar-results.json) record the source PNG paths. [The delivery catalog](themed-bar-delivery.json) identifies the installed assets and atlas cells.

Runtime backgrounds: `public/assets/bar/backgrounds/interior-*.webp`. Runtime costumes: `public/assets/characters/bartender/noa-themed-atlas-v*.webp` and `leo-themed-atlas-v*.webp`.

Each new background brings its primary costume through the existing background purchase system; additional looks use the existing style boxes and style-shard crafting. Recommendations preserve those ownership rules and explain locked outfits through the existing wardrobe panel.

Previews: [Backgrounds](themed-backgrounds-preview.webp), [matching bartender pairs](themed-bars-preview.webp), [Noa's complete set](noa-themed-costumes-preview.webp), [Leo's complete set](leo-themed-costumes-preview.webp).

Validation: all 85 final generations installed as 13 backgrounds and 12 costume atlases containing 72 outfits. Transparency and proportions checked during packing and on the complete preview sheets. All 33 backgrounds have different file hashes. Type checking and client/server production builds pass. The full suite passes 220 of 221 tests; the remaining existing failure flags raw form controls in the unused CharacterStudio component.

The additional [Dark Elf mage pair](lineage-mage-pair-preview.webp) fills the last empty cell in each sixth themed atlas, adding two costumes without adding more runtime image files.

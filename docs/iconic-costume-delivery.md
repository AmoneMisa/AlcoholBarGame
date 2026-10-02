# Named-character costume revision

Replaces sixteen existing wardrobe cells with recognizable character costumes. Each outfit has one pose. No extra runtime image files or wardrobe IDs are introduced.

| Collection | Female costumes | Male costumes |
| --- | --- | --- |
| Warcraft | Sylvanas, Maiev, Jaina, Tyrande | Illidan, Malfurion, Arthas, Thrall |
| Lost Ark | Adult Bard in a two-piece bikini with a harp | Berserker in blue jeans and a plain black T-shirt |
| Mass Effect | Female Shepard, Miranda, Liara | Male Shepard, Garrus, Thane |

The costumes use character-specific hair, makeup, headpieces, armor and poses. Human faces retain the bartender's identity. Fantasy and alien appearances use costume makeup and prosthetics: Garrus has turian cranial plates and mandibles, Thane has a hairless Drell appearance, and Liara has blue asari makeup and a head crest. Signature character colors are allowed for these named costumes.

The male poses include Illidan's crossed arms, Malfurion's open palm with a branch, Arthas's hands on his sword hilt, Thrall's tankard and welcome gesture, Berserker's hands at his jeans pockets, Shepard's omni-tool, Garrus's armored wrist gesture, and Thane's steepled fingers. The reference shaker pose is not reused.

Painted figures are packed with uniform contain sizing, preserving their facial and body proportions. The horizontal body-scaling hook has been removed. A live browser inspection confirmed the original bartender frame rendered at its declared aspect ratio with no scaling transform on its parent.

Illustrations were generated and edited with the built-in `image_gen` tool. Exact final prompts and references are in [the revision manifest](../scripts/iconic-costume-revisions.json); [the revision results](../scripts/iconic-costume-revision-results.json) record final PNG paths. The revised images are copied into the existing transparent WebP atlases under `public/assets/characters/bartender`, and [the delivery catalog](themed-bar-delivery.json) records their exact atlas cells. Replaced generation paths remain in the main results for provenance.

Face references are crops of the existing natural bartender atlases, at left 55, top 0, width 215, height 230. They guide adult identity and painted style rather than hairstyle or body pose.

Official cast and class context: [Blizzard's hero roster](https://heroesofthestorm.blizzard.com/en-us/heroes/), [Mass Effect](https://www.ea.com/en-ca/games/mass-effect), [Lost Ark](https://www.playlostark.com/en-us/game/about).

Previews: [all sixteen](iconic-costumes-preview.webp), [female costumes](iconic-noa-costumes-preview.webp), [male costumes](iconic-leo-costumes-preview.webp).

Validation: all sixteen final cutouts passed transparency checks and were installed in the existing atlas cells. The complete male and female previews were inspected. All 23 wardrobe, style-ownership and background tests pass; type checking and both production builds pass. The previously reported unrelated CharacterStudio UI-kit failure remains outside this art revision.

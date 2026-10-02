# Painted bartender artwork

Created with the built-in image_gen tool. Noa and Leo retain their recognizable faces and fair skin. Every everyday hairstyle uses the same original natural hair color: espresso brunette for Noa and chestnut brown for Leo. Everyday outfits reuse one pose per character; each reference costume has one matching pose, which can differ between costumes; the editor offers hairstyles and outfits without hair-color or pose controls. Leo's everyday and first reference-costume atlases use an upright, broad-shouldered working-bartender stance, with a shaker held at his waist and the other hand on his hip.

Twelve everyday appearances are packed into just two transparent WebP atlases. Each atlas has six hairstyle columns and three outfit rows (burgundy vest, ivory jacket or shirt/suspenders, green apron). Each cell is 316 × 552 pixels; each atlas is 1896 × 1656 pixels. No separate files are shipped for individual hairstyles or extra poses.

| Character | Columns from left to right | Runtime asset |
| --- | --- | --- |
| Noa | Curly updo, loose waves, chin-length bob, twin braids, short pixie, high ponytail | public/assets/characters/bartender/noa-natural-atlas-v2.webp |
| Leo | Swept-back hair, buzz cut, textured curls, undercut, pompadour, shoulder-length waves | public/assets/characters/bartender/leo-natural-atlas-v2.webp |

The references come from C:/Users/kubai/Desktop/Samples for modelling. Noa uses do-semi-realistic-character-designw.png and marta-danecka-pau.jpg for braid styling and soft fashion illustration shading. Leo uses 2D-Male-Jacket-Model-Fashion-Illustration.jpg and vera-roche-vfiymgem9to.jpg for sculpted hair and painted male-character styling. These references supply style; the existing bartender sheets supply the faces.

Four special-outfit WebP sheets, {noa,leo}-special-{a,b}-v1.webp, retain only one pose per outfit, packed as one column and three rows. Special outfits retain their own hair. Original cosmetic ownership rules and legacy saved values remain valid. Unsupported saved hairstyles fall back to the character's default appearance.

The bartender runtime directory contains twenty-three WebP files total, including the seventeen costume atlases below. Superseded wardrobe sheets, color variants, extra pose columns and duplicate PNG files have been removed from that directory. Final prompts and source paths are recorded in [painted-avatar-assets.json](../scripts/painted-avatar-assets.json); delivered dimensions and layout are recorded in [painted-avatar-delivery.json](painted-avatar-delivery.json). Generated source images remain in Codex's generated-image folder and are excluded from the game package.

## Modelling-folder costumes

Ninety-four reference costumes are available in the clothes picker: fifty for Noa and forty-four for Leo. All retain the existing face and a single pose; the later batches coordinate natural hair colors and makeup with each outfit. Bright clothing colors follow the references; pink, blue and green hair are excluded. The costume's hairstyle is fixed to avoid multiplying images for hairstyle/wardrobe combinations.

Costumes use nine Noa and eight Leo 948 × 1104 WebP atlases with three columns and two rows: `public/assets/characters/bartender/noa-costumes-atlas-v1.webp` and `public/assets/characters/bartender/leo-costumes-atlas-v1.webp`. Each cell is 316 × 552 pixels. The costumes are immediately selectable and their saved outfit IDs use the same validation as the existing wardrobe. They are restricted to the corresponding bartender.

Costume figures are isolated with image_gen before packing, preventing neighboring sleeves, lace and partial heads from appearing in another outfit's frame. Only the seventeen packed costume WebP sheets ship in the game; cutout generation sources and their prompts are recorded for reproducibility.

The table follows atlas reading order. Reference filenames are relative to the desktop Samples for modelling folder.

| Bartender | Costume | Reference |
| --- | --- | --- |
| Noa | Rose kimono | -01.jpg |
| Noa | Burgundy gothic dress | 992d063265dcdc6d1f6756eea8140984.jpg |
| Noa | Pink jacket & jeans | girl-fashionista-beauty-2d-illustration-260nw-2505779361.webp |
| Noa | Black leather biker | images (25).jpg |
| Noa | Gold-trimmed qipao | qipao-mercy-concept-by-me-v0-uwjbmf28z6a61.webp |
| Noa | Desert ceremonial gown | urnaxEMkK3faZV84eua8Mc.jpg |
| Leo | Navy tailored suit | 2D-Male-Jacket-Model-Fashion-Illustration.jpg |
| Leo | Tropical evening jacket | gta-6-covers-made-in-midjourney-v0-uw6raq23wz3b1.webp |
| Leo | Pirate captain | images (21).jpg |
| Leo | Historical doublet | images (40).jpg |
| Leo | Blue casual jacket | male-casual-game-character-raphael-lacoste-style-illustration-mercenary-paul-t-featuring-realistic-color-palette-306128163.webp |
| Leo | Fur-trimmed adventurer | model-2d-game-character-2d-game-character-design.png |

[Costume preview over current backgrounds](bartender-costumes-preview.webp)

All 20 backgrounds in public/assets/bar/backgrounds/ use the sample-inspired painted 2D finish. Room themes, scenery and counter placement are preserved.

The earlier cleanup removed 352 obsolete studio image/model files and disabled the 3D renderer and ?studio route. Ancillary studio code and records remain outside the active game build.

Rendering sizes each bartender sprite from its actual frame aspect ratio and height, then centers it within its container. Container width never stretches the sprite horizontally. The same rule applies in the bar scene and costume editor.

## Costume expansion with matching poses

The second batch adds another twelve costumes in {noa,leo}-costumes-atlas-v2.webp, again three columns and two rows, one figure per outfit. The poses match each costume and remain a single saved visual per outfit.

| Noa costume | Pose | Leo costume | Pose |
| --- | --- | --- | --- |
| Sakura ceremonial outfit | Hand at sash, other lifting outer sleeve | Teal duelist coat | Hand at belt, other arm behind back |
| Ice-blue evening gown | Hand at pendant, other at waist | Black & gold tailcoat | Rocks glass near chest |
| Violet evening dress | Champagne coupe and hand on hip | Black samurai layers | Arms folded |
| Purple archer suit | Adjusting opposite glove | Leather explorer outfit | Thumb at belt and folded bar towel |
| Ivory desert traveler | Arms gently folded low | Ice court coat | Adjusting cloak clasp |
| Golden paladin armor | Hand on hip, other relaxed | Midnight black-tie suit | Martini glass and jacket lapel |

Each figure is generated separately from the existing face plus an actual clothing reference, then packed without stretching. Exact reference filenames and per-costume prompts are included in the source and delivery JSON records.

[New costume preview](bartender-costumes-expansion-preview.webp)

## Costumes with coordinated hair and makeup

The third batch adds twelve costumes in {noa,leo}-costumes-atlas-v3.webp. Natural blonde, copper, auburn, brown and black hair suit each costume; face identity and fair skin stay consistent. Makeup changes are included in each outfit. Each outfit remains one pose in one atlas cell, with no hairstyle/color/pose permutations.

| Bartender | Costume | Hair | Makeup / grooming | Pose | Reference |
| --- | --- | --- | --- | --- | --- |
| noa | City trench coat | honey blonde shoulder-length soft waves | peach blush, soft nude lipstick | one hand at coat lapel, other at hip | marta-danecka-pau.jpg |
| noa | Black & gold royal gown | jet black braided crown updo | burgundy lipstick and subtle gold eyeshadow | hands gently folded at waist | ea808fd416233792562f9b7dca8a68c1.jpg |
| noa | Crimson flame gown | natural copper long side braid | warm bronze eyeshadow and muted red lips | holding champagne coupe near waist, other hand touching necklace | images (39).jpg |
| noa | Teal sorceress robes | dark brunette long flowing waves | subtle teal eyeliner and rose nude lips | one palm open near waist, other holding robe sash | 1648618262_25-abrakadabra-fun-p-mag-lda-art-43.jpg |
| noa | Gold-trimmed captain | chestnut high ponytail beneath hat | soft smoky eyes and berry lips | confident hand on hip, other holding small folded bar towel | 2d-fan-art-league-of-legends-wallpaper-preview.jpg |
| noa | Cobalt silver armor | natural ash blonde chin-length bob | restrained taupe eyeshadow and natural pink lips | one hand resting on belt, other adjusting opposite glove | images (27).jpg |
| leo | Blue techwear jacket | black undercut with swept-back top | clean natural face, groomed matching beard | upright working bartender holding shaker at waist, other hand on hip | images (26).jpg |
| leo | Blue & gold court coat | natural dark golden blonde swept waves | natural groomed face and matching short beard | holding coupe at waist, other hand on coat lapel | c0afbe5122acb3f99162ce5e5ade50b1.jpg |
| leo | Dark ranger armor | chestnut shoulder-length waves tied half back | natural face and matching neatly trimmed beard | one hand on belt, other holding folded bar towel | e223a46341ac5fc0655c6b9e6b844272.jpg |
| leo | Emerald obsidian armor | jet black slicked-back hair | very subtle charcoal eye shading, matching short beard | upright confident arms folded low across chest | lord-of-decay-posed-male.jpg |
| leo | Copper-trimmed admiral | natural auburn hair tied back in small low tail | natural face, neat matching short beard | one hand at coat fastening, other holding rocks glass near waist | loving-all-the-armor-and-clothing-you-can-find-in-the-game-v0-mc3c5dtsb20e1.webp |
| leo | Rugged denim bartender | dark brown short textured crop | natural face and matching short beard | holding shaker near waist with one hand, other thumb hooked at belt | realistic-male-character-model-d-game-art-bearded-man-hat-jeans-showcasing-anime-inspired-design-303677058.webp |

[Third costume batch preview](bartender-costumes-batch-3-preview.webp)

## Fourth wardrobe batch

Twelve additional modelling-folder costumes are packed in public/assets/characters/bartender/{noa,leo}-costumes-atlas-v4.webp. Each sheet is 948 × 1104, three columns and two rows. Each costume has one transparent figure, one matching pose and coordinated natural hair and makeup. Faces remain sourced from the existing bartender art. Created with the built-in image_gen tool; exact prompts and references are recorded in the source and delivery JSON.

| Bartender | Costume | Hair | Makeup / grooming | Pose | Reference |
| --- | --- | --- | --- | --- | --- |
| noa | Lavender couture | natural ash blonde elegant low braided bun | soft lavender eyeshadow and rose lips | one hand on waist, other gently lifting one skirt fold | 0ee35d49d496f579dead5f0553bcc8a0.jpg |
| noa | Emerald velvet witch | jet black long straight hair with soft curtain fringe | muted forest-green smoky eye and plum lips | holding a small cocktail coupe near waist, other hand at pendant | images (4).jpg |
| noa | Violet & gold mage | natural chestnut twin braids pinned together at back | gold eyelid shimmer and muted berry lips | adjusting embroidered sleeve cuff | images (15).jpg |
| noa | Scarlet duelist | natural copper short textured pixie | subtle black winged liner and warm nude lips | confident hand on hip, other hand holding bar towel | images (35).jpg |
| noa | Midnight hooded jacket | natural dark brown sleek high ponytail | fine charcoal eyeliner and natural rose lips | holding shaker at waist, other hand in jacket pocket | 07yMo2X_TH2Y8fG1hmAY_A.webp |
| noa | Turquoise evening skirt | natural warm brown shoulder-length smooth waves | peach blush, soft bronze shadow and nude lips | holding champagne coupe, other hand on waist | 6_a545a34d-1464-4ea4-a8dd-2d14c3093e2c_1024x1024.webp |
| leo | Graphite utility layers | natural black short textured curls | natural groomed face and matching short beard | upright holding shaker at waist, other hand at utility belt | 753cef523112fbcea1fd6522bcaa5dc9.jpg |
| leo | Plum-lined long coat | natural dark auburn shoulder-length waves tucked behind ears | natural face with subtle taupe eye shading and matching short beard | holding rocks glass at waist, other hand touching lapel | 18334ed1bd1107b23a8254d88e7ab65b.jpg |
| leo | Frost scholar robes | natural sandy blonde swept-back medium waves | natural face and matching short beard | one hand at mantle clasp, other holding folded white bar towel | 1648618231_26-abrakadabra-fun-p-mag-lda-art-45.jpg |
| leo | Burgundy vampire coat | natural jet black sleek side part | restrained charcoal eye shading and matching short beard | one hand on waist, other holding red cocktail in stemmed glass | vera-roche-vfiymgem9to.jpg |
| leo | Urban bomber jacket | natural dark brown cropped buzz cut | natural groomed face and matching short beard | one thumb at belt, other holding shaker beside waist | images (24).jpg |
| leo | Ivory resort suit | natural honey blonde soft side-swept hair | natural face and matching short beard | relaxed upright holding tropical cocktail at waist, other hand in trouser pocket | images (38).jpg |

[Fourth costume batch preview](bartender-costumes-batch-4-preview.webp)


## Remaining reference completion

This final wardrobe run uses all remaining 46 clothing references: 26 Noa and 20 Leo outfits. Each reference yields one figure and one pose. Partial final atlases retain empty cells, avoiding extra duplicate art. Source files are removed from the desktop folder only after the generated assets are installed and verified. Deletion paths and SHA256 checksums are recorded in removed-modelling-references.json. Unused portraits, editor screenshots and other materials remain in the reference folder.

| Bartender | Costume | Reference |
| --- | --- | --- |
| noa | Glacier enchantress | 1648618243_27-abrakadabra-fun-p-mag-lda-art-46.jpg |
| noa | Midnight cabaret | 1r05hcroc3jf1.jpg |
| noa | Violet stealth jacket | 2e46e43ef6bf90b196eef237799368b6.jpg |
| noa | Ocean gold robes | 3f7259fee92152e7e4ee6e29ff884a12.jpg |
| noa | Frost princess | 7998078d651714f5efdefcbbb2de5df1.jpg |
| noa | Ivory cabaret | 7b2dd1bdc24261f1637652d47edb19b6.jpg |
| noa | Aurora evening gown | agnieszka-firla-aurora-full-body.jpg |
| noa | Amethyst velvet gown | bfc8e7cc4b03ad486d117cdfe74a1dcd.jpg |
| noa | Black leather catsuit | catwoman.jpg |
| noa | Crimson urban layers | for-hire-2d-character-artist-semi-realism-character-design-v0-l5sb49w9nw5h1.webp |
| noa | Ivory adventurer | if-warframe-universe-was-a-bit-more-like-greek-myths-v0-is2dcv1ztr5d1.webp |
| noa | Elven forest gown | il_300x300.8499280608_fq9n.webp |
| noa | Plum hooded robes | images (14).jpg |
| noa | Ruby embroidered qipao | images (17).jpg |
| noa | Scarlet royal gown | images (18).jpg |
| noa | Violet neon rider | images (23).jpg |
| noa | Pearl draped gown | images (29).jpg |
| noa | Raven evening robes | images (30).jpg |
| noa | Sapphire feather gown | images (31).jpg |
| noa | Forest alchemist | images (32).jpg |
| noa | Turquoise oracle | images (34).jpg |
| noa | Victorian satin ensemble | images (7).jpg |
| noa | Silver glacier armor | images (8).jpg |
| noa | Gothic lace blouse | widen_920x0.jpeg |
| noa | Midnight star gown | 微信图片_20210818142308.jpg |
| leo | Shadow cloak | 0d2825c6b3924d45a8522d64e847a69d.webp |
| leo | Crimson utility jacket | 178367804440_1200.jpg |
| leo | Slate hooded jacket | 795952ef2a41be473b02e6ec54167b89.jpg |
| leo | Ivory linen shirt | 9d91bcca1e44540107e9b9b265dc2337.jpg |
| leo | Cream teal waistcoat | c6b9faf7fd251a9939b89537666b3542.jpg |
| leo | Midnight future suit | ca8d65a808f4a20b4f7a084b12e7ca5a.jpg |
| leo | Silver sentinel armor | futuristic-d-render-showcasing-minimalist-white-superhero-character-sleek-armor-dynamic-pose-futuristic-d-render-363421359.webp |
| leo | Coral island shirt | hawaii-illustration-retro-comic-style_23-2151771022.avif |
| leo | Nocturne velvet coat | HHtZv0bXkAUrC5w.webp |
| leo | Turquoise summer shirt | images (11).jpg |
| leo | Maritime captain | images (12).jpg |
| leo | Silver gothic suit | images (16).jpg |
| leo | Crimson gold armor | images (20).jpg |
| leo | Roadhouse leather | images (22).jpg |
| leo | Onyx armored cloak | images (28).jpg |
| leo | Ruby teal court robes | images (36).jpg |
| leo | Winter knight armor | images (37).jpg |
| leo | Charcoal casual hoodie | images (41).jpg |
| leo | Graphite formal suit | images (42).jpg |
| leo | Rose street jacket | pngtree-anthropomorphic-pigeon-cartoon-character-in-modern-street-clothes-png-image_19071147.webp |

| noa | Violet ranger layers | card-1.png |

Preview sheets: [5](bartender-costumes-batch-5-preview.webp), [6](bartender-costumes-batch-6-preview.webp), [7](bartender-costumes-batch-7-preview.webp), [8](bartender-costumes-batch-8-preview.webp), [9](bartender-costumes-batch-9-preview.webp).





Completion: all 46 remaining clothing references have generated, installed costumes. 95 used references were removed from the desktop folder; 22 unused portrait/editor/other materials remain. Full tests: 191 passed. Client and server production builds passed. The reference queue has zero pending costumes. Cleanup paths and hashes are in removed-modelling-references.json; retained filenames are in modelling-reference-review.json.

## Shark costumes for both bartenders

Two original shark outfits bring the wardrobe total to 96: 51 for Noa and 45 for Leo. The existing 94 modelling-folder costumes are retained. Each new outfit has a blue-gray shark onesie, white belly panel, fin details and a shark hood framing the recognizable human face. Noa holds a blue cocktail coupe; Leo holds a shaker. Each costume has one pose and natural hair.

The shark cutouts occupy the third cell in the first row of public/assets/characters/bartender/noa-costumes-atlas-v9.webp and public/assets/characters/bartender/leo-costumes-atlas-v8.webp. Existing figures stay in their previous cells; no additional runtime sheets are needed. Saved outfit IDs are reference-shark-noa and reference-shark-leo.

Created with the built-in image_gen tool using each character's existing face atlas as the identity reference. Exact final prompts and source paths are in scripts/painted-avatar-assets.json and docs/painted-avatar-delivery.json.

[Both shark costumes over current backgrounds](shark-costumes-preview.webp)

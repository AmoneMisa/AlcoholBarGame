# Blender bartender integration

Both bartenders are real-time 3D in the bar and in Design: Noa (`amber.glb`) and Leo (`leo.glb`). Special outfits (`special-*`) keep their illustrated artwork. If WebGL or a model fails to load, the illustrated character is shown instead.

## Source models (Desktop `Models` folder, read only)

- **Noa**: `Female_Leather_Suit.Fbx` is the low-poly base (body, hair, leather jacket + skirt split at the waist so each can be mixed with the tee or jeans, strap boots). `Amber.Fbx` adds jeans, cropped tee, jacket, boots and brows, refitted onto the base body. `SKM_Hair.fbx` + `Textures/T_Hair_*.tga` add a long hairstyle.
- **Leo**: `Hassan+V1.blend` (body, plaid shirt, jeans, biker jeans, boots, blowback hair, brows, four 3D beard meshes). Only the metre-scale copies are used; the centimetre duplicates lost their textures.

## Editable features

| | Noa | Leo |
|---|---|---|
| Hair | updo, bun, bob, pixie, waves | slick, buzz |
| Facial hair | - | stubble (painted), short beard, full beard, goatee, moustache, soul patch (real meshes) |
| Makeup | lipstick, eyeshadow, eyeliner, blush | - |
| Clothes | cropped tee + jeans, leather jacket, tee & skirt, jacket & jeans, leather set, bunny suit, kimono, baggy tee, streetwear | plaid shirt, biker jeans |
| Face | eyes, nose, cheeks, mouth and colours (Noa's brows are painted on her skin) | eyes, brows, nose, cheeks, mouth and colours |
| Outfit colour | natural, black, white, red, blue, green, plum, sand: recolours the outfit's main garment and keeps its shading | same |

Each bartender has **one fixed body shape** baked into the body and every garment (slim and cute for Noa, lean and muscular for Leo), so there are no body morphs and the models are smaller. The Design screen has three tabs (Bar, Clothes, Character). The preview turns about 40° each way and sways on its own so clothes and hair can be judged. The work apron was removed; older saves that used it show the plain shirt look.

## Budget (mobile)

Both assets stay below 12 MiB and 130k stored vertices, including all wardrobe choices. Textures are at most 2048 (Noa's head skin), 1536 (Leo's head skin) and 1024 elsewhere; eyes, beards, normal and roughness maps use 512. Source normal and roughness maps preserve skin and fabric detail. Hair cards are never decimated (it destroys their alpha edges).

## Rebuild

```powershell
$blender = 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe'
& $blender --background --factory-startup --disable-autoexec --python scripts/export_bartender.py -- --source 'C:\Users\kubai\Desktop\Models' --character female
& $blender --background --factory-startup --disable-autoexec --python scripts/export_bartender.py -- --source 'C:\Users\kubai\Desktop\Models' --character male
```

Outputs: the GLBs, plus editable `.blend` projects and a build report under the git-ignored `assets-src/`. Noa's arms are relaxed by a skin-weight-driven rotation; Leo's are posed through his real rig, so his shirt deforms with its own weights. No rig ships in the GLB. Source assets are user supplied and keep their original licences.

Body and eye meshes retain source topology so eyelids and lashes keep their original morph correspondence. Eyeballs stay at their source depth. Leo's neck is shortened by 4.5 cm with the same displacement applied to his head, hair and facial morphs. Lashes export with a dark material, and scalp cards provide the hairline instead of a painted horizontal forehead band. Noa's tee uses selective subdivision, a smoothed collar and extra clearance from skin; the jacket is fitted over the tee.

## Verify

```powershell
pnpm build
pnpm test
```

The asset tests check each GLB's structure, parts, fixed body shapes, neutral expression defaults, face UVs, metre scale, the vertex/file-size budget, and that every editor value is valid for saved profiles. Idle tests cover motion bounds, brief blinks and stopping when paused. Restart the dev API process after changing `src/data/cosmetics/bars.ts`.

For a source-material close-up after rebuilding, run Blender with `--python scripts/render_avatar_preview.py -- female` (or `male`). This writes an image under `docs/screenshots`; it does not exercise the runtime makeup or animation shaders. Idle motion adds breathing, small head turns and blinks; eye presets fade during blinks so they do not prevent eyelids closing. Pausing or reduced-motion preferences disable idle motion.

## Garments from other bodies

The bunny suit comes with the nude body it was sculpted on, so it is warped onto Noa with a smooth displacement field (arms and legs follow their own axes; skin-tight pieces are snapped to her surface). The kimono, baggy tee and streetwear set are stand-alone meshes: they are decimated, given one flat recolourable material each, and pushed outside her body. Known roughness: the upper sleeves of the kimono and baggy tee bunch at the shoulders, and the streetwear set has small gaps at the chest.

## Not usable

`GoldenDressGirl` and `WhiteTechwearGirl` are single fused sculpts (body, hair and clothes in one connected mesh, textures missing), so they cannot be split into garments. `Survival_Character` uses a different rig and body, so its clothes do not fit Leo. `Loose_Biker_Boots` (Hassan) leaves the toes bare.

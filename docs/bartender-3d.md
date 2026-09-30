# Blender bartender integration

Noa uses `public/assets/characters/3d/amber.glb` for the standard outfits, in the bar and in Design. Leo and the special outfits keep their illustrated artwork.

## Source models (Desktop `Models` folder, read only)

- **Female_Leather_Suit.Fbx**: base body, hair parts, eyes, teeth, leather jacket + skirt, strap boots. It is a low-poly version of the same character, so it is the base.
- **Amber.Fbx**: jeans, cropped tee, leather jacket, boots and brows. They are refitted onto the base body (scale, then a push-out pass so nothing sinks into the skin).

## Editable features

- **Face**: eyes (wide / narrow), eyebrows (arch / inner), nose (wide, narrow, turned-up, button, straight), cheeks (high, full, round, hollow), mouth (full, thin, wide, small) are shape keys. Hair parts (updo, bun, bob, pixie) and hair/eye colours are swappable.
- **Makeup and beard**: lipstick, eyeshadow, eyeliner, blush and facial hair are a face-projected shader (surface effect, not a groom).
- **Clothes**: Leather jacket, Cropped tee, Work apron, Leather & skirt (new `biker` outfit).
- **Body**: five presets deform the body and every garment together.
- The apron is generated in Blender by wrapping a grid onto the torso, so it follows the body and the body morphs.

## Budget (mobile)

About 65k vertices in total (body 11k, each garment ~3k, hair cards ~7k each) and about 11 MB, down from about 400k vertices and 15 MB. Textures are at most 2048 (head skin) and 1024 elsewhere; eyes, teeth and tongue use 512.

## Rebuild

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --disable-autoexec --python scripts/export_bartender.py -- --source 'C:\Users\kubai\Desktop\Models'
```

Outputs: `assets-src/characters/imported/bartender.blend`, the GLB and `manifest.json`. The arms are relaxed by a skin-weight-driven rotation at export time, so the GLB has no rig. Source assets are user supplied and keep their original licences.

## Verify

```powershell
pnpm build
pnpm test
```

The asset tests check the GLB structure, embedded textures, required pieces, shared body morphs, face UVs, the vertex/file-size budget and editor-value compatibility with saved profiles. The dev API process must be restarted after changing `src/data/cosmetics/bars.ts`.

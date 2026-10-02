# Atelier character prototype

Run `pnpm dev` and open `http://localhost:5173/?studio`. The existing game remains at `/`.

This is an original vector proof of concept, not a production-quality painted character library. Its purpose is to make the fixed mannequin, compositing contract, independent selections, material recoloring, and restrained animation executable and reviewable before commissioning polished assets. No existing character or outfit artwork was used.

## Canonical geometry

`src/domain/characterStudio/rig.ts` defines two deeply frozen 600 × 1000 orthographic front-view rigs with named facial/clothing/accessory anchors, motion pivots, lighting, and depth order. Woman retains the original `atelier-adult-01` ID, BODY source and baseline fingerprint unchanged. Man uses `atelier-adult-man-01`, separately authored `MAN_BODY` in `manArt.ts`, distinct proportions/anchors and `man-baseline.json`. Coordinates use the top-left origin, positive X right, positive Y down. Every SVG has the entire canvas, without crop or per-asset scaling. Each SHA-256 baseline covers its own body and complete rig contract. Tests and the exporter refuse geometry drift.

Use the Woman / Man selector in the studio. Each keeps independent live selections; Save look stores both and restores the active model after reload. Existing version-1 woman saves remain supported. JSON imports route to the matching known rig and reject unknown revisions or incompatible choices. Reset affects only the selected model. Rendering a layer tagged with the other rig throws an error; neither body is stretched to accept the other's wardrobe. Runtime animation reads each rig's own pivots.

The prototype baseline is **not approval or a production lock**. User review of the mannequin, premium illustration quality, and visual combinations is required before recording production approval. Do not refresh the baseline merely to fit an asset. Fix that asset. Any separately approved body type needs a new rig ID and its own library.

Face shape is deliberately fixed: silhouette-changing face variants conflict with the immutable skull requirement and are not part of this prototype. Future cheek/contour overlays must preserve the canonical silhouette and feature anchors.

## Prototype inventory — per mannequin

- Three eye shapes, with separate sclera, clipped iris/pupil/highlights, outline, and closed-eye geometry.
- Three independent brows, three mouths, two noses, optional blush or freckles.
- Three hairstyles, each with front and back components; woman has cascade/bob/updo, man has swept/cropped/tied. Rosewood, chestnut, and silver presets reuse identical paths within each library.
- Two full outfits including shoes: evening/tailored for woman, formal/casual for man. Primary fabric, secondary fabric, and metal/trim are separate gradient regions. Gradients preserve highlights and shading when recolored.
- Two removable accessories: woman's pearl necklace and moon earrings; man's watch chain and brooch.
- Skin, iris, and lip colors are independent of geometry.

`pnpm character:export` writes 26 self-contained transparent SVG layers **per mannequin** under `public/assets/Character/Woman/` and `public/assets/Character/Man/` (52 total), along with separate manifests, previews, hair palettes, nine-combination review sheets and animation manifests. `catalog.json` indexes the two libraries. The old root-level woman exports remain as legacy artifacts; new consumers should use the catalog. Source paths are canonical; generated SVGs are exports. Each layer contains its own required definitions, so it can be loaded as a separate texture. The studio can export individual layers with the currently selected palette, a transparent composition, and JSON look/rig files. Composition export is a convenience, not the library source.

## Animation

The studio applies a seamless six-second shared 0.2% vertical breathing deformation anchored at the feet, preserving attachment between body and face/clothing layers. This intentionally uses less motion than the suggested 1–3% to avoid exaggerated movement. Rear hair rotates by ±0.12°, fabric overlays expand 0.1%, and jewelry rotates ±0.15°. Rest geometry stays unchanged. Blink timing varies between 2.8 and 6.7 seconds; closure lasts 150 ms. Gaze uses clipped iris translation; half/closed eye previews are selectable. Pausing returns to rest. Reduced motion defaults to still mode and disables animation in CSS. Exported SVGs are static; runtime animation lives in the Vue component, not in exported textures.

## Validation and remaining art gate

`pnpm character:test` enumerates 2,916 combinations per mannequin (5,832 total) and checks unchanged bodies, rig ownership, depth order, unique SVG IDs, valid references, material independence, incompatible imports, cross-rig export rejection and save round trips. This is structural coverage, **not a claim that all combinations are visually free of clipping**. `pnpm build` checks TypeScript and bundles both client and server.

Before production lock, inspect at native canvas resolution and mobile display sizes: all three hair silhouettes with both outfits and both accessories, each face component, dark/light palettes, blink/gaze states, and the entire idle cycle. Specifically inspect the neck, hairline, ears, shoulders, waistband, hands, hems, and shoes. Review each neutral body using its separate Base/Body.svg export. Check the two requested cross-combinations: cascade + soft eyes + smile + evening + moon; updo + almond eyes + full lips + tailored + pearls. Each model's combinations.svg provides nine assembled review samples. Record visual findings and approval with its baseline fingerprint. Browser spot checks verified model switching, independent selections and saved-look reload; these do not constitute exhaustive visual sign-off.

The vector illustration is an engineering prototype. Detailed painted hair, fabric texture, and premium semi-realistic face rendering remain a production art pass after explicit mannequin approval; never regenerate a locked mannequin to make those assets fit. Bulk generation has intentionally not started. `assets-src/character-studio/` contains one woman and one man illustrated style reference with original prompts and actual image metadata, generated using built-in image_gen. They are flattened, unapproved, not rig-compatible, and never loaded by the modular renderer. Their native pixel dimensions are recorded honestly; they are not high-resolution layered production masters.

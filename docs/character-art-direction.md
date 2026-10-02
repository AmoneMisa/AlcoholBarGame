# Production art acceptance contract

The user's visual target is authoritative: refined, idealized, semi-realistic **2D illustration** suitable for a premium visual novel. The existing SVGs demonstrate architecture only; they must not be described as finished production character art.

## Art gates

1. The user approved both existing technical foundations on 2026-10-01. The recorded contract is `assets-src/character-studio/production/technical-approval.json`. This supersedes the earlier request for mannequin approval. Keep both canonical body geometries, anchors, hierarchy, recoloring logic, animation, exports and rig separation unchanged. Do not request another technical approval or create a new mannequin proposal.
2. Measure each illustrated asset's actual native dimensions, alpha and landmarks against its own rig. Generation does not establish alignment. Never fit or stretch the mannequin to artwork. Asset silhouettes may differ from their old placeholder silhouettes, but attachment points, facial anchors and compatibility must remain valid. Silhouette IoU alone cannot establish either acceptance or rejection of a hairstyle.
3. Preserve original source files, native resolution, alpha and checksums. High-resolution artwork is the source, not an upscale of runtime textures. Rasterizing an SVG guide at 2400 × 4000 produces a development guide, not a painted master. Production art acceptance remains separate from the already approved technical foundation.
4. Author editable, aligned layers against the approved source: skin/base, facial features, rear/front hair, clothes by material region, accessories and foreground details. Preserve the approved base pixels; correct the asset whenever an alignment fails. Retain masks, shading, highlights and linework separately where color or animation requires them.
5. Pass the complete mandatory small prototype and visual combination review before bulk generation. Structural tests are necessary but cannot certify beauty, edge quality, material rendering or lack of visual clipping.

## Rendering standard

Faces: sophisticated adult proportions, expressive slightly idealized eyes with layered iris color, fine lashes, modeled lids, subtle tear-line highlights and orbital shading; softly modeled noses, volumetric lips, controlled cheek color and smooth illustrated skin. No photographic pores, photographic noise, waxy CGI, thick comic outlines, flat cel shading, simplified cartoon features or uncanny photographic faces.

Hair: designed major masses, intentional strand flow, layered primary and reflected highlights, readable separate bangs and loose strands. No helmet silhouette, plastic finish, blurry clumps or random noisy strands. Color masks must preserve strand definition.

Clothing: distinct silk/satin, velvet, cotton, leather, lace, wool and metal behavior. Controlled folds, stitching, embroidery, lace, translucent materials and jewelry must remain legible at native resolution. No melted ornamentation, smeared textures or blur used to conceal defects.

All layers: crisp anti-aliased silhouettes, consistent detail density, upper-left soft illustrated lighting, identical geometry/camera/canvas. Original designs only. The result must read as a beautiful illustration gently alive, not a 3D model.

## Required review evidence

Keep native-resolution face, hairline, hand, jewelry and material crops; alpha on both light and dark backgrounds; anchor overlay; clothing material recolor comparisons; three recolors of the exact same hairstyle; both requested cross-combinations; rest and extreme idle-frame comparisons. Record actual dimensions rather than claiming a prompted resolution was delivered. Do not call a flattened render an editable layered master.

The earlier base-only raster request was rejected by the image tool's sexual-content filter. No raster mannequin was accepted or substituted. A subsequent fully clothed generation is strictly a **visual style reference**, not a base, modular asset, or approved production master. Its anatomy is not asserted to match the prototype. Keep it separate from the canonical library; do not layer the SVG assets over it or use it to replace the approved geometry.

The male counterpart follows the same rule. Both style references and their prompts/metadata are saved in `assets-src/character-studio/`; both are native 971 × 1619 transparent PNGs. Neither is advertised as a high-resolution editable master. The male structural rig is independently authored and protected; it is not derived by stretching the woman's mannequin. Asset libraries remain separated under `Character/Woman/` and `Character/Man/`.

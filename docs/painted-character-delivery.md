# Painted character view

The first assembled female view uses the approved painted face direction, a
continuous teal full-body dress, front/back hair and crescent earrings. The
mannequin geometry, anchor coordinates, camera, depth order and motion pivots
remain unchanged. The original geometry remains the invisible fitting mask.

Wearable items are top, bottom, full-body, hair, ear accessories, eye accessories
and optional special items (wings, tails, animal ears). Face parts remain separate.
Internal material masks, lace and metal decorations belong to their garment;
they are not separately selectable clothing fragments. This limited look uses
one full-body garment. Additional item categories need their own fitted artwork.

Runtime art is in `public/assets/Character/Painted`. Each PNG has a fixed logical
rectangle in `manifest.json`. Master generated PNGs and exact prompts are retained
in `assets-src/character-studio/painted-look/sources`. Their native resolutions
are preserved; registered derivatives are not claimed as new native detail.

The renderer composes these independent images. SVG supplies placement, invisible
rig masks and color filters, not the visible character illustration. Exports embed
the PNGs so the resulting SVG is self-contained. The existing JSON look format is
unchanged. Source geometry and both rig fingerprints are checked by tests.

Use **Woman → Load painted look** in the studio. Existing saved looks are retained.
Other options remain development artwork and are labeled as a mixed/development
look. The male painted assembly is in progress; its clothing registration still
needs seam correction before it can be called finished. No bulk variants were added.

Rebuild derivatives in this order:

```powershell
node --import ./tests/register.mjs scripts/export-painted-faces.mjs
node --import ./tests/register.mjs scripts/register-painted-outfits.mjs
node scripts/pack-painted-look.mjs
node --import ./tests/register.mjs scripts/preview-painted-look.mjs
```

Do not edit the immutable mannequin to fit an asset. Correct that asset's source,
registration or masks. The female garment uses one continuous mapping across its
width; independently rescaling disconnected scanline fragments caused the earlier
horizontal seams and must not be reintroduced.

# Modular bar generation — 7 October 2026, batch 04

Loft and Library now have complete clean modular sets and are enabled in gameplay. Built-in `image_gen` produced eight illustrations: reconstructed architecture, empty shelving, a complete counter and one reusable stool per room. Clean exterior layers are exported from the generated architecture through registered window masks.

## Saved assets

- `public/assets/bar/modular/{loft,library}/`: `architecture.webp`, `exterior.webp`, `window-mask.png` and `clean-ready/{counter,shelf,seat}.webp`, with matching `composite-ready` runtime copies.
- Original PNGs: `assets-src/bar-modular/{loft,library}/*-2026-10-07-04.png`. Source-art directories are ignored by the repository.
- [Exact prompts, source paths and furniture registration](../../scripts/modular-generation-batch-2026-10-07-04.json).
- [Dimensions and alpha report](generated-batch-2026-10-07-04.json).
- [Assembled rooms and isolated furniture](generated-batch-2026-10-07-04.webp).

## Review

Loft preserves its brick walls, riveted steel columns, ceiling beams, industrial pendant lights and sunset city windows. Plants, lounge furniture and brewing props are removed, and uninterrupted brickwork and tiled floor replace hidden surfaces. The three connected empty steel shelving units have three side compartments and four central compartments; bottle presets follow their actual board heights. The concrete counter includes its complete steel upright and bottom plinth. Its sprite retains the transparent left-hand area required by the original room composition. One whole wooden-seat iron stool supplies all four runtime seat anchors.

Library preserves both levels of fixed book walls, books, balcony railing, ladder, chandelier, paintings, arched window and fireplace. Its lower central liquor cabinet is separate from the fixed bookcases. The cabinet has three empty levels, its own backing and brass edges. The mahogany counter includes its empty worktop, carved facade and complete plinth. One whole burgundy/brass stool supplies all five seat anchors. Loose lounge furniture, rugs, plants, lamps and tabletop objects are removed; the parquet floor is reconstructed.

Generated window registration is stored in each scene manifest and reproduced by the installer. Loft masks use individual panes to retain the mullions. Library isolates the blue glass within its window bounds, retaining the arched frame and dark glazing bars. The architecture and exterior alpha layers complement one another. Window colors outside the conservative Loft pane cutouts remain in the architecture plate.

## Validation

All eight installed exports match their runtime copies; dimensions and alpha ranges pass checks. Both stools retain transparent margins around their complete silhouettes, including all feet. Both exterior exports match their runtime copies and their alpha masks. Recombined architecture/exterior opacity covers the entire canvas. Sampled Loft mullions remain opaque in the architecture layer. The assembled rooms, isolated furniture and window masks were visually reviewed.

All 15 themed-bar/scene-motion tests, Vue/TypeScript checking and the client production build pass. A live gameplay browser check was not performed.

Ready sets: **9 of 74** — Velvet, Garden, Skyline, Inferno Penthouse, Speakeasy, Jazz Cellar, Art Deco, Loft and Library. Remaining: **65** rooms and 195 furniture roles.

# Modular bar generation — 7 October 2026, batch 05

Izakaya and Underground now have complete clean modular sets and are enabled in gameplay. Built-in `image_gen` produced eight final modules: architecture, empty rear shelving, a whole counter and one reusable seat per room. Ten generation calls include two targeted corrections to Underground furniture.

## Saved assets

- `public/assets/bar/modular/izakaya/`: `architecture.webp`, separate clean `exterior.webp`, `window-mask.png` and `clean-ready/{counter,shelf,seat}.webp`, with matching runtime copies.
- `public/assets/bar/modular/underground/`: `architecture.webp` and `clean-ready/{counter,shelf,seat}.webp`, with matching `composite-ready` copies. This room has no windows.
- Selected source PNGs: `assets-src/bar-modular/{izakaya,underground}/*-2026-10-07-05.png`. The two input variants used for corrections are saved alongside them as `*-2026-10-07-05-initial.png`. Source-art directories are ignored by the repository.
- [Exact prompts, revision inputs, source paths and furniture registration](../../scripts/modular-generation-batch-2026-10-07-05.json).
- [Export dimensions and alpha report](generated-batch-2026-10-07-05.json).
- [Assembled rooms and isolated furniture](generated-batch-2026-10-07-05.webp).

## Review

Izakaya preserves its ceiling beams, paper lanterns, shoji, painted noren curtains and autumn garden. Removed furniture is replaced by continuous timber wall panels and floor. The main empty liquor cabinet has three illuminated shelves; the narrow right cabinet retains its empty upper cubbies and three lower compartments. Separate bottle bays follow each cabinet's board heights. The wooden counter has a clean worktop, restored facade and whole base. One dark wooden chair with a woven straw seat, backrest, four complete legs and crossbars supplies all four seat anchors, registered to the source chairs.

The garden exterior comes from the generated architectural plate, avoiding indoor props baked into the view. Conservative opening masks retain the curtain, upright frame and left glazing bars. Some garden pixels beyond the cutouts remain in the architecture.

Underground preserves its three stone arches, riveted copper bands, pipes, hanging lights and embedded amber/blue crystals. Its open rear racks have three side levels and two central levels, with transparent spaces between boards and rack groups. A continuous lower storage cabinet and empty rear worktop are part of the shelf sprite. The rack gaps were corrected to reveal the stone pillars. The foreground counter has a complete wood facade and brass plinth; accidentally generated stone patches were replaced with continuous timber. One complete burgundy/brass stool supplies all five anchors. Its full feet are present in the asset; the original close camera crops the lower legs in the room assembly.

## Validation

All eight exports match their runtime copies. Dimensions and alpha ranges pass checks. Both seat sprites retain transparent margins around their complete silhouettes and feet. Izakaya's exterior alpha matches its mask, the architecture/exterior opacity covers the whole canvas, and sampled curtains/frame remain opaque in architecture. Underground has no exterior export. Both assembled rooms and all final modules were visually reviewed.

All 15 themed-bar/scene-motion tests, Vue/TypeScript checking and the client production build pass. A live gameplay browser check was not performed.

Ready sets: **11 of 74** — Velvet, Garden, Skyline, Inferno Penthouse, Speakeasy, Jazz Cellar, Art Deco, Loft, Library, Izakaya and Underground. Remaining: **63** rooms and 189 furniture roles.

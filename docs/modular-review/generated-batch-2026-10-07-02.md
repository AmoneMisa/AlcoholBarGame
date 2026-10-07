# Modular bar generation — 7 October 2026, batch 02

Inferno Penthouse and Speakeasy now have complete clean modular sets and are enabled in gameplay. Built-in `image_gen` produced eight individual illustrations: reconstructed architecture, empty shelving, a full counter and one complete reusable seat per room. The same seat sprite is used for all five seat anchors.

## Saved assets

- `public/assets/bar/modular/inferno-penthouse/`: `architecture.webp`, clean separated `exterior.webp`, and `clean-ready/{counter,shelf,seat}.webp`, with matching `composite-ready` runtime copies.
- `public/assets/bar/modular/speakeasy/`: `architecture.webp` and `clean-ready/{counter,shelf,seat}.webp`, with matching `composite-ready` runtime copies. This room has no exterior windows.
- Original generated PNGs: `assets-src/bar-modular/inferno-penthouse/*-2026-10-07-02.png` and `assets-src/bar-modular/speakeasy/*-2026-10-07-02.png`. Source-art directories are ignored by the repository.
- [Exact prompts, generation paths and registration rectangles](../../scripts/modular-generation-batch-2026-10-07-02.json).
- [Export dimensions and alpha report](generated-batch-2026-10-07-02.json).
- [Packed assembly and isolated furniture preview](generated-batch-2026-10-07-02.webp).

## Review

Inferno keeps its monumental windows, curtains, balcony, double staircase, fixed gold sculptures and lighting. The removed furniture is replaced by continuous marble walls/floor. Its small central shelf stays beneath the balcony. The foreground counter contains an unobstructed worktop and whole marble front. A complete burgundy velvet chair replaces the old extraction that contained room/counter pixels; all legs are present in the source sprite. The foreground camera continues to crop the lower legs in the assembled room, as in the original composition.

Speakeasy keeps its brick barrel arch, door, curtains, niche positions and fixed lighting. Three independent empty arched cabinets are registered to the niches. Runtime bottle presets use three separate bays, avoiding the brick gaps. The complete wooden counter has restored front panels behind the removed stools. The single brass pedestal stool has continuous upholstery, footrest ring and base, with transparent spaces around its supports.

The exporter now handles seating, windowless rooms and uniquely named batches without overwriting earlier previews. Explicit content registration restores generated padding to the measured furniture slots. Reports can be refreshed without re-encoding unrelated reference art, and the composite builder can update selected scenes only.

## Validation

All eight installed modules match their runtime copies. Canvas/crop dimensions and alpha channels pass checks. Both seat sprites have opaque furniture strictly inside transparent margins, including complete feet/base. Both assembled rooms and all isolated furniture were visually reviewed. All 15 themed-bar/scene-motion tests pass; Vue/TypeScript checking and the client production build pass. A live gameplay browser check was not performed.

Ready sets: **5 of 74** — Velvet, Garden, Skyline, Inferno Penthouse and Speakeasy. Remaining: **69** rooms, with 207 furniture roles still queued.

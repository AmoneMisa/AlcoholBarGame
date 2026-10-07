# Modular bar generation — 7 October 2026, batch 03

Jazz Cellar and Art Deco now have complete clean modular sets and are enabled in gameplay. Built-in `image_gen` produced nine illustrations: reconstructed architecture, empty shelving, a complete counter and one reusable seat per room, plus the separate Jazz Cellar band setup.

## Saved assets

- `public/assets/bar/modular/jazz-cellar/`: `architecture.webp` and `clean-ready/{counter,shelf,seat,band}.webp`, with matching `composite-ready` runtime copies.
- `public/assets/bar/modular/art-deco/`: `architecture.webp` and `clean-ready/{counter,shelf,seat}.webp`, with matching runtime copies.
- Original PNGs: `assets-src/bar-modular/{jazz-cellar,art-deco}/*-2026-10-07-03.png`. Source-art directories are ignored by the repository.
- [Exact prompts, source paths and registration rectangles](../../scripts/modular-generation-batch-2026-10-07-03.json).
- [Dimensions and alpha report](generated-batch-2026-10-07-03.json).
- [Assembled rooms and isolated modules](generated-batch-2026-10-07-03.webp).

## Review

Jazz Cellar preserves the brick vault, portraits, red curtain, stage and parquet floor. The piano, bench, drum kit, bass, saxophone and stands form a separate transparent decorative layer behind the shelving. Two tall empty shelf towers and low central cabinets frame the stage. The green counter includes its whole front and base; the brass stool includes its complete pedestal, footrest and base.

Art Deco preserves the gold fan, wall panels, lamps and diamond floor. Three empty shelving units are registered below the fan. The black marble counter includes its full curved front, gold pattern and base. The green chair includes its back, seat, pedestal and footrest, with transparent surrounding pixels.

Both rooms use one seat sprite for all five anchors. Bottle presets use two independent bays in Jazz Cellar and three in Art Deco. Bottles on generated furniture are limited by shelf row spacing. Decorative modules participate in runtime export and production-readiness checks.

## Validation

All nine installed exports match their runtime copies; dimensions and alpha ranges pass checks. Both seats retain transparent margins around their complete silhouettes. The assembled rooms and isolated modules were visually reviewed. All 15 themed-bar/scene-motion tests, Vue/TypeScript checking and the client production build pass. A live gameplay browser check was not performed.

Ready sets: **7 of 74** — Velvet, Garden, Skyline, Inferno Penthouse, Speakeasy, Jazz Cellar and Art Deco. Remaining: **67** rooms and 201 furniture roles.

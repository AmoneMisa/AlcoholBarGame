# Modular bar generation — 7 October 2026

Garden and Skyline now have complete clean modular sets. Built-in `image_gen` generated six individual assets: one reconstructed architecture plate, one empty shelf module and one complete counter for each room. Both scene contracts require only counter and shelf; neither has reusable seating anchors.

Final runtime files are in `public/assets/bar/modular/garden/` and `public/assets/bar/modular/skyline/`: `architecture.webp`, `exterior.webp`, `clean-ready/counter.webp`, `clean-ready/shelf.webp`, and their `composite-ready` copies. Window views are separated from the clean generated plates so interior plants and furniture cannot leak into the exterior layer. The original paintings and preparatory references remain available.

The counters extend to the bottom of the room canvas and contain both the worktop and front panels. Generated transparent padding is registered to the existing counter top anchors. Garden's bottle placement bay matches the main empty shelving. Generated shelf artwork keeps its own backing and rails; runtime presets add bottles without painting a solid panel over the illustration.

Both scenes are enabled for gameplay after visual review of the packed assembly. Other unfinished scenes stay in authoring status. The compositor packing script now prefers clean furniture over the preparation cuts.

Exact prompts and generation paths: [batch manifest](../../scripts/modular-generation-batch-2026-10-07.json). Project copies of original generated PNGs: `assets-src/bar-modular/garden/` and `assets-src/bar-modular/skyline/` (the project ignores source-art directories). Export dimensions and alpha checks: [packing report](generated-batch-2026-10-07.json). [Assembly preview](generated-batch-2026-10-07.webp).

Validation: all 15 themed-bar and scene-motion tests pass, Vue/TypeScript checking passes, and the client production build passes. Alpha and packed dimensions were checked; both assemblies were visually reviewed. A live gameplay browser check was not performed.

Overall clean production sets: 3 of 74 (Velvet, Garden, Skyline). Remaining: 71 rooms.

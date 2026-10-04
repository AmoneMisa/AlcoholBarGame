# Optional living bar

Character → Settings → Graphics → Bar animation → Animated · living bar. Static is the default, including when the existing graphics setting is Full. The device preference persists independently of the Telegram account.

Implemented effects:

- Soft warm light for interiors; cool cyan/pink light for selected neon and game themes.
- Water shimmer over reviewed ocean regions in Beach Club and Marina.
- Moving light and shadow over three reviewed curtain regions in Parisian Salon.
- Caustic water highlights in the underwater bar's central window and counter reflection.
- Snow confined to the winter bar's mountain window; fireflies around the botanical room's greenery.
- Subtle breathing and sway for both bartenders and every costume. This uses a compositor transform on existing character artwork; it does not replace costumes with an animated bitmap or add face/limb animation.

Background light effects use transparent animated WebP layers. Gentle wind adds localized WebGL1 displacement: curtain folds sway in Parisian Salon and foliage moves in Beach Club and the botanical room. It reuses the selected background URL, matches its cover crop and color tint, and leaves objects outside reviewed regions untouched. Wind draws at most 20 times per second, with a canvas capped at 768 × 512 pixels and no high-DPI multiplier. Its code loads only for eligible animated rooms. WebGL failure disables wind for the session while other effects remain available; unmounting releases GPU resources. Rooms outside the reviewed locations receive ambient light only.

| Shared layer | Transfer size | Frames | Frame dimensions |
|---|---:|---:|---:|
| Warm light | 49,888 bytes | 20 | 256 × 128 |
| Neon light | 51,406 bytes | 20 | 256 × 128 |
| Water shimmer | 34,840 bytes | 20 | 256 × 64 |
| Curtain shimmer | 34,146 bytes | 20 | 64 × 160 |
| Water caustics | 43,750 bytes | 20 | 128 × 96 |
| Window snow | 10,566 bytes | 20 | 128 × 160 |
| Garden fireflies | 9,066 bytes | 20 | 192 × 128 |

Each loops over four seconds. A normal animated room requests one light file; themed rooms add one shared local-effect file, even when it appears in multiple regions. All decoded frame pixels total at most 2.5 MiB per light asset; that calculation is a pixel-area bound, not measured browser memory.

Static mode mounts no animated image or wind canvas. Lite graphics and the OS reduced-motion preference suppress animation even when Animated was selected. Switching away from the bar or hiding the browser unmounts effects and stops bartender breathing. Screenshots and design previews stay static. Missing motion images are removed; the original painting remains visible.

Generate the procedural layers with `node scripts/build-scene-motion.mjs` using the bundled Sharp runtime or ART_SHARP_PATH. Add specific room regions in src/domain/sceneMotion.ts after checking the painting; effects follow cover cropping on desktop/mobile. Preview the effects with Vite at /scripts/scene-motion-preview.html. The preview is a development artifact and is not a production entrypoint.

Validation: scene-motion, performance and UI-kit tests; type check; client and server builds. Browser checked default static, enable, leave-bar stop, reload persistence, Lite suppression, and desktop/mobile placement. Real-device FPS has not been measured.
